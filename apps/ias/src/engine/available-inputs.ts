import type {
  Build,
  CharacterId,
  SkillId,
  TableVariable,
  WeaponId,
  Wereform,
} from "@/contracts/build";
import type { AvailableInputs } from "@/contracts/engine";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import { playerCharacters } from "@/data/rules/characters";
import {
  fieldRules,
  fixedTableVariables,
  type FormFacts,
  type OffHand,
  type SkillFacts,
  type WieldFacts,
  tableVariableFallbacks,
  tableVariableOffers,
  wereformOffers,
} from "@/data/rules/form-fields";
import { classSkills, commonSkills, oskills } from "@/data/rules/skill-lists";
import { skillRule } from "@/data/rules/skills";
import { weaponById } from "@/engine/context";
import { resolveCeilings, resolveFloors } from "@/engine/floors";
import { unarmed, weaponOffer } from "@/engine/weapon-offer";
import { keysOf } from "@/lib/keys";

/** A build's select values, each coerced to what the form offers, with the resulting spec. */
export interface ResolvedForm {
  readonly wereform: Wereform;
  readonly skill: SkillId;
  readonly primary: WeaponId;
  readonly secondary: WeaponId;
  readonly tableVariable: TableVariable;
  readonly spec: InputSpec;
}

const fieldIds: readonly FieldId[] = keysOf(fieldRules);

function isSkillId(option: SkillId | "divider"): option is SkillId {
  return option !== "divider";
}

function first<T>(options: readonly T[]): T {
  const [option] = options;

  if (option === undefined) {
    throw new Error("a select offers no option");
  }

  return option;
}

/** The value if offered, else the first option, as the original selects do after a refill. */
function pick<T>(options: readonly T[], value: T): T {
  return options.includes(value) ? value : first(options);
}

/** Source: calculator.js:503-673@bcc112d. */
function skillOptions(
  character: CharacterId,
  wereform: Wereform,
): readonly (SkillId | "divider")[] {
  const player = playerCharacters.has(character);
  const common = player
    ? [
        ...commonSkills.everyone,
        ...(wereform === "none" ? commonSkills.humanPlayers : commonSkills.shapeshiftedPlayers),
      ]
    : commonSkills.everyone;

  const own = [...common, ...(classSkills[character][wereform] ?? [])];

  const extra = player
    ? oskills.skills.flatMap((oskill) =>
        (oskill.characters === "players" || oskill.characters.includes(character)) &&
        oskill.wereforms.includes(wereform) &&
        !own.includes(oskill.skill)
          ? [oskill.skill]
          : [],
      )
    : [];

  return extra.length === 0 ? own : [...own, "divider", ...extra];
}

function offHandOf(shown: boolean, secondary: WeaponId): OffHand {
  if (!shown) {
    return "hidden";
  }

  return secondary === unarmed.id ? "empty" : "armed";
}

function fixedTableVariable(skill: SkillId): TableVariable {
  const fixed = fixedTableVariables.find((entry) => entry.skill === skill);

  if (fixed === undefined) {
    throw new Error(`the skill ${skill} hides the table variable without fixing it`);
  }

  return fixed.variable;
}

interface SkillStage {
  readonly wereforms: readonly Wereform[];
  readonly skills: readonly (SkillId | "divider")[];
  readonly facts: SkillFacts;
}

function resolveSkill(build: Build): SkillStage {
  const { character } = build;
  const player = playerCharacters.has(character);
  const wereforms = wereformOffers[character];
  const wereform = pick(wereforms, build.wereform);
  const skills = skillOptions(character, wereform);
  const skill = pick(
    skills.filter((option) => isSkillId(option)),
    build.skill,
  );

  const { canDualWield, dualWieldOnly } = skillRule(skill);
  const facts = { character, player, wereform, skill, canDualWield, dualWieldOnly };

  return { wereforms: fieldRules.wereform.shown(facts) ? wereforms : [wereform], skills, facts };
}

interface WeaponStage {
  readonly primaryWeapons: readonly WeaponId[];
  readonly secondaryWeapons: readonly WeaponId[];
  readonly primary: WeaponId;
  readonly secondary: WeaponId;
  readonly facts: WieldFacts;
}

function resolveWeapons(build: Build, facts: SkillFacts): WeaponStage {
  const offer = weaponOffer(facts);
  const { primaryWeapons } = offer;
  const primary = pick(primaryWeapons, build.primary);
  const primaryWeapon = weaponById(primary);
  const gripFacts = { ...facts, primaryClass: primaryWeapon.weaponClass };

  const secondaryShown = fieldRules.secondary.shown(gripFacts);
  const secondaryWeapons = secondaryShown ? offer.secondaryWeapons(primaryWeapon) : [unarmed.id];
  const secondary = pick(secondaryWeapons, build.secondary);

  return {
    primaryWeapons,
    secondaryWeapons,
    primary,
    secondary,
    facts: { ...gripFacts, offHand: offHandOf(secondaryShown, secondary) },
  };
}

function tableVariableOptions(facts: WieldFacts): readonly TableVariable[] {
  if (!fieldRules.tableVariable.shown(facts)) {
    return [fixedTableVariable(facts.skill)];
  }

  return tableVariableOffers.flatMap((offer) => (offer.offered(facts) ? [offer.variable] : []));
}

/**
 * Coerces the selects in the canonical order: character, wereform, skill, primary, secondary, then
 * table variable, because each list depends on the choices before it. A hidden select offers only
 * the value it is reset to.
 */
export function resolveForm(build: Build): ResolvedForm {
  const { wereforms, skills, facts: skillFacts } = resolveSkill(build);
  const weapons = resolveWeapons(build, skillFacts);
  const tableVariables = tableVariableOptions(weapons.facts);

  const tableVariable =
    [build.tableVariable, ...tableVariableFallbacks.order].find((variable) =>
      tableVariables.includes(variable),
    ) ?? first(tableVariables);

  const facts: FormFacts = { ...weapons.facts, tableVariable };
  const fields = new Set(fieldIds.filter((field) => fieldRules[field].shown(facts)));

  return {
    wereform: skillFacts.wereform,
    skill: skillFacts.skill,
    primary: weapons.primary,
    secondary: weapons.secondary,
    tableVariable,
    spec: {
      wereforms,
      skills,
      primaryWeapons: weapons.primaryWeapons,
      secondaryWeapons: weapons.secondaryWeapons,
      tableVariables,
      fields,
      floors: resolveFloors({
        facts,
        primary: weaponById(weapons.primary),
        secondary: weaponById(weapons.secondary),
        fields,
        tableVariable,
      }),
      ceilings: resolveCeilings({ facts, fields, tableVariable }),
    },
  };
}

export const availableInputs: AvailableInputs = (build) => resolveForm(build).spec;

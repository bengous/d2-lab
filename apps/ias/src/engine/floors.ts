import type { Build, SpeedNumberField, TableVariable } from "@/contracts/build";
import type { WeaponData } from "@/contracts/game-data";
import type { Ceilings, FieldId, Floor, Floors, InputSpec } from "@/contracts/inputs";
import { isRunewordBase, type RunewordRequirement, runewordBases } from "@/data/rules/equipment";
import { variableFields } from "@/data/rules/field-values";
import { ceilingRules, type FloorRule, floorRules, type FloorTarget } from "@/data/rules/floors";
import type { SkillFacts } from "@/data/rules/form-fields";
import { neededRuneword } from "@/engine/weapon-offer";

export interface FloorForm {
  readonly facts: SkillFacts;
  readonly primary: WeaponData;
  readonly secondary: WeaponData;
  readonly fields: ReadonlySet<FieldId>;
  readonly tableVariable: TableVariable;
}

function counts(
  field: SpeedNumberField,
  form: Pick<FloorForm, "fields" | "tableVariable">,
): boolean {
  return form.fields.has(field) || variableFields[form.tableVariable] === field;
}

function applies(
  rule: FloorRule,
  facts: SkillFacts,
  runeword: RunewordRequirement | null,
): boolean {
  return rule.when.kind === "runeword"
    ? runeword?.runeword === rule.when.runeword
    : rule.when.applies(facts);
}

interface Hand {
  readonly weapon: WeaponData;
  readonly field: SpeedNumberField;
}

interface Floored {
  readonly field: SpeedNumberField;
  readonly floor: Floor;
}

/** The IAS field of the hand that carries the runeword, main hand first, else the IAS field. */
function weaponIasField(form: FloorForm, runeword: RunewordRequirement | null): SpeedNumberField {
  if (runeword === null) {
    throw new Error("a weapon IAS floor applies to a build that needs no runeword");
  }

  const base = runewordBases[runeword.runeword];
  const hands: readonly Hand[] = [
    { weapon: form.primary, field: "primaryWias" },
    { weapon: form.secondary, field: "secondaryWias" },
  ];

  const hand = hands.find(({ weapon }) => isRunewordBase(weapon, base));

  if (hand === undefined) {
    throw new Error(`neither hand carries the ${runeword.runeword} runeword the build needs`);
  }

  return counts(hand.field, form) ? hand.field : "ias";
}

function fieldOf(
  target: FloorTarget,
  form: FloorForm,
  runeword: RunewordRequirement | null,
): SpeedNumberField {
  return target === "weapon-ias" ? weaponIasField(form, runeword) : target;
}

/**
 * The floors of the build, on the fields that count for the calculation only. Two rules never
 * floor the same field of a build.
 */
export function resolveFloors(form: FloorForm): Floors {
  const runeword = neededRuneword(form.facts);
  const floored: readonly Floored[] = floorRules.flatMap((rule) =>
    applies(rule, form.facts, runeword)
      ? [
          {
            field: fieldOf(rule.target, form, runeword),
            floor: { min: rule.min, origin: rule.origin },
          },
        ]
      : [],
  );

  const fields = floored.map(({ field }) => field);
  const doubled = fields.find((field, index) => fields.indexOf(field) !== index);

  if (doubled !== undefined) {
    throw new Error(`two floor rules apply to ${doubled}`);
  }

  return Object.fromEntries(
    floored.flatMap(({ field, floor }) => (counts(field, form) ? [[field, floor]] : [])),
  );
}

/** The ceilings of the build, on the fields that count for the calculation only. */
export function resolveCeilings(form: Omit<FloorForm, "primary" | "secondary">): Ceilings {
  return Object.fromEntries(
    ceilingRules.flatMap((rule) =>
      rule.applies(form.facts) && counts(rule.field, form) ? [[rule.field, rule.max]] : [],
    ),
  );
}

/**
 * Raises each field under its floor and lowers each field over its ceiling, or `current` when the
 * field is the table variable.
 */
export function withBounds(
  build: Build,
  { floors, ceilings }: Pick<InputSpec, "floors" | "ceilings">,
): Build {
  const held = variableFields[build.tableVariable];
  const { speed } = build;
  const bound = (field: SpeedNumberField, value: number): number => {
    const raised = Math.max(value, floors[field]?.min ?? value);

    return Math.min(raised, ceilings[field] ?? raised);
  };

  const boundSpeed = (field: SpeedNumberField): number =>
    field === held ? speed[field] : bound(field, speed[field]);

  return {
    ...build,
    current: held === null ? build.current : bound(held, build.current),
    speed: {
      ias: boundSpeed("ias"),
      primaryWias: boundSpeed("primaryWias"),
      secondaryWias: boundSpeed("secondaryWias"),
      fanaticism: boundSpeed("fanaticism"),
      burstOfSpeed: boundSpeed("burstOfSpeed"),
      werewolf: boundSpeed("werewolf"),
      maul: boundSpeed("maul"),
      frenzy: boundSpeed("frenzy"),
      purge: boundSpeed("purge"),
      cleave: boundSpeed("cleave"),
      mirroredBlades: boundSpeed("mirroredBlades"),
      markOfTheBear: speed.markOfTheBear,
    },
  };
}

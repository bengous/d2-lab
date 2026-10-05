import type { CharacterId, SkillId, WeaponId } from "@/contracts/build";
import type { WeaponData } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { playerCharacters } from "@/data/rules/characters";
import {
  classItemUsers,
  isRunewordBase,
  type ItemTypeFilter,
  runewordBases,
  type RunewordRequirement,
  runewordRequirements,
  secondaryCandidates,
  unarmedAlwaysAllowed,
  type WeaponFilter,
  type WeaponSlot,
  weaponRequirements,
} from "@/data/rules/equipment";
import { fieldRules, type SkillFacts } from "@/data/rules/form-fields";
import { skillItemTypeRequirements } from "@/data/rules/skill-item-types";
import { weaponById } from "@/engine/context";

export const unarmed = unarmedWeapon();

const requirements = [...weaponRequirements, ...skillItemTypeRequirements];

function unarmedWeapon(): WeaponData {
  const found = gameData.weapons.find((weapon) => weapon.id === "unarmed");

  if (found === undefined) {
    throw new Error("the game data has no unarmed weapon");
  }

  return found;
}

/** Source: D2MOO D2Skills.cpp:sub_6FDB1130@5596f5c. */
function countsAs(weapon: WeaponData, { itypes, etypes, emptyHand }: ItemTypeFilter): boolean {
  if (weapon.id === unarmed.id) {
    return emptyHand;
  }

  return (
    (itypes.length === 0 || weapon.itemTypes.some((type) => itypes.includes(type))) &&
    !weapon.itemTypes.some((type) => etypes.includes(type))
  );
}

function matches(filter: WeaponFilter, weapon: WeaponData): boolean {
  return (
    (filter.weaponClasses?.includes(weapon.weaponClass) ?? true) &&
    (filter.itemClasses?.includes(weapon.itemClass) ?? true) &&
    (filter.itemTypes === undefined || countsAs(weapon, filter.itemTypes))
  );
}

function classItemAllowed(weapon: WeaponData, character: CharacterId): boolean {
  if (weapon.restrictedTo === null) {
    return true;
  }

  const users = classItemUsers[weapon.restrictedTo];

  if (users === undefined) {
    throw new Error(`no rule names who may equip items restricted to ${weapon.restrictedTo}`);
  }

  return users.includes(character);
}

/** Source: calculator.js:1302-1332@bcc112d. */
function equips(
  weapon: WeaponData,
  slot: WeaponSlot,
  character: CharacterId,
  skill: SkillId,
): boolean {
  if (
    weapon.id === unarmed.id &&
    (unarmedAlwaysAllowed.skills.includes(skill) || !playerCharacters.has(character))
  ) {
    return true;
  }

  return (
    classItemAllowed(weapon, character) &&
    requirements.every(
      (requirement) =>
        !requirement.slots.includes(slot) ||
        (requirement.characters !== "all" && !requirement.characters.includes(character)) ||
        (requirement.skills !== "all" && !requirement.skills.includes(skill)) ||
        matches(requirement.filter, weapon),
    )
  );
}

function primaryOptions(character: CharacterId, skill: SkillId): readonly WeaponId[] {
  return gameData.weapons.flatMap((weapon) =>
    equips(weapon, "primary", character, skill) ? [weapon.id] : [],
  );
}

/** Source: calculator.js:476-501@bcc112d. */
function secondaryOptions(character: CharacterId, skill: SkillId): readonly WeaponId[] {
  const candidates = secondaryCandidates[character];

  if (candidates === undefined) {
    return [];
  }

  return gameData.weapons.flatMap((weapon) =>
    matches(candidates, weapon) && equips(weapon, "secondary", character, skill) ? [weapon.id] : [],
  );
}

/** The runeword the build needs, if any. */
export function neededRuneword({
  character,
  wereform,
  skill,
}: Pick<SkillFacts, "character" | "wereform" | "skill">): RunewordRequirement | null {
  return (
    runewordRequirements.find(
      (entry) =>
        entry.characters.includes(character) &&
        entry.wereforms.includes(wereform) &&
        (entry.skills === "all" || entry.skills.includes(skill)),
    ) ?? null
  );
}

/** The weapons each hand may hold. The off-hand list depends on the main-hand weapon. */
export interface WeaponOffer {
  readonly primaryWeapons: readonly WeaponId[];
  readonly secondaryWeapons: (primary: WeaponData) => readonly WeaponId[];
}

/**
 * When the build needs a runeword, the main hand holds a base of it. If either hand may carry it,
 * the main hand may instead leave the off hand open to a base; a main hand that holds no base then
 * leaves only the bases to the off hand.
 */
export function weaponOffer(facts: SkillFacts): WeaponOffer {
  const { character, skill } = facts;
  const primaries = fieldRules.primary.shown(facts)
    ? primaryOptions(character, skill)
    : [unarmed.id];

  const secondaries = (): readonly WeaponId[] => secondaryOptions(character, skill);
  const requirement = neededRuneword(facts);

  if (requirement === null) {
    return { primaryWeapons: primaries, secondaryWeapons: secondaries };
  }

  const runeword = runewordBases[requirement.runeword];

  if (requirement.hands === "primary") {
    return {
      primaryWeapons: primaries.filter((id) => isRunewordBase(weaponById(id), runeword)),
      secondaryWeapons: secondaries,
    };
  }

  const offHandBases = secondaries().filter((id) => isRunewordBase(weaponById(id), runeword));
  const allowsRuneword = (weapon: WeaponData): boolean =>
    isRunewordBase(weapon, runeword) ||
    (offHandBases.length > 0 &&
      fieldRules.secondary.shown({ ...facts, primaryClass: weapon.weaponClass }));

  return {
    primaryWeapons: primaries.filter((id) => allowsRuneword(weaponById(id))),
    secondaryWeapons: (primary) =>
      isRunewordBase(primary, runeword) ? secondaries() : offHandBases,
  };
}

import type { SkillId } from "@/contracts/build";
import type { HandItemTypes, SkillItemTypes } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { playerCharacters } from "@/data/rules/characters";
import {
  type ItemTypeFilter,
  oneHandedClasses,
  type WeaponFilter,
  type WeaponRequirement,
  type WeaponSlot,
} from "@/data/rules/equipment";
import { parseSkillId } from "@/data/rules/skills";

/**
 * The game checks the item types of a skill a player uses; the Act 2 mercenary jabs with a polearm,
 * which is no `spea`.
 */
const itemTypeChecks = {
  characters: [...playerCharacters],
  source: "D2MOO PlrMsg.cpp:sub_6FC83340@5596f5c hireling.txt:Desert Mercenary@3.3.93847",
} as const;

/** A shield, which the form leaves to the off hand without a select. */
const shieldType = "shld";

/**
 * An empty hand passes the `a` types when they lead with one of these and `b` holds none: an empty
 * main hand never opens the off-hand select, so the other hand holds no weapon.
 */
const emptyHandTypes = {
  types: ["weap", "mele", "h2h"],
  source: "D2MOO D2Skills.cpp:sub_6FDB1130@5596f5c",
} as const;

function holdsNone(hand: HandItemTypes): boolean {
  return hand.itypes.length === 0 && hand.etypes.length === 0;
}

function handFilter(itemTypes: SkillItemTypes, hand: "a" | "b"): ItemTypeFilter {
  const { a, b } = itemTypes;
  const leadsWithEmptyHandType = emptyHandTypes.types.some((type) => type === a.itypes[0]);

  return {
    ...itemTypes[hand],
    emptyHand:
      holdsNone(itemTypes[hand]) ||
      (hand === "a" && leadsWithEmptyHandType && b.itypes.length === 0),
  };
}

/**
 * The main hand matches `a` and the off hand `b`, except when `a` asks for a shield: the off hand
 * holds it, and the main hand matches `b` with one hand.
 */
function itemTypeRequirements(
  skill: SkillId,
  itemTypes: SkillItemTypes,
): readonly WeaponRequirement[] {
  const requirement = (slot: WeaponSlot, filter: WeaponFilter): WeaponRequirement => ({
    characters: itemTypeChecks.characters,
    skills: [skill],
    slots: [slot],
    filter,
    source: `skills.txt:${itemTypes.row}@${gameData.version} ${emptyHandTypes.source} ${itemTypeChecks.source}`,
  });

  if (itemTypes.a.itypes.includes(shieldType)) {
    return [
      requirement("primary", {
        weaponClasses: oneHandedClasses,
        itemTypes: handFilter(itemTypes, "b"),
      }),
    ];
  }

  return (["a", "b"] as const).flatMap((hand) =>
    holdsNone(itemTypes[hand])
      ? []
      : [
          requirement(hand === "a" ? "primary" : "secondary", {
            itemTypes: handFilter(itemTypes, hand),
          }),
        ],
  );
}

/** The weapons each hand may hold for a skill, from its `skills.txt` item types. */
export const skillItemTypeRequirements: readonly WeaponRequirement[] = Object.entries(
  gameData.skillItemTypes,
).flatMap(([skill, itemTypes]: readonly [string, SkillItemTypes]) =>
  itemTypeRequirements(parseSkillId(skill), itemTypes),
);

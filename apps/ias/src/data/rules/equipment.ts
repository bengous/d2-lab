import type { CharacterId, SkillId, Wereform } from "@/contracts/build";
import type { HandItemTypes, ItemClass, WeaponClass, WeaponData } from "@/contracts/game-data";
import { parseSkillId } from "@/data/rules/skills";

export type RunewordId = "beast" | "chaos" | "passion";

/** A weapon takes the runeword when it counts as one of the item types and holds enough sockets. */
export interface RunewordBase {
  readonly itemTypes: readonly string[];
  readonly sockets: number;
  readonly source: string;
}

/** The runewords that grant a wereform or a skill the form offers. */
export const runewordBases: Readonly<Record<RunewordId, RunewordBase>> = {
  beast: { itemTypes: ["axe", "scep", "hamm"], sockets: 5, source: "runes.txt:Beast@3.3.93847" },
  chaos: { itemTypes: ["h2h"], sockets: 3, source: "runes.txt:Chaos@3.3.93847" },
  passion: { itemTypes: ["weap"], sockets: 4, source: "runes.txt:Passion@3.3.93847" },
};

export function isRunewordBase(weapon: WeaponData, base: RunewordBase): boolean {
  return (
    weapon.maxSockets >= base.sockets &&
    weapon.itemTypes.some((itemType) => base.itemTypes.includes(itemType))
  );
}

/**
 * `either`: either of the two weapons may carry the runeword. `primary`: the main hand carries it,
 * because a beast form strikes with the main-hand weapon only.
 */
export type RunewordHands = "either" | "primary";

/** A build that needs the runeword on one of its weapons. */
export interface RunewordRequirement {
  readonly characters: readonly CharacterId[];
  readonly wereforms: readonly Wereform[];
  readonly skills: readonly SkillId[] | "all";
  readonly runeword: RunewordId;
  readonly hands: RunewordHands;
  readonly source: string;
}

/** A weapon counts as one of `itypes`, or `itypes` is empty, and as none of `etypes`. */
export interface ItemTypeFilter extends HandItemTypes {
  readonly emptyHand: boolean;
}

/** A weapon passes when it matches every list the filter holds. */
export interface WeaponFilter {
  readonly weaponClasses?: readonly WeaponClass[];
  readonly itemClasses?: readonly ItemClass[];
  readonly itemTypes?: ItemTypeFilter;
}

export type WeaponSlot = "primary" | "secondary";

export interface WeaponRequirement {
  readonly characters: readonly CharacterId[] | "all";
  readonly skills: readonly SkillId[] | "all";
  readonly slots: readonly WeaponSlot[];
  readonly filter: WeaponFilter;
  readonly source: string;
}

const bothSlots: readonly WeaponSlot[] = ["primary", "secondary"];

export const oneHandedClasses: readonly WeaponClass[] = ["hth", "ht", "1hs", "1ht", "th"];

const meleeClasses: readonly WeaponClass[] = ["hth", "ht", "1hs", "1ht", "2hs", "2ht", "stf", "th"];

const armedClasses: readonly WeaponClass[] = [
  "ht",
  "1hs",
  "1ht",
  "2hs",
  "2ht",
  "stf",
  "bow",
  "xbw",
  "th",
];

const throwable: WeaponFilter = { itemClasses: ["throwing", "javelin"] };

function skillIds(...slugs: readonly string[]): readonly SkillId[] {
  return slugs.map((slug) => parseSkillId(slug));
}

/** Unarmed passes every requirement with these skills, and for every mercenary. */
export const unarmedAlwaysAllowed = {
  skills: skillIds("standard"),
  mercenaries: true,
  source: "calculator.js:1306@bcc112d",
} as const;

/** Who may equip a weapon restricted to a class (`WeaponData.restrictedTo`). */
export const classItemUsers: Readonly<Partial<Record<CharacterId, readonly CharacterId[]>>> & {
  readonly source: string;
} = {
  amazon: ["amazon", "rogue-scout"],
  assassin: ["assassin"],
  sorceress: ["sorceress"],
  source: "calculator.js:1311-1317@bcc112d",
};

/** Weapons a character may hold in the off hand before any requirement. A missing character holds none. */
export const secondaryCandidates: Readonly<Partial<Record<CharacterId, WeaponFilter>>> & {
  readonly source: string;
} = {
  barbarian: { weaponClasses: ["hth", "1hs", "1ht", "th", "2hs"] },
  "frenzy-barbarian": { weaponClasses: ["hth", "1hs", "1ht", "th"] },
  assassin: {},
  source: "calculator.js:480-496@bcc112d",
};

export const weaponRequirements: readonly WeaponRequirement[] = [
  {
    characters: ["rogue-scout"],
    skills: "all",
    slots: bothSlots,
    filter: { weaponClasses: ["bow"] },
    source: "calculator.js:1307@bcc112d",
  },
  {
    characters: ["desert-mercenary"],
    skills: "all",
    slots: bothSlots,
    filter: { itemClasses: ["polearm", "spear", "javelin"] },
    source: "calculator.js:1308@bcc112d",
  },
  {
    characters: ["bash-barbarian"],
    skills: "all",
    slots: bothSlots,
    filter: { itemClasses: ["sword"] },
    source: "calculator.js:1309@bcc112d",
  },
  {
    characters: ["frenzy-barbarian"],
    skills: "all",
    slots: bothSlots,
    filter: { itemClasses: ["sword"], weaponClasses: oneHandedClasses },
    source: "calculator.js:1310@bcc112d",
  },
  {
    characters: [
      "amazon",
      "assassin",
      "barbarian",
      "druid",
      "necromancer",
      "sorceress",
      "warlock",
      "rogue-scout",
      "desert-mercenary",
      "bash-barbarian",
      "frenzy-barbarian",
    ],
    skills: skillIds("zeal"),
    slots: bothSlots,
    filter: { weaponClasses: meleeClasses },
    source: "calculator.js:1318@bcc112d",
  },
  {
    characters: "all",
    skills: skillIds("throw", "double-throw"),
    slots: bothSlots,
    filter: throwable,
    source: "calculator.js:1319,1328@bcc112d",
  },
  {
    characters: ["assassin"],
    skills: "all",
    slots: ["secondary"],
    filter: { weaponClasses: ["hth", "ht"] },
    source: "calculator.js:1320@bcc112d",
  },
  {
    characters: ["barbarian"],
    skills: "all",
    slots: ["secondary"],
    filter: { weaponClasses: [...oneHandedClasses, "2hs"] },
    source: "calculator.js:1321@bcc112d",
  },
  {
    characters: "all",
    skills: skillIds("strafe"),
    slots: bothSlots,
    filter: { weaponClasses: ["bow", "xbw"] },
    source: "calculator.js:1322@bcc112d",
  },
  {
    characters: ["amazon"],
    skills: skillIds("jab", "impale", "fend"),
    slots: bothSlots,
    filter: { itemClasses: ["javelin", "spear"] },
    source: "calculator.js:1323@bcc112d",
  },
  {
    characters: "all",
    skills: skillIds("dragon-claw"),
    slots: bothSlots,
    filter: { weaponClasses: ["ht"] },
    source: "calculator.js:1324@bcc112d",
  },
  {
    characters: "all",
    skills: skillIds("tiger-strike", "cobra-strike", "phoenix-strike"),
    slots: bothSlots,
    filter: { weaponClasses: meleeClasses },
    source: "calculator.js:1325@bcc112d",
  },
  {
    characters: ["assassin"],
    skills: skillIds("fists-of-fire", "claws-of-thunder", "blades-of-ice", "whirlwind"),
    slots: ["primary"],
    filter: { weaponClasses: ["ht"] },
    source: "calculator.js:1326@bcc112d",
  },
  {
    characters: ["assassin"],
    skills: skillIds("fists-of-fire", "claws-of-thunder", "blades-of-ice", "whirlwind"),
    slots: ["secondary"],
    filter: { weaponClasses: ["hth", "ht"] },
    source: "calculator.js:1326@bcc112d",
  },
  {
    characters: ["barbarian"],
    skills: skillIds("double-swing", "frenzy"),
    slots: bothSlots,
    filter: { weaponClasses: ["ht", "1hs", "1ht", "th", "2hs"] },
    source: "calculator.js:1327@bcc112d",
  },
  {
    characters: "all",
    skills: skillIds("cleave"),
    slots: bothSlots,
    filter: { weaponClasses: meleeClasses.filter((weaponClass) => weaponClass !== "hth") },
    source: "calculator.js:1329@bcc112d",
  },
  {
    characters: "all",
    skills: skillIds("mirrored-blades"),
    slots: bothSlots,
    filter: { weaponClasses: armedClasses },
    source: "calculator.js:1330@bcc112d",
  },
];

export const runewordRequirements: readonly RunewordRequirement[] = [
  {
    characters: [
      "amazon",
      "assassin",
      "barbarian",
      "necromancer",
      "paladin",
      "sorceress",
      "warlock",
    ],
    wereforms: ["werebear"],
    skills: "all",
    runeword: "beast",
    hands: "primary",
    source: "runes.txt:Beast@3.3.93847",
  },
  {
    characters: ["assassin"],
    wereforms: ["none"],
    skills: skillIds("whirlwind"),
    runeword: "chaos",
    hands: "either",
    source: "runes.txt:Chaos@3.3.93847",
  },
  {
    characters: ["amazon", "assassin", "barbarian", "druid", "necromancer", "sorceress", "warlock"],
    wereforms: ["none"],
    skills: skillIds("zeal"),
    runeword: "passion",
    hands: "either",
    source: "runes.txt:Passion@3.3.93847",
  },
  {
    characters: ["amazon", "assassin", "druid", "necromancer", "paladin", "sorceress", "warlock"],
    wereforms: ["none"],
    skills: skillIds("berserk"),
    runeword: "passion",
    hands: "either",
    source: "runes.txt:Passion@3.3.93847",
  },
];

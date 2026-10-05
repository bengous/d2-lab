import type { Build, CharacterId, SkillId, SpeedNumberField, Wereform } from "@/contracts/build";
import type { WeaponData } from "@/contracts/game-data";
import type { Ceilings, FieldId, Floor, Floors } from "@/contracts/inputs";
import { playerCharacters } from "@/data/rules/characters";
import { isRunewordBase, type RunewordId, runewordBases } from "@/data/rules/equipment";
import { variableFields } from "@/data/rules/field-values";
import { parseSkillId } from "@/data/rules/skills";
import { weaponById } from "@/engine/context";

import { weaponId } from "./builds";

/** Options of the original form that the app drops, because the game does not allow them. */
export interface RemovedOptions {
  readonly wereforms: readonly Wereform[];
  /** Skills before the original divider. */
  readonly classSkills: readonly SkillId[];
  /** Skills after the original divider. */
  readonly oskills: readonly SkillId[];
  readonly primaryWeapons: (weapon: WeaponData) => boolean;
  readonly secondaryWeapons: (weapon: WeaponData) => boolean;
  /** Fields the original form shows and the app hides: their value resets to its default. */
  readonly fields: readonly SpeedNumberField[];
}

/** Options the app offers that the original form lacks, because the game allows them. */
export interface AddedOptions {
  /** Skills after the original oskills, behind a divider. */
  readonly oskills: readonly SkillId[];
}

/** A difference from the game that the app does not reproduce. */
export interface GoldenDeviation {
  readonly rule: string;
  readonly applies: (build: Build) => boolean;
  readonly removed?: Partial<RemovedOptions>;
  readonly added?: Partial<AddedOptions>;
  readonly source: string;
}

/** Characters that take Werebear through Beast, which a beast form strikes with from the main hand. */
const beastInMainHand: ReadonlySet<CharacterId> = new Set<CharacterId>([
  "amazon",
  "assassin",
  "barbarian",
  "necromancer",
  "paladin",
  "sorceress",
  "warlock",
]);

const unarmedId = weaponId("unarmed");

function skillIds(...slugs: readonly string[]): readonly SkillId[] {
  return slugs.map((slug) => parseSkillId(slug));
}

/** The skills whose `skills.txt` row asks for `mele` in a hand. */
const meleeSkills = skillIds(
  "zeal",
  "sacrifice",
  "vengeance",
  "conversion",
  "bash",
  "stun",
  "concentrate",
  "berserk",
  "whirlwind",
  "tiger-strike",
  "cobra-strike",
  "phoenix-strike",
  "cleave",
  "double-swing",
  "frenzy",
);

function notBaseOf(runeword: RunewordId): (weapon: WeaponData) => boolean {
  return (weapon) => !isRunewordBase(weapon, runewordBases[runeword]);
}

function holdsBaseOf(runeword: RunewordId, build: Build): boolean {
  return isRunewordBase(weaponById(build.primary), runewordBases[runeword]);
}

export const goldenDeviations: readonly GoldenDeviation[] = [
  {
    rule: "Only the Druid, or the Barbarian with Wolfhowl, takes Werewolf form.",
    applies: (build) =>
      playerCharacters.has(build.character) &&
      build.character !== "druid" &&
      build.character !== "barbarian",
    removed: { wereforms: ["werewolf"] },
    source: "skills.txt:Werewolf uniqueitems.txt:Wolfhowl armor.txt:bac@3.3.93847",
  },
  {
    rule: "Fury, Rabies and Hunger are Druid skills; Wolfhowl grants Feral Rage as an oskill.",
    applies: (build) => build.character === "barbarian" && build.wereform === "werewolf",
    removed: { classSkills: skillIds("fury", "rabies", "feral-rage", "hunger") },
    source: "skills.txt:Fury,Rabies,Hunger uniqueitems.txt:Wolfhowl@3.3.93847",
  },
  {
    rule: "A beast form has no Kick animation.",
    applies: (build) => build.wereform !== "none",
    removed: { classSkills: skillIds("kick") },
    source: "animdata.d2:40KK,TGKK@3.3.93847",
  },
  {
    rule: "The Assassin cannot hold Beast and a Chaos claw together.",
    applies: (build) => build.character === "assassin" && build.wereform !== "none",
    removed: { oskills: skillIds("whirlwind") },
    source: "runes.txt:Beast,Chaos@3.3.93847",
  },
  {
    rule: "Werebear outside the Druid needs Beast in the main hand.",
    applies: (build) => build.wereform === "werebear" && beastInMainHand.has(build.character),
    removed: { primaryWeapons: notBaseOf("beast") },
    source: "runes.txt:Beast@3.3.93847",
  },
  {
    rule: "Assassin Whirlwind without Chaos in the main hand holds it in the off hand.",
    applies: (build) =>
      build.character === "assassin" &&
      build.skill === parseSkillId("whirlwind") &&
      !holdsBaseOf("chaos", build),
    removed: { secondaryWeapons: notBaseOf("chaos") },
    source: "runes.txt:Chaos@3.3.93847",
  },
  {
    rule: "Zeal outside the Paladin needs Passion.",
    applies: (build) =>
      build.skill === parseSkillId("zeal") &&
      playerCharacters.has(build.character) &&
      build.character !== "paladin",
    removed: { primaryWeapons: notBaseOf("passion") },
    source: "runes.txt:Passion@3.3.93847",
  },
  {
    rule: "A player's melee skill needs a melee weapon: no bow, crossbow or orb.",
    applies: (build) => playerCharacters.has(build.character) && meleeSkills.includes(build.skill),
    removed: {
      primaryWeapons: (weapon) => weapon.itemClass === "missile" || weapon.itemClass === "orb",
    },
    source:
      "skills.txt:Zeal,Sacrifice,Vengeance,Conversion,Bash,Stun,Concentrate,Berserk,Whirlwind,Tiger Strike,Cobra Strike,Royal Strike,Cleave,Double Swing,Frenzy itemtypes.txt:mele@3.3.93847",
  },
  {
    rule: "Passion grants Berserk to every player, as it grants Zeal.",
    applies: (build) =>
      playerCharacters.has(build.character) &&
      build.character !== "barbarian" &&
      build.wereform === "none",
    added: { oskills: skillIds("berserk") },
    source: "runes.txt:Passion@3.3.93847",
  },
  {
    rule: "Hex: Purge hexes a weapon: an unarmed Warlock gains no attack speed from it.",
    applies: (build) => build.character === "warlock" && build.primary === unarmedId,
    removed: { fields: ["purge"] },
    source: "skills.txt:Hex Purge@3.3.93847",
  },
  {
    rule: "Smite needs a shield, which leaves one hand to the weapon.",
    applies: (build) => build.skill === parseSkillId("smite"),
    removed: { primaryWeapons: (weapon) => weapon.twoHanded },
    source: "skills.txt:Smite animdata.d2:PAS11HS,PAS11HT,PAS1HTH@3.3.93847",
  },
];

function appliedTo(build: Build): readonly GoldenDeviation[] {
  return goldenDeviations.filter((deviation) => deviation.applies(build));
}

/** Every option the deviations that apply to the build remove. */
export function removedOptions(build: Build): RemovedOptions {
  const applied = appliedTo(build).flatMap(({ removed }) =>
    removed === undefined ? [] : [removed],
  );

  return {
    wereforms: applied.flatMap((removed) => removed.wereforms ?? []),
    classSkills: applied.flatMap((removed) => removed.classSkills ?? []),
    oskills: applied.flatMap((removed) => removed.oskills ?? []),
    primaryWeapons: (weapon) =>
      applied.some((removed) => removed.primaryWeapons?.(weapon) ?? false),
    secondaryWeapons: (weapon) =>
      applied.some((removed) => removed.secondaryWeapons?.(weapon) ?? false),
    fields: applied.flatMap((removed) => removed.fields ?? []),
  };
}

/** Every option the deviations that apply to the build add. */
export function addedOptions(build: Build): AddedOptions {
  return { oskills: appliedTo(build).flatMap(({ added }) => added?.oskills ?? []) };
}

/** A floor the app puts under a speed field that the original form leaves free. */
export interface FloorDeviation {
  readonly name: string;
  readonly applies: (build: Build) => boolean;
  /** The fields that may hold the floor, in order: the first one that counts takes it. */
  readonly fields: (build: Build) => readonly SpeedNumberField[];
  readonly floor: Floor;
  readonly source: string;
}

function weaponIas(runeword: RunewordId): (build: Build) => readonly SpeedNumberField[] {
  return (build) => [holdsBaseOf(runeword, build) ? "primaryWias" : "secondaryWias", "ias"];
}

function werebearWithBeast(build: Build): boolean {
  return build.wereform === "werebear" && beastInMainHand.has(build.character);
}

export const floorDeviations: readonly FloorDeviation[] = [
  {
    name: "beast-fanaticism",
    applies: werebearWithBeast,
    fields: () => ["fanaticism"],
    floor: { min: 9, origin: { kind: "item", item: "Beast" } },
    source: "runes.txt:Beast@3.3.93847",
  },
  {
    name: "beast-ias",
    applies: werebearWithBeast,
    fields: weaponIas("beast"),
    floor: { min: 40, origin: { kind: "item", item: "Beast" } },
    source: "runes.txt:Beast@3.3.93847",
  },
  {
    name: "chaos-ias",
    applies: (build) => build.character === "assassin" && build.skill === parseSkillId("whirlwind"),
    fields: weaponIas("chaos"),
    floor: { min: 35, origin: { kind: "item", item: "Chaos" } },
    source: "runes.txt:Chaos@3.3.93847",
  },
  {
    name: "passion-ias",
    applies: (build) =>
      build.skill === parseSkillId("zeal") &&
      playerCharacters.has(build.character) &&
      build.character !== "paladin",
    fields: weaponIas("passion"),
    floor: { min: 25, origin: { kind: "item", item: "Passion" } },
    source: "runes.txt:Passion@3.3.93847",
  },
  {
    name: "wolfhowl-werewolf",
    applies: (build) => build.character === "barbarian" && build.wereform === "werewolf",
    fields: () => ["werewolf"],
    floor: { min: 3, origin: { kind: "item", item: "Wolfhowl" } },
    source: "uniqueitems.txt:Wolfhowl@3.3.93847",
  },
  {
    name: "druid-werewolf",
    applies: (build) => build.character === "druid" && build.wereform === "werewolf",
    fields: () => ["werewolf"],
    floor: { min: 1, origin: { kind: "skill", skill: "Werewolf" } },
    source: "skills.txt:Werewolf@3.3.93847",
  },
  {
    name: "frenzy",
    applies: (build) => build.skill === parseSkillId("frenzy"),
    fields: () => ["frenzy"],
    floor: { min: 1, origin: { kind: "skill", skill: "Frenzy" } },
    source: "skills.txt:Frenzy@3.3.93847",
  },
];

export interface AppliedFloor {
  readonly name: string;
  readonly field: SpeedNumberField;
  readonly floor: Floor;
}

function countsFor(build: Build, shown: readonly FieldId[]): (field: SpeedNumberField) => boolean {
  return (field) => shown.includes(field) || variableFields[build.tableVariable] === field;
}

/** The floor deviations of the build, each on the first of its fields that counts for the form. */
export function appliedFloors(build: Build, shown: readonly FieldId[]): readonly AppliedFloor[] {
  const counts = countsFor(build, shown);

  return floorDeviations.flatMap(({ name, applies, fields, floor }) => {
    const field = applies(build) ? fields(build).find((candidate) => counts(candidate)) : undefined;

    return field === undefined ? [] : [{ name, field, floor }];
  });
}

export function floorsOf(applied: readonly AppliedFloor[]): Floors {
  return Object.fromEntries(applied.map(({ field, floor }) => [field, floor]));
}

/** A ceiling the app puts over a speed field that the original form leaves open to its maximum. */
export interface CeilingDeviation {
  readonly name: string;
  readonly applies: (build: Build) => boolean;
  readonly field: SpeedNumberField;
  readonly max: number;
  readonly source: string;
}

export const ceilingDeviations: readonly CeilingDeviation[] = [
  {
    name: "hustle-burst-of-speed",
    applies: (build) => build.character !== "assassin",
    field: "burstOfSpeed",
    max: 1,
    source: "skills.txt:Quickness runes.txt:Runeword172@3.3.93847",
  },
];

export type AppliedCeiling = Pick<CeilingDeviation, "name" | "field" | "max">;

/** The ceiling deviations of the build whose field counts for the form. */
export function appliedCeilings(
  build: Build,
  shown: readonly FieldId[],
): readonly AppliedCeiling[] {
  const counts = countsFor(build, shown);

  return ceilingDeviations.flatMap(({ name, applies, field, max }) =>
    applies(build) && counts(field) ? [{ name, field, max }] : [],
  );
}

export function ceilingsOf(applied: readonly AppliedCeiling[]): Ceilings {
  return Object.fromEntries(applied.map(({ field, max }) => [field, max]));
}

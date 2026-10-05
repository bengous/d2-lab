import type { SpeedNumberField } from "@/contracts/build";
import type { FloorOrigin } from "@/contracts/inputs";
import type { RunewordId } from "@/data/rules/equipment";
import type { SkillFacts } from "@/data/rules/form-fields";
import { parseSkillId } from "@/data/rules/skills";

/** `weapon-ias`: the IAS of the weapon that carries the runeword. */
export type FloorTarget = "fanaticism" | "werewolf" | "frenzy" | "weapon-ias";

export interface FloorRule {
  /** A runeword the build needs (the engine's `neededRuneword`), or a test on the skill facts. */
  readonly when:
    | { readonly kind: "runeword"; readonly runeword: RunewordId }
    | { readonly kind: "facts"; readonly applies: (facts: SkillFacts) => boolean };
  readonly target: FloorTarget;
  readonly min: number;
  readonly origin: FloorOrigin;
  readonly source: string;
}

const frenzy = parseSkillId("frenzy");

/** The lowest value an item the build must carry, or a skill it uses, puts in a speed field. */
export const floorRules: readonly FloorRule[] = [
  {
    when: { kind: "runeword", runeword: "beast" },
    target: "fanaticism",
    min: 9,
    origin: { kind: "item", item: "Beast" },
    source: "runes.txt:Beast@3.3.93847",
  },
  {
    when: { kind: "runeword", runeword: "beast" },
    target: "weapon-ias",
    min: 40,
    origin: { kind: "item", item: "Beast" },
    source: "runes.txt:Beast@3.3.93847",
  },
  {
    when: { kind: "runeword", runeword: "chaos" },
    target: "weapon-ias",
    min: 35,
    origin: { kind: "item", item: "Chaos" },
    source: "runes.txt:Chaos@3.3.93847",
  },
  {
    when: { kind: "runeword", runeword: "passion" },
    target: "weapon-ias",
    min: 25,
    origin: { kind: "item", item: "Passion" },
    source: "runes.txt:Passion@3.3.93847",
  },
  {
    when: {
      kind: "facts",
      applies: (facts) => facts.character === "barbarian" && facts.wereform === "werewolf",
    },
    target: "werewolf",
    min: 3,
    origin: { kind: "item", item: "Wolfhowl" },
    source: "uniqueitems.txt:Wolfhowl@3.3.93847",
  },
  {
    when: {
      kind: "facts",
      applies: (facts) => facts.character === "druid" && facts.wereform === "werewolf",
    },
    target: "werewolf",
    min: 1,
    origin: { kind: "skill", skill: "Werewolf" },
    source: "skills.txt:Werewolf@3.3.93847",
  },
  {
    when: { kind: "facts", applies: (facts) => facts.skill === frenzy },
    target: "frenzy",
    min: 1,
    origin: { kind: "skill", skill: "Frenzy" },
    source: "skills.txt:Frenzy@3.3.93847",
  },
];

export interface CeilingRule {
  readonly applies: (facts: SkillFacts) => boolean;
  readonly field: SpeedNumberField;
  readonly max: number;
  readonly source: string;
}

/**
 * The highest value a speed field takes where only an item grants the skill. Outside the Assassin,
 * Burst of Speed comes from Hustle's level 1 chance to cast only: the skill buffs its caster alone.
 */
export const ceilingRules: readonly CeilingRule[] = [
  {
    applies: (facts) => facts.character !== "assassin",
    field: "burstOfSpeed",
    max: 1,
    source:
      "skills.txt:Quickness runes.txt:Runeword172@3.3.93847 decision: max 1, as only Hustle's level 1 chance to cast grants it",
  },
];

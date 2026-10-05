import type { CharacterId, SkillId, TableVariable, Wereform } from "@/contracts/build";
import { parseSkillId } from "@/data/rules/skills";

/** EIAS granted by a skill level. Level 0 always grants 0. */
export type LevelFormula =
  | {
      readonly kind: "diminishing";
      readonly base: number;
      readonly limit: number;
      readonly min: number;
      readonly max: number | null;
    }
  | {
      readonly kind: "linear";
      readonly base: number;
      readonly perLevel: number;
      readonly min: number;
      readonly max: number | null;
    }
  | { readonly kind: "maul" };

export type BuffCondition =
  | { readonly kind: "always" }
  | { readonly kind: "wereform"; readonly wereform: Wereform }
  | { readonly kind: "characters"; readonly characters: readonly CharacterId[] }
  | { readonly kind: "skill"; readonly skill: SkillId };

export type LevelBuffField =
  | "fanaticism"
  | "burstOfSpeed"
  | "werewolf"
  | "maul"
  | "frenzy"
  | "purge"
  | "cleave"
  | "mirroredBlades";

export interface LevelBuff {
  readonly field: LevelBuffField;
  readonly formula: LevelFormula;
  /** The buff grants nothing while it is the table variable. */
  readonly tableVariable: TableVariable | null;
  readonly appliesWhen: BuffCondition;
  readonly source: string;
}

export const maxSkillLevel = { level: 60, source: "constants.js:245@bcc112d" } as const;

const always = { kind: "always" } as const;

export const levelBuffs: readonly LevelBuff[] = [
  {
    field: "fanaticism",
    formula: { kind: "diminishing", base: 10, limit: 40, min: 0, max: null },
    tableVariable: "fanaticism",
    appliesWhen: always,
    source: "constants.js:284@bcc112d",
  },
  {
    field: "burstOfSpeed",
    formula: { kind: "diminishing", base: 15, limit: 60, min: 0, max: null },
    tableVariable: "burst-of-speed",
    appliesWhen: always,
    source: "constants.js:285@bcc112d",
  },
  {
    field: "werewolf",
    formula: { kind: "diminishing", base: 10, limit: 80, min: 0, max: null },
    tableVariable: "werewolf",
    appliesWhen: { kind: "wereform", wereform: "werewolf" },
    source: "constants.js:286@bcc112d",
  },
  {
    field: "maul",
    formula: { kind: "maul" },
    tableVariable: "maul",
    appliesWhen: { kind: "wereform", wereform: "werebear" },
    source: "constants.js:287,310-312@bcc112d",
  },
  {
    field: "frenzy",
    formula: { kind: "diminishing", base: 0, limit: 50, min: 0, max: null },
    tableVariable: "frenzy",
    appliesWhen: { kind: "characters", characters: ["barbarian", "frenzy-barbarian"] },
    source: "constants.js:288@bcc112d",
  },
  {
    field: "purge",
    formula: { kind: "linear", base: 10, perLevel: 1, min: 0, max: 30 },
    tableVariable: null,
    appliesWhen: always,
    source: "constants.js:290,295-300@bcc112d",
  },
  {
    field: "cleave",
    formula: { kind: "diminishing", base: 10, limit: 30, min: 0, max: null },
    tableVariable: null,
    appliesWhen: { kind: "skill", skill: parseSkillId("cleave") },
    source: "constants.js:291@bcc112d",
  },
  {
    field: "mirroredBlades",
    formula: { kind: "diminishing", base: 10, limit: 30, min: 0, max: null },
    tableVariable: null,
    appliesWhen: { kind: "skill", skill: parseSkillId("mirrored-blades") },
    source: "constants.js:292@bcc112d",
  },
];

/** Holy Freeze slows by at most 50, the chill effectiveness of players. */
export const holyFreeze = {
  formula: { kind: "diminishing", base: 25, limit: 60, min: 0, max: 50 },
  source: "constants.js:289@bcc112d",
} as const satisfies { readonly formula: LevelFormula; readonly source: string };

export const markOfTheBear = { sias: 25, source: "calculator.js:1200@bcc112d" } as const;

export const flatSlows = {
  decrepify: 50,
  chilled: 50,
  lethargy: 50,
  source: "calculator.js:1202-1205@bcc112d",
} as const;

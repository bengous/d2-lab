import type { CharacterId, SkillId, TableVariable, Wereform } from "@/contracts/build";
import type { WeaponClass } from "@/contracts/game-data";
import type { FieldId } from "@/contracts/inputs";
import { parseSkillId } from "@/data/rules/skills";

/** `hidden`: no off-hand select. `empty`: the select shows unarmed. `armed`: a second weapon. */
export type OffHand = "hidden" | "empty" | "armed";

/** What the form knows once the character, wereform and skill are chosen. */
export interface SkillFacts {
  readonly character: CharacterId;
  readonly player: boolean;
  readonly wereform: Wereform;
  readonly skill: SkillId;
  readonly canDualWield: boolean;
  readonly dualWieldOnly: boolean;
}

export interface GripFacts extends SkillFacts {
  readonly primaryClass: WeaponClass;
}

export interface WieldFacts extends GripFacts {
  readonly offHand: OffHand;
}

export interface FormFacts extends WieldFacts {
  readonly tableVariable: TableVariable;
}

export interface FieldRule<Facts> {
  readonly shown: (facts: Facts) => boolean;
  readonly source: string;
}

const skills = {
  standard: parseSkillId("standard"),
  dodge: parseSkillId("dodge"),
  whirlwind: parseSkillId("whirlwind"),
  cleave: parseSkillId("cleave"),
  mirroredBlades: parseSkillId("mirrored-blades"),
} as const;

/** A skill that hides the table variable select and forces its variable. */
export const fixedTableVariables: readonly {
  readonly skill: SkillId;
  readonly variable: TableVariable;
  readonly source: string;
}[] = [{ skill: skills.dodge, variable: "fanaticism", source: "calculator.js:343-355@bcc112d" }];

/** Primary weapon classes that open the off-hand select, for a skill that can dual wield. */
const offHandGrips: Readonly<Partial<Record<CharacterId, readonly WeaponClass[]>>> = {
  assassin: ["ht"],
  barbarian: ["1hs", "1ht", "2hs"],
  "frenzy-barbarian": ["1hs", "1ht", "2hs"],
};

function speedTable(facts: FormFacts): boolean {
  return facts.tableVariable !== "eias";
}

function barbarian(character: CharacterId): boolean {
  return character === "barbarian" || character === "frenzy-barbarian";
}

/**
 * Dual wielding replaces the IAS table with the two WIAS tables, except for Standard and
 * Whirlwind; a dual-wield-only skill always has them.
 */
function weaponTables(facts: WieldFacts): boolean {
  return (
    facts.dualWieldOnly ||
    (facts.canDualWield &&
      facts.skill !== skills.standard &&
      facts.skill !== skills.whirlwind &&
      facts.offHand === "armed")
  );
}

/**
 * When each field of the form shows, as the original canonical path leaves it: character,
 * wereform, skill, primary, secondary, then table variable.
 */
export const fieldRules = {
  wereform: {
    shown: (facts: SkillFacts) => facts.player && facts.skill !== skills.dodge,
    source: "calculator.js:143-153,353,358@bcc112d",
  },
  tableVariable: {
    shown: (facts: SkillFacts) => !fixedTableVariables.some(({ skill }) => skill === facts.skill),
    source: "calculator.js:344,357@bcc112d",
  },
  primary: {
    shown: (facts: SkillFacts) => facts.skill !== skills.dodge,
    source: "calculator.js:352,359@bcc112d",
  },
  secondary: {
    shown: (facts: GripFacts) =>
      facts.canDualWield && (offHandGrips[facts.character]?.includes(facts.primaryClass) ?? false),
    source: "calculator.js:278-285@bcc112d",
  },
  oneHanded: {
    shown: (facts: FormFacts) =>
      facts.character === "barbarian" &&
      facts.primaryClass === "2hs" &&
      facts.offHand !== "armed" &&
      !facts.dualWieldOnly &&
      facts.skill !== skills.whirlwind,
    source: "calculator.js:272-276,298-320@bcc112d",
  },
  current: {
    shown: () => true,
    source: "decision: the 'Your …' field holds the player's value of the table variable",
  },
  primaryWias: {
    shown: (facts: FormFacts) =>
      speedTable(facts) && facts.tableVariable !== "primary-wias" && facts.offHand === "armed",
    source: "calculator.js:29,57,86-88@bcc112d",
  },
  secondaryWias: {
    shown: (facts: FormFacts) =>
      speedTable(facts) &&
      facts.tableVariable !== "secondary-wias" &&
      (facts.offHand === "armed" || facts.dualWieldOnly),
    source: "calculator.js:30,61,89-91,385-390@bcc112d",
  },
  ias: {
    shown: (facts: FormFacts) =>
      speedTable(facts) && facts.tableVariable !== "ias" && facts.skill !== skills.dodge,
    source: "calculator.js:31,49,92-94@bcc112d",
  },
  fanaticism: {
    shown: (facts: FormFacts) => speedTable(facts) && facts.tableVariable !== "fanaticism",
    source: "calculator.js:32,65,95-97@bcc112d",
  },
  burstOfSpeed: {
    shown: (facts: FormFacts) => speedTable(facts) && facts.tableVariable !== "burst-of-speed",
    source: "calculator.js:33,69,98-100@bcc112d",
  },
  werewolf: {
    shown: (facts: FormFacts) =>
      speedTable(facts) && facts.tableVariable !== "werewolf" && facts.wereform === "werewolf",
    source: "calculator.js:35,73,101-103@bcc112d",
  },
  maul: {
    shown: (facts: FormFacts) =>
      speedTable(facts) &&
      facts.tableVariable !== "maul" &&
      facts.wereform === "werebear" &&
      facts.character === "druid",
    source: "calculator.js:36,77,104-106@bcc112d",
  },
  frenzy: {
    shown: (facts: FormFacts) =>
      speedTable(facts) && facts.tableVariable !== "frenzy" && barbarian(facts.character),
    source: "calculator.js:34,81,107-109@bcc112d",
  },
  markOfTheBear: {
    shown: (facts: FormFacts) => speedTable(facts) && facts.player,
    source: "calculator.js:37,143-153@bcc112d",
  },
  purge: {
    shown: (facts: FormFacts) =>
      speedTable(facts) && facts.character === "warlock" && facts.primaryClass !== "hth",
    source:
      "calculator.js:38,111-113,198-202@bcc112d skills.txt:Hex Purge@3.3.93847 decision: hidden unarmed, as the hex targets the weapon (passiveitype weap)",
  },
  cleave: {
    shown: (facts: FormFacts) => speedTable(facts) && facts.skill === skills.cleave,
    source: "calculator.js:39,115-116,445-454@bcc112d",
  },
  mirroredBlades: {
    shown: (facts: FormFacts) => speedTable(facts) && facts.skill === skills.mirroredBlades,
    source: "calculator.js:40,117-119,445-454@bcc112d",
  },
  holyFreeze: { shown: speedTable, source: "calculator.js:42,122@bcc112d" },
  slowedBy: { shown: speedTable, source: "calculator.js:43,123@bcc112d" },
  decrepify: { shown: speedTable, source: "calculator.js:41,121@bcc112d" },
  chilled: { shown: speedTable, source: "calculator.js:44,124@bcc112d" },
  lethargy: { shown: speedTable, source: "calculator.js:45,125@bcc112d" },
} as const satisfies { readonly [Field in FieldId]: FieldRule<FormFacts> };

const withBeast: readonly Wereform[] = ["none", "werebear"];

const everyWereform: readonly Wereform[] = ["none", "werebear", "werewolf"];

/**
 * Wereforms a character may take. The Beast runeword grants Werebear to every player; Wolfhowl, a
 * Barbarian helm, grants Werewolf. A mercenary stays human.
 */
export const wereformOffers: Readonly<Record<CharacterId, readonly Wereform[]>> & {
  readonly source: string;
} = {
  amazon: withBeast,
  assassin: withBeast,
  barbarian: everyWereform,
  druid: everyWereform,
  necromancer: withBeast,
  paladin: withBeast,
  sorceress: withBeast,
  warlock: withBeast,
  "rogue-scout": ["none"],
  "desert-mercenary": ["none"],
  "bash-barbarian": ["none"],
  "frenzy-barbarian": ["none"],
  source: "runes.txt:Beast uniqueitems.txt:Wolfhowl armor.txt:bac@3.3.93847",
};

export interface TableVariableOffer {
  readonly variable: TableVariable;
  readonly offered: (facts: WieldFacts) => boolean;
  readonly source: string;
}

/** Table variables in select order. */
export const tableVariableOffers: readonly TableVariableOffer[] = [
  { variable: "eias", offered: () => true, source: "index.html:57@bcc112d" },
  {
    variable: "ias",
    offered: (facts) => !weaponTables(facts),
    source: "calculator.js:305-311,321-322,381-392,401-421@bcc112d",
  },
  { variable: "fanaticism", offered: () => true, source: "index.html:59@bcc112d" },
  {
    variable: "primary-wias",
    offered: weaponTables,
    source: "calculator.js:305-311,321-331,381-392,401-421@bcc112d",
  },
  {
    variable: "secondary-wias",
    offered: weaponTables,
    source: "calculator.js:305-311,321-331,381-392,401-421@bcc112d",
  },
  {
    variable: "burst-of-speed",
    offered: (facts) => facts.character === "assassin",
    source: "calculator.js:172-182@bcc112d",
  },
  {
    variable: "werewolf",
    offered: (facts) => facts.wereform === "werewolf",
    source: "calculator.js:227-248@bcc112d",
  },
  {
    variable: "frenzy",
    offered: (facts) => barbarian(facts.character),
    source: "calculator.js:184-196@bcc112d",
  },
  {
    variable: "maul",
    offered: (facts) => facts.wereform === "werebear" && facts.character === "druid",
    source: "calculator.js:232-236@bcc112d",
  },
];

/** The table variable a form falls back to when its choice is no longer offered: the first offered. */
export const tableVariableFallbacks = {
  order: ["ias", "primary-wias"],
  source: "calculator.js:178-181,307-310,323-326,385-388,404-413@bcc112d",
} as const satisfies { readonly order: readonly TableVariable[]; readonly source: string };

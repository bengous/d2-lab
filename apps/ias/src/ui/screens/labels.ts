import type {
  CharacterId,
  SkillId,
  SlowFlag,
  SlowNumberField,
  SpeedFlag,
  SpeedNumberField,
  TableVariable,
  Wereform,
} from "@/contracts/build";
import type { WeaponTier } from "@/contracts/game-data";
import type { TableRole } from "@/contracts/result";
import { currentField, type NumberField, slowFields, speedFields } from "@/data/rules/field-values";
import type { WeaponCategory } from "@/data/rules/weapon-categories";

export interface StepperSpec {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly hint?: string;
}

export interface CheckSpec {
  readonly label: string;
  readonly hint?: string;
}

export interface TableVariableSpec {
  /** Option of the table variable toggle. */
  readonly name: string;
  /** Header of the first table column. */
  readonly column: string;
  /** Label of the `current` stepper. */
  readonly currentLabel: string;
  readonly min: number;
  readonly max: number;
  /** A value in running text, for example `24 IAS` or `level 12`. */
  readonly describe: (value: number) => string;
}

export const playerClasses: readonly CharacterId[] = [
  "amazon",
  "assassin",
  "barbarian",
  "druid",
  "necromancer",
  "paladin",
  "sorceress",
  "warlock",
];

export const mercenaries: readonly CharacterId[] = [
  "rogue-scout",
  "desert-mercenary",
  "bash-barbarian",
  "frenzy-barbarian",
];

export const characterNames: Readonly<Record<CharacterId, string>> = {
  amazon: "Amazon",
  assassin: "Assassin",
  barbarian: "Barbarian",
  druid: "Druid",
  necromancer: "Necromancer",
  paladin: "Paladin",
  sorceress: "Sorceress",
  warlock: "Warlock",
  "rogue-scout": "Rogue Scout",
  "desert-mercenary": "Desert Merc",
  "bash-barbarian": "Bash Barb",
  "frenzy-barbarian": "Frenzy Barb",
};

export const wereformNames: Readonly<Record<Wereform, string>> = {
  none: "None",
  werebear: "Werebear",
  werewolf: "Werewolf",
};

/** The original skill list, constants.js:317-363@bcc112d; its "Standard" is the game's Attack. */
const skillNames: ReadonlyMap<string, string> = new Map([
  ["standard", "Attack"],
  ["throw", "Throw"],
  ["kick", "Barrel Kick"],
  ["dodge", "Dodge"],
  ["impale", "Impale"],
  ["jab", "Jab"],
  ["strafe", "Strafe"],
  ["fend", "Fend"],
  ["tiger-strike", "Tiger Strike"],
  ["cobra-strike", "Cobra Strike"],
  ["phoenix-strike", "Phoenix Strike"],
  ["fists-of-fire", "Fists of Fire"],
  ["claws-of-thunder", "Claws of Thunder"],
  ["blades-of-ice", "Blades of Ice"],
  ["dragon-claw", "Dragon Claw"],
  ["dragon-tail", "Dragon Tail"],
  ["dragon-talon", "Dragon Talon"],
  ["laying-traps", "Laying Traps"],
  ["double-swing", "Double Swing"],
  ["frenzy", "Frenzy"],
  ["taunt", "Taunt"],
  ["double-throw", "Double Throw"],
  ["whirlwind", "Whirlwind"],
  ["concentrate", "Concentrate"],
  ["berserk", "Berserk"],
  ["bash", "Bash"],
  ["stun", "Stun"],
  ["feral-rage", "Feral Rage"],
  ["hunger", "Hunger"],
  ["rabies", "Rabies"],
  ["fury", "Fury"],
  ["zeal", "Zeal"],
  ["smite", "Smite"],
  ["sacrifice", "Sacrifice"],
  ["vengeance", "Vengeance"],
  ["conversion", "Conversion"],
  ["cleave", "Cleave"],
  ["mirrored-blades", "Mirrored Blades"],
]);

/** `bun run assets:extract` writes no icon for them (see scripts/extract-assets.ts). */
const skillsWithoutIcon: ReadonlySet<string> = new Set(["kick", "laying-traps"]);

export function skillName(skill: SkillId): string {
  const name = skillNames.get(skill);

  if (name === undefined) {
    throw new Error(`no display name for the skill "${skill}"`);
  }

  return name;
}

export function skillIconSrc(skill: SkillId): string | null {
  return skillsWithoutIcon.has(skill) ? null : `game/skills/${skill}.webp`;
}

export function portraitSrc(character: CharacterId): string {
  return `game/portraits/${character}.webp`;
}

export function weaponIconSrc(icon: string): string {
  return `game/weapons/${icon}.webp`;
}

export const weaponCategoryNames: Readonly<Record<WeaponCategory, string>> = {
  axes: "Axes",
  wands: "Wands",
  clubs: "Clubs",
  scepters: "Scepters",
  maces: "Maces",
  hammers: "Hammers",
  swords: "Swords",
  daggers: "Daggers",
  throwingKnives: "Throwing Knives",
  throwingAxes: "Throwing Axes",
  javelins: "Javelins",
  spears: "Spears",
  polearms: "Polearms",
  staves: "Staves",
  bows: "Bows",
  crossbows: "Crossbows",
  claws: "Claws",
  orbs: "Orbs",
};

export interface TierLabel {
  readonly numeral: string;
  readonly name: string;
}

export const weaponTierLabels: Readonly<Record<WeaponTier, TierLabel>> = {
  normal: { numeral: "I", name: "Normal" },
  exceptional: { numeral: "II", name: "Exceptional" },
  elite: { numeral: "III", name: "Elite" },
};

function boundsOf({ min, max }: NumberField): Pick<StepperSpec, "min" | "max"> {
  return { min, max };
}

function skillLevelVariable(variable: TableVariable, name: string): TableVariableSpec {
  return {
    name,
    column: `${name} level`,
    currentLabel: `Your ${name} level`,
    ...boundsOf(currentField(variable)),
    describe: (value) => `level ${value}`,
  };
}

/** Bounds of `current` from the field rules: the speed field of the variable, or the EIAS caps. */
export const tableVariables: Readonly<Record<TableVariable, TableVariableSpec>> = {
  eias: {
    name: "EIAS",
    column: "EIAS",
    currentLabel: "Your EIAS",
    ...boundsOf(currentField("eias")),
    describe: (value) => `${value} EIAS`,
  },
  ias: {
    name: "IAS",
    column: "IAS",
    currentLabel: "Your IAS",
    ...boundsOf(currentField("ias")),
    describe: (value) => `${value} IAS`,
  },
  "primary-wias": {
    name: "Weapon IAS",
    column: "Weapon IAS",
    currentLabel: "Your weapon IAS",
    ...boundsOf(currentField("primary-wias")),
    describe: (value) => `${value} weapon IAS`,
  },
  "secondary-wias": {
    name: "Off-hand IAS",
    column: "Off-hand IAS",
    currentLabel: "Your off-hand IAS",
    ...boundsOf(currentField("secondary-wias")),
    describe: (value) => `${value} off-hand IAS`,
  },
  fanaticism: skillLevelVariable("fanaticism", "Fanaticism"),
  "burst-of-speed": skillLevelVariable("burst-of-speed", "Burst of Speed"),
  werewolf: skillLevelVariable("werewolf", "Werewolf"),
  frenzy: skillLevelVariable("frenzy", "Frenzy"),
  maul: skillLevelVariable("maul", "Maul"),
};

/** Labels and hover titles of the original form, index.html@bcc112d; bounds from the field rules. */
export const speedSteppers: Readonly<Record<SpeedNumberField, StepperSpec>> = {
  ias: { label: "IAS", ...boundsOf(speedFields.ias) },
  primaryWias: { label: "Weapon IAS", ...boundsOf(speedFields.primaryWias) },
  secondaryWias: { label: "Off-hand IAS", ...boundsOf(speedFields.secondaryWias) },
  fanaticism: { label: "Fanaticism", ...boundsOf(speedFields.fanaticism) },
  burstOfSpeed: {
    label: "Burst of Speed",
    ...boundsOf(speedFields.burstOfSpeed),
    hint: "Mania (Hustle) grants Burst of Speed to all classes.",
  },
  werewolf: { label: "Werewolf", ...boundsOf(speedFields.werewolf) },
  maul: { label: "Maul", ...boundsOf(speedFields.maul), hint: "Assumes the maximum charge count." },
  frenzy: {
    label: "Frenzy",
    ...boundsOf(speedFields.frenzy),
    hint: "Assumes the maximum charge count.",
  },
  purge: {
    label: "Hex: Purge",
    ...boundsOf(speedFields.purge),
    hint: "The EIAS benefit reaches its maximum at level 21.",
  },
  cleave: {
    label: "Cleave",
    ...boundsOf(speedFields.cleave),
    hint: "Cleave grants EIAS with diminishing returns per skill level.",
  },
  mirroredBlades: {
    label: "Mirrored Blades",
    ...boundsOf(speedFields.mirroredBlades),
    hint: "Mirrored Blades grants EIAS with diminishing returns per skill level.",
  },
};

export const speedFlags: Readonly<Record<SpeedFlag, CheckSpec>> = {
  markOfTheBear: {
    label: "Mark of the Bear",
    hint: "Metamorphosis helm: a Werebear hit grants 25 EIAS for 180 s, kept in any form.",
  },
};

export const slowSteppers: Readonly<Record<SlowNumberField, StepperSpec>> = {
  holyFreeze: {
    label: "Holy Freeze",
    ...boundsOf(slowFields.holyFreeze),
    hint: "The Holy Freeze slow is capped at 50: chill effectiveness is 50 for players.",
  },
  slowedBy: {
    label: "Slowed by",
    ...boundsOf(slowFields.slowedBy),
    hint: "Slows Target % in PvP, capped at 50: chill effectiveness is 50 for players.",
  },
};

export const slowFlags: Readonly<Record<SlowFlag, CheckSpec>> = {
  decrepify: { label: "Decrepify" },
  chilled: { label: "Chilled" },
  lethargy: {
    label: "Sigil: Lethargy",
    hint: "In PvP, items with Lethargy charges can cast it too.",
  },
};

const tableCaptions: Readonly<Record<TableRole, string>> = {
  main: "Main hand",
  "off-hand": "Off-hand",
  merged: "Both weapons, as they swing together",
  "odd-hits": "Odd number of hits",
};

/** Caption of a table when the build has several. */
export function tableCaption(role: TableRole, roles: readonly TableRole[]): string {
  return role === "main" && roles.includes("odd-hits")
    ? "Even number of hits"
    : tableCaptions[role];
}

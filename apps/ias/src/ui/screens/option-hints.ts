import type {
  CharacterId,
  SkillId,
  SpeedNumberField,
  TableVariable,
  Wereform,
} from "@/contracts/build";
import type { Floor, InputSpec } from "@/contracts/inputs";
import { gameData } from "@/data/generated/game-data";
import { gameFramesPerSecond } from "@/data/rules/animation";
import { type LevelFormula, maxSkillLevel } from "@/data/rules/buffs";
import type { RunewordId } from "@/data/rules/equipment";
import { levelEias, variableBuff } from "@/engine/levels";
import { iasToEias } from "@/engine/speed";
import type { WorkedExample } from "@/ui/components/info-tip";
import type { PerSecondCount } from "@/ui/screens/hit-labels";
import { tableVariables } from "@/ui/screens/labels";

interface SkillHint {
  readonly text: string;
  readonly shownTo: (character: CharacterId) => boolean;
}

/** Why a surprising skill is on the list: an attack of the game files, or an item that grants it. */
const skillHints: ReadonlyMap<string, SkillHint> = new Map([
  [
    "kick",
    {
      text: "The Kick attack of the game files, used on barrels and urns. Unrelated to the Assassin kicks (Dragon Talon, Dragon Tail).",
      shownTo: () => true,
    },
  ],
  [
    "zeal",
    {
      text: "Granted by the Passion runeword.",
      shownTo: (character: CharacterId) => character !== "paladin",
    },
  ],
  [
    "berserk",
    {
      text: "Granted by the Passion runeword.",
      shownTo: (character: CharacterId) => character !== "barbarian",
    },
  ],
  [
    "whirlwind",
    {
      text: "Granted by the Chaos runeword (claws).",
      shownTo: (character: CharacterId) => character === "assassin",
    },
  ],
  [
    "feral-rage",
    {
      text: "Granted by Wolfhowl.",
      shownTo: (character: CharacterId) => character === "barbarian",
    },
  ],
]);

export function skillHint(character: CharacterId, skill: SkillId): string | null {
  const hint = skillHints.get(skill);

  return hint?.shownTo(character) === true ? hint.text : null;
}

/** Where a wereform comes from, or why the character cannot take it. `offered`: the form offers it. */
export function wereformHint(
  character: CharacterId,
  wereform: Wereform,
  offered: boolean,
): string | null {
  if (wereform === "none") {
    return null;
  }

  if (character === "druid") {
    return "Druid shape-shifting skill.";
  }

  if (wereform === "werebear") {
    return "Granted by the Beast runeword (axe, scepter or hammer), which also carries a level 9 Fanaticism aura. Only Standard Attack works in this form.";
  }

  return offered
    ? "Granted by Wolfhowl, a Barbarian helm that also grants Feral Rage."
    : "Only the Druid, or the Barbarian with Wolfhowl, can take Werewolf form.";
}

export interface RunewordWeaponHint {
  /** The gold line under the weapon panel title. */
  readonly caption: string;
  /** The tip of the weapon that carries the runeword. */
  readonly text: string;
}

/** Why the weapon lists hold only the bases of the runeword the build needs. */
export const runewordWeaponHints: Readonly<Record<RunewordId, RunewordWeaponHint>> = {
  beast: {
    caption: "Beast: axe, scepter or hammer",
    text: "Werebear comes from the Beast runeword, so the list holds only its bases: an axe, scepter or hammer with 5 sockets.",
  },
  chaos: {
    caption: "Chaos: 3-socket claw",
    text: "Whirlwind comes from the Chaos runeword, so one claw must be its base: a claw with 3 sockets.",
  },
  passion: {
    caption: "Passion: 4-socket weapon",
    text: "Zeal and Berserk come from the Passion runeword, so one weapon must be its base: any weapon with 4 sockets.",
  },
};

/** The Werewolf level Wolfhowl rolls up to, uniqueitems.txt:Wolfhowl@3.3.93847. */
const wolfhowlMaxWerewolf = 6;

/** The gold line under a field an item floors, `null` for a floor that comes from a skill. */
export function floorCaption(field: SpeedNumberField, floor: Floor): string | null {
  if (floor.origin.kind === "skill") {
    return null;
  }

  const { item } = floor.origin;

  if (field === "fanaticism") {
    return `${item}: level ${floor.min} aura`;
  }

  if (field === "werewolf") {
    return `${item}: +${floor.min} to +${wolfhowlMaxWerewolf}`;
  }

  return `${item}: +${floor.min}% IAS`;
}

export interface BoundProps {
  readonly min: number;
  readonly max: number;
  readonly itemFloor: string | null;
}

/** A stepper's bounds moved by the floor and the ceiling of its field, with the gold line of an item floor. */
export function boundProps(
  field: SpeedNumberField,
  { floors, ceilings }: Pick<InputSpec, "floors" | "ceilings">,
  { min, max }: Pick<BoundProps, "min" | "max">,
): BoundProps {
  const floor = floors[field];

  return {
    min: Math.max(min, floor?.min ?? min),
    max: Math.min(max, ceilings[field] ?? max),
    itemFloor: floor === undefined ? null : floorCaption(field, floor),
  };
}

/** The tip of the per-second column of a table. */
export const perSecondTips: Readonly<Record<PerSecondCount, string>> = {
  attacks: `Attacks per second: ${gameFramesPerSecond.frames} game frames per second divided by the frames of one attack.`,
  hits: "Hits per second count the hits before the last one. The last hit takes longer: it finishes the swing.",
};

/** The status of a table row the build cannot reach under the floor of the table variable. */
export function floorRowStatus(floor: Floor): string {
  return floor.origin.kind === "item" ? `Below ${floor.origin.item}` : "Below minimum";
}

export interface TableVariableTip {
  readonly text: string;
  readonly worked: WorkedExample;
}

const phaseBlade = gameData.weapons.find((weapon) => weapon.id === "phase-blade");

if (phaseBlade === undefined) {
  throw new Error("the game data has no Phase Blade for the EIAS example");
}

const heldSources = "The other speed sources stay as entered.";

const handFormula = [
  "Hand EIAS = ⌊120 × IAS ÷ (120 + IAS)⌋",
  "IAS = gear + that weapon",
  "Double Swing, Double Throw and Frenzy average both hands.",
].join("\n");

function levelFormulaText(variable: TableVariable, formula: LevelFormula): string {
  if (formula.kind === "maul") {
    return "SIAS = 3 × (⌊level ÷ 2⌋ + 3)";
  }

  if (formula.kind === "linear") {
    throw new Error(`the table variable ${variable} has a linear formula, which no tip describes`);
  }

  const lead = formula.base === 0 ? "" : `${formula.base} + `;

  return [
    "s = ⌊110 × level ÷ (level + 6)⌋",
    `SIAS = ${lead}⌊${formula.limit - formula.base} × s ÷ 100⌋`,
  ].join("\n");
}

function skillLevelTip(variable: TableVariable): TableVariableTip {
  const buff = variableBuff(variable);

  if (buff === undefined) {
    throw new Error(`no skill-level buff for the table variable ${variable}`);
  }

  const sias = (level: number): number => levelEias(buff.formula, level);
  const { level: maxLevel } = maxSkillLevel;

  return {
    text: `${tableVariables[variable].name} skill level. ${heldSources}`,
    worked: {
      formula: levelFormulaText(variable, buff.formula),
      example: `Level 1 gives ${sias(1)}, level 20 gives ${sias(20)}, level ${maxLevel} gives ${sias(maxLevel)}.`,
    },
  };
}

/** The tip of each option of the table variable toggle. */
export const tableVariableTips: Readonly<Record<TableVariable, TableVariableTip>> = {
  eias: {
    text: "Effective IAS: skill speed bonuses, minus the weapon speed modifier, plus item IAS after diminishing returns. The frame formula reads this value.",
    worked: {
      formula: "EIAS = SIAS − WSM + ⌊120 × IAS ÷ (120 + IAS)⌋",
      example: `Phase Blade (WSM ${phaseBlade.wsm}), 20 IAS, no skill bonus: 0 + ${-phaseBlade.wsm} + ${iasToEias(20)} = ${iasToEias(20) - phaseBlade.wsm} EIAS.`,
    },
  },
  ias: {
    text: "IAS from gear other than the weapon. The weapon IAS stays as entered.",
    worked: {
      formula: "Item EIAS = ⌊120 × IAS ÷ (120 + IAS)⌋\nIAS = gear + weapon",
      example: `24 IAS gives ${iasToEias(24)}. 48 IAS gives only ${iasToEias(48)}.`,
    },
  },
  "primary-wias": {
    text: `IAS on the main-hand weapon. ${heldSources}`,
    worked: {
      formula: handFormula,
      example: `Frenzy, 7 IAS on the main-hand weapon only: (${iasToEias(7)} + 0) ÷ 2 = ${iasToEias(7) / 2}.`,
    },
  },
  "secondary-wias": {
    text: `IAS on the off-hand weapon. ${heldSources}`,
    worked: {
      formula: handFormula,
      example: `Frenzy, 7 IAS on the off-hand weapon only: (0 + ${iasToEias(7)}) ÷ 2 = ${iasToEias(7) / 2}.`,
    },
  },
  fanaticism: skillLevelTip("fanaticism"),
  "burst-of-speed": skillLevelTip("burst-of-speed"),
  werewolf: skillLevelTip("werewolf"),
  frenzy: skillLevelTip("frenzy"),
  maul: skillLevelTip("maul"),
};

import type { TableVariable } from "@/contracts/build";
import { type LevelBuff, type LevelFormula, levelBuffs, maxSkillLevel } from "@/data/rules/buffs";

function clamp(value: number, min: number, max: number | null): number {
  if (value < min) {
    return min;
  }

  if (max !== null && value > max) {
    return max;
  }

  return value;
}

/** Source: constants.js:261-264,295-312@bcc112d. */
export function levelEias(formula: LevelFormula, level: number): number {
  if (level === 0) {
    return 0;
  }

  if (formula.kind === "maul") {
    return 3 * (Math.trunc(level / 2) + 3);
  }

  if (formula.kind === "linear") {
    return clamp(formula.base + (level - 1) * formula.perLevel, formula.min, formula.max);
  }

  const scale = Math.trunc((110 * level) / (level + 6));

  return clamp(
    formula.base + Math.trunc(((formula.limit - formula.base) * scale) / 100),
    formula.min,
    formula.max,
  );
}

interface LevelStep {
  readonly eias: number;
  readonly level: number;
}

/**
 * Distinct EIAS values from the maximum level down, each with its lowest level, in the order a
 * `Map` filled from level 60 to 0 keeps them. Source: constants.js:255-258@bcc112d.
 */
function levelSteps(formula: LevelFormula): readonly LevelStep[] {
  const lowestLevels = new Map<number, number>();

  for (let level = maxSkillLevel.level; level >= 0; level--) {
    lowestLevels.set(levelEias(formula, level), level);
  }

  return [...lowestLevels].map(([eias, level]: readonly [number, number]) => ({ eias, level }));
}

const stepsByBuff: ReadonlyMap<LevelBuff, readonly LevelStep[]> = new Map(
  levelBuffs.map((buff) => [buff, levelSteps(buff.formula)]),
);

/** The buff whose skill level is the table variable, if any. */
export function variableBuff(variable: TableVariable): LevelBuff | undefined {
  return levelBuffs.find((buff) => buff.tableVariable === variable);
}

/** The skill level shown for an EIAS need. Source: constants.js:272-279@bcc112d. */
export function levelFromEias(buff: LevelBuff, eias: number): number {
  const steps = stepsByBuff.get(buff) ?? levelSteps(buff.formula);
  let lastLevel: number = maxSkillLevel.level;

  for (const step of steps) {
    if (eias > step.eias) {
      return lastLevel;
    }

    lastLevel = step.level;
  }

  return 0;
}

import type { TableVariable } from "@/contracts/build";
import { weaponClassTraits } from "@/data/rules/animation";
import {
  type BuffCondition,
  flatSlows,
  holyFreeze,
  type LevelBuff,
  levelBuffs,
  markOfTheBear,
  maxSkillLevel,
} from "@/data/rules/buffs";
import { eiasLimits, iasAccelerationCaps, weaponIasCaps } from "@/data/rules/caps";
import { weaponSpeedAveraging } from "@/data/rules/dual-wield";
import { sequenceSiasPenalty } from "@/data/rules/skills";
import { type Context, type Hand, handWeapon, otherHand } from "@/engine/context";
import { levelEias, levelFromEias, variableBuff } from "@/engine/levels";

/**
 * The original `EIASvalues` array [EIAS, SIAS, WSM1, WSM2, IEIAS, GIAS, WIAS1, WIAS2], without
 * IEIAS which no conversion reads. A single-weapon table leaves `wsm2` and `wias2` at -1, and a
 * SIAS-only skill leaves every weapon slot at -1; the WIAS conversion still reads them.
 * Source: calculator.js:1100-1131@bcc112d.
 */
export interface EiasValues {
  readonly eias: number;
  readonly sias: number;
  readonly wsm1: number;
  readonly wsm2: number;
  readonly gias: number;
  readonly wias1: number;
  readonly wias2: number;
}

const unusedSlot = -1;

/** Source: constants.js:843-847@bcc112d. */
export function iasToEias(ias: number): number {
  return Math.trunc((120 * ias) / (120 + ias));
}

/** Source: constants.js:849-853@bcc112d. */
export function eiasToIas(eias: number): number {
  return Math.ceil((120 * eias) / (120 - eias));
}

function applies(condition: BuffCondition, context: Context): boolean {
  if (condition.kind === "wereform") {
    return context.build.wereform === condition.wereform;
  }

  if (condition.kind === "characters") {
    return condition.characters.includes(context.build.character);
  }

  if (condition.kind === "skill") {
    return context.build.skill === condition.skill;
  }

  return true;
}

/** Source: calculator.js:1185-1220@bcc112d. */
function sias(context: Context): number {
  const { build, skill } = context;
  const buffs = levelBuffs
    .filter(
      (buff) => buff.tableVariable !== build.tableVariable && applies(buff.appliesWhen, context),
    )
    .reduce((total, buff) => total + levelEias(buff.formula, build.speed[buff.field]), 0);

  const slows =
    levelEias(holyFreeze.formula, build.slows.holyFreeze) +
    build.slows.slowedBy +
    (build.slows.decrepify && !skill.siasOnly ? flatSlows.decrepify : 0) +
    (build.slows.chilled ? flatSlows.chilled : 0) +
    (build.slows.lethargy ? flatSlows.lethargy : 0);

  const mark = build.speed.markOfTheBear ? markOfTheBear.sias : 0;

  if (!context.player) {
    return buffs + mark - slows;
  }

  const sequence = skill.family === "sequence" ? sequenceSiasPenalty.sias : 0;

  return buffs + mark - slows + sequence + skill.siasModifier;
}

function weaponIas(context: Context, hand: Hand): number {
  const { build } = context;

  if (hand === "primary") {
    return build.tableVariable === "primary-wias" ? 0 : build.speed.primaryWias;
  }

  return build.tableVariable === "secondary-wias" ? 0 : build.speed.secondaryWias;
}

function averagesWeaponSpeed(context: Context): boolean {
  const { build, skill } = context;
  const dualWieldSequence = skill.dualWieldOnly && skill.family === "sequence";

  return (
    (dualWieldSequence &&
      weaponSpeedAveraging.dualWieldSequenceCharacters.includes(build.character)) ||
    (context.dualWielding && weaponSpeedAveraging.dualWieldCharacters.includes(build.character))
  );
}

export function eiasValues(context: Context, hand: Hand): EiasValues {
  const siasValue = sias(context);

  if (context.skill.siasOnly) {
    return {
      eias: siasValue,
      sias: siasValue,
      wsm1: unusedSlot,
      wsm2: unusedSlot,
      gias: unusedSlot,
      wias1: unusedSlot,
      wias2: unusedSlot,
    };
  }

  const gias = context.build.tableVariable === "ias" ? 0 : context.build.speed.ias;
  const wsm1 = handWeapon(context, hand).wsm;
  const wias1 = weaponIas(context, hand);

  if (!averagesWeaponSpeed(context)) {
    return {
      eias: siasValue - wsm1 + iasToEias(gias + wias1),
      sias: siasValue,
      wsm1,
      wsm2: unusedSlot,
      gias,
      wias1,
      wias2: unusedSlot,
    };
  }

  const wsm2 = handWeapon(context, otherHand(hand)).wsm;
  const wias2 = weaponIas(context, otherHand(hand));
  const ieias = (iasToEias(gias + wias1) + iasToEias(gias + wias2)) / 2;

  return {
    eias: Math.trunc(siasValue - (wsm1 + wsm2) / 2 + ieias),
    sias: siasValue,
    wsm1,
    wsm2,
    gias,
    wias1,
    wias2,
  };
}

/** The last acceleration a table tries. Source: calculator.js:25-84,808@bcc112d. */
export function maxAcceleration(context: Context): number {
  const { build } = context;
  const variable = build.tableVariable;

  if (variable === "eias") {
    return eiasLimits.max;
  }

  if (variable === "primary-wias" || variable === "secondary-wias") {
    return weaponIasCaps.acceleration;
  }

  if (variable !== "ias") {
    return levelEias(skillLevelBuff(variable).formula, maxSkillLevel.level);
  }

  if (!context.player) {
    return iasAccelerationCaps.mercenary;
  }

  const keepsOneHandedCap =
    weaponClassTraits[context.primary.weaponClass].oneHanded ||
    iasAccelerationCaps.twoHandedExempt.includes(build.character);

  return keepsOneHandedCap ? iasAccelerationCaps.oneHanded : iasAccelerationCaps.twoHanded;
}

function skillLevelBuff(variable: TableVariable): LevelBuff {
  const buff = variableBuff(variable);

  if (buff === undefined) {
    throw new Error(`no skill-level buff for the table variable ${variable}`);
  }

  return buff;
}

/** Clamps the EIAS a frame computation uses. Source: calculator.js:1226-1228@bcc112d. */
export function limitEias(context: Context, eias: number): number {
  const max = context.build.wereform === "none" ? eiasLimits.max : eiasLimits.wereformMax;

  return Math.max(eiasLimits.min, Math.min(max, eias));
}

/** The table variable value that reaches an EIAS need. Source: calculator.js:1470-1502@bcc112d. */
export function variableValue(context: Context, neededEias: number, values: EiasValues): number {
  const variable = context.build.tableVariable;

  if (variable === "eias") {
    return neededEias;
  }

  if (variable === "ias") {
    return Math.max(
      0,
      eiasToIas(neededEias - values.sias + values.wsm1) - values.gias - values.wias1,
    );
  }

  if (variable !== "primary-wias" && variable !== "secondary-wias") {
    return levelFromEias(skillLevelBuff(variable), neededEias - values.eias);
  }

  const otherWias = variable === "secondary-wias" ? values.wias1 : values.wias2;

  const combined =
    2 * neededEias -
    2 * values.sias +
    values.wsm1 +
    values.wsm2 -
    iasToEias(values.gias + otherWias);

  return eiasToIas(combined) - values.gias;
}

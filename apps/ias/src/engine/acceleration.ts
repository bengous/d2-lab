import type { WeaponClass } from "@/contracts/game-data";
import type { RollbackHits } from "@/contracts/result";
import { wereformFrames } from "@/data/rules/animation";
import { eiasLimits } from "@/data/rules/caps";
import type { RollbackRule } from "@/data/rules/rollbacks";
import { type Context, type Hand, handWeapon } from "@/engine/context";
import { animationSpeed, framesPerDirection, startingFrame } from "@/engine/frames";
import {
  type EiasValues,
  eiasValues,
  limitEias,
  maxAcceleration,
  variableValue,
} from "@/engine/speed";

export interface Breakpoint<Frames> {
  /** EIAS that reaches the frames: acceleration plus the table's own EIAS. */
  readonly eias: number;
  readonly frames: Frames;
}

export interface AccelerationTable<Frames> {
  readonly eiasValues: EiasValues;
  readonly breakpoints: readonly Breakpoint<Frames>[];
}

interface SpeedStep {
  readonly acceleration: number;
  readonly speed: number;
}

interface Animation {
  readonly weaponClass: WeaponClass;
  readonly firstHit: number;
  readonly start: number;
  readonly values: EiasValues;
  /** The table's own EIAS, 0 when EIAS is the variable. */
  readonly eias: number;
  readonly steps: readonly SpeedStep[];
}

/**
 * Every acceleration where the animation speed changes. The acceleration stays at 0 when the
 * variable is the other hand's WIAS. Source: calculator.js:790-848@bcc112d.
 */
function animate(context: Context, hand: Hand, firstHit: number): Animation {
  const { build } = context;
  const { weaponClass } = handWeapon(context, hand);
  const values = eiasValues(context, hand);
  const eiasVariable = build.tableVariable === "eias";
  const eias = eiasVariable ? 0 : values.eias;
  const otherHandVariable = hand === "primary" ? "secondary-wias" : "primary-wias";
  const speed = animationSpeed(context, weaponClass, firstHit);
  const humanFrames = framesPerDirection(context, weaponClass);
  const lastAcceleration = eiasVariable ? eiasLimits.max : maxAcceleration(context);
  const steps: SpeedStep[] = [];
  let lastSpeed = 0;

  for (
    let acceleration = eiasVariable ? eiasLimits.min : 0;
    acceleration <= lastAcceleration;
    acceleration++
  ) {
    const applied = build.tableVariable === otherHandVariable ? 0 : acceleration;
    const limited = limitEias(context, eias + applied);
    const stepSpeed =
      build.wereform === "none"
        ? Math.trunc((speed * (100 + limited)) / 100)
        : Math.trunc(
            (speed + Math.trunc((speed * limited) / 100)) *
              (wereformFrames[build.wereform].framesPerDirection / humanFrames),
          );

    if (stepSpeed !== lastSpeed) {
      lastSpeed = stepSpeed;
      steps.push({ acceleration, speed: stepSpeed });
    }
  }

  return {
    weaponClass,
    firstHit,
    start: startingFrame(context, weaponClass),
    values,
    eias,
    steps,
  };
}

/** Source: calculator.js:852-854,899-906@bcc112d. */
function singleHitFrames(context: Context, animation: Animation, speed: number): number {
  const offset = context.skill.family === "simple" ? 1 : 0;
  const length = (256 * (animation.firstHit - animation.start)) / speed;

  return context.skill.family === "whirlwind" ? Math.trunc(length) : Math.ceil(length) - offset;
}

/** One number of frames per breakpoint. */
export function singleHitTable(
  context: Context,
  hand: Hand,
  firstHit: number,
): AccelerationTable<number> {
  const animation = animate(context, hand, firstHit);
  const breakpoints: Breakpoint<number>[] = [];
  let previous = 0;

  for (const { acceleration, speed } of animation.steps) {
    const frames = singleHitFrames(context, animation, speed);

    if (frames !== previous) {
      previous = frames;
      breakpoints.push({ eias: acceleration + animation.eias, frames });
    }
  }

  return { eiasValues: animation.values, breakpoints };
}

/** One attack of the primary weapon at the build's `current`. */
export interface CurrentAttack {
  /** In 256ths of a sprite frame per game frame. */
  readonly speed: number;
  /** The sprite frame the attack starts on. */
  readonly start: number;
  readonly frames: number;
}

interface CurrentStep {
  readonly animation: Animation;
  readonly speed: number;
}

/** The steps of one table row: from the step where the frames change to the next such step. */
type RowSteps = readonly [SpeedStep, ...SpeedStep[]];

function rowsOf(
  animation: Animation,
  framesAt: (animation: Animation, speed: number) => string,
): readonly RowSteps[] {
  const rows: [SpeedStep, ...SpeedStep[]][] = [];
  let previous: string | null = null;

  for (const step of animation.steps) {
    const frames = framesAt(animation, step.speed);
    const row = rows.at(-1);

    if (row === undefined || frames !== previous) {
      rows.push([step]);
      previous = frames;
    } else {
      row.push(step);
    }
  }

  return rows;
}

/**
 * The speed step at the build's `current`. The row is picked as `locate` picks it: the greatest
 * value of the table variable at or below `current`, the last on a tie, else the first row. Within
 * the row, the last step at or below `current`. Past the IAS conversion's limit, steps count as
 * 0 IAS again: a pick among every step would land on the fastest.
 */
function currentStep(
  context: Context,
  firstHit: number,
  framesAt: (animation: Animation, speed: number) => string,
): CurrentStep {
  const animation = animate(context, "primary", firstHit);
  const { current } = context.build;
  const valueOf = (step: SpeedStep): number =>
    variableValue(context, step.acceleration + animation.eias, animation.values);

  const rows = rowsOf(animation, framesAt);
  let picked = rows[0];
  let pickedValue = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const value = valueOf(row[0]);

    if (value <= current && value >= pickedValue) {
      picked = row;
      pickedValue = value;
    }
  }

  if (picked === undefined) {
    throw new Error(`no speed step for ${context.build.skill}`);
  }

  const step = picked.findLast((candidate) => valueOf(candidate) <= current) ?? picked[0];

  return { animation, speed: step.speed };
}

export function currentAttack(context: Context, firstHit: number): CurrentAttack {
  const { animation, speed } = currentStep(context, firstHit, (played, stepSpeed) =>
    String(singleHitFrames(context, played, stepSpeed)),
  );

  return { speed, start: animation.start, frames: singleHitFrames(context, animation, speed) };
}

/**
 * The hits the original notation keeps, which can skip some of the list: six hits with a second
 * hit unlike the fourth keep the third as the repeated one. Source: calculator.js:1011-1037@bcc112d.
 */
export function groupHits(hits: readonly number[]): RollbackHits {
  const at = (index: number): number => {
    const value = hits[index];

    if (value === undefined) {
      throw new Error(`no hit ${index} in ${hits.join(",")}`);
    }

    return value;
  };

  const last = at(hits.length - 1);

  if (hits.length === 3) {
    return at(0) === at(1)
      ? { first: [], repeated: [at(0)], last }
      : { first: [at(0)], repeated: [at(1)], last };
  }

  if (hits.length === 5) {
    if (at(1) === at(2)) {
      return { first: [at(0)], repeated: [at(1)], last };
    }

    if (at(1) === at(3)) {
      return { first: [at(0), at(1)], repeated: [at(2), at(3)], last };
    }

    return { first: [at(0), at(1)], repeated: [at(2)], last };
  }

  if (hits.length >= 4 && hits.length % 2 === 0) {
    if (at(1) !== at(3)) {
      return { first: [at(0), at(1)], repeated: [at(2)], last };
    }

    return at(2) === at(3)
      ? { first: [at(0)], repeated: [at(1)], last }
      : { first: [at(0)], repeated: [at(1), at(2)], last };
  }

  throw new Error(`no format for ${hits.length} hits`);
}

/** `9+8+(6)+11`. */
export function rollbackNotation({ first, repeated, last }: RollbackHits): string {
  return [...first, `(${repeated.join("+")})`, last].join("+");
}

function sameHits(previous: readonly number[] | null, next: readonly number[]): boolean {
  return previous !== null && previous.every((value, index) => value === next[index]);
}

/** One hit of a rollback skill. */
export interface RollbackHit {
  /** The sprite frame it starts on. */
  readonly start: number;
  readonly frames: number;
}

/**
 * `count` hits, from 2. Each hit but the last plays up to `firstHit`, then rolls the animation back
 * by `factor` percent of the sprite frame it reached. The last hit plays the whole swing from where
 * the hit before it started. Source: calculator.js:852-854,858-892@bcc112d.
 */
function rollbackHits(
  animation: Animation,
  rollback: RollbackRule,
  lastHitFrames: number,
  speed: number,
  count: number,
): readonly RollbackHit[] {
  if (count < 2) {
    throw new Error(`a rollback skill makes 2 hits or more, not ${count}`);
  }

  const framesTo = (start: number, end: number): number => Math.ceil((256 * (end - start)) / speed);

  const rolledBack: RollbackHit[] = [];
  let hit: RollbackHit = {
    start: animation.start,
    frames: framesTo(animation.start, animation.firstHit) - rollback.firstHitOffset,
  };

  for (let index = 1; index < count - 1; index++) {
    rolledBack.push(hit);

    const played = Math.trunc((256 * hit.start + speed * hit.frames) / 256);
    const start = Math.trunc((played * (100 - rollback.factor)) / 100);

    hit = { start, frames: framesTo(start, animation.firstHit) };
  }

  return [...rolledBack, hit, { start: hit.start, frames: framesTo(hit.start, lastHitFrames) - 1 }];
}

function hitFrames(hits: readonly RollbackHit[]): readonly number[] {
  return hits.map(({ frames }) => frames);
}

function lastHitFramesOf(context: Context, rollback: RollbackRule, animation: Animation): number {
  return rollback.lastHitFrames ?? framesPerDirection(context, animation.weaponClass);
}

/** The hits of one use of a rollback skill at the build's `current`, and their animation speed. */
export interface CurrentRollback {
  readonly speed: number;
  readonly hits: readonly RollbackHit[];
}

export function currentRollback(
  context: Context,
  rollback: RollbackRule,
  firstHit: number,
  count: number,
): CurrentRollback {
  const hitsAt = (animation: Animation, speed: number): readonly RollbackHit[] =>
    rollbackHits(animation, rollback, lastHitFramesOf(context, rollback, animation), speed, count);

  const { animation, speed } = currentStep(context, firstHit, (played, stepSpeed) =>
    hitFrames(hitsAt(played, stepSpeed)).join("+"),
  );

  return { speed, hits: hitsAt(animation, speed) };
}

/** Each breakpoint holds the game frames of each hit. */
export interface RollbackTables {
  readonly main: AccelerationTable<readonly number[]>;
  readonly oddHits: AccelerationTable<readonly number[]> | null;
}

/** Source: calculator.js:856-898@bcc112d. */
export function rollbackTables(
  context: Context,
  rollback: RollbackRule,
  firstHit: number,
): RollbackTables {
  const animation = animate(context, "primary", firstHit);
  const lastHitFrames = lastHitFramesOf(context, rollback, animation);
  const mainCount = rollback.hits + 2;
  const main: Breakpoint<readonly number[]>[] = [];
  const oddHits: Breakpoint<readonly number[]>[] = [];
  let previousMain: readonly number[] | null = null;
  let previousOdd: readonly number[] | null = null;

  for (const { acceleration, speed } of animation.steps) {
    const eias = acceleration + animation.eias;
    const all = hitFrames(rollbackHits(animation, rollback, lastHitFrames, speed, mainCount));

    if (rollback.oddHitsTable) {
      const odd = hitFrames(rollbackHits(animation, rollback, lastHitFrames, speed, mainCount - 1));

      if (!sameHits(previousOdd, odd)) {
        previousOdd = odd;
        oddHits.push({ eias, frames: odd });
      }
    }

    if (!sameHits(previousMain, all)) {
      previousMain = all;
      main.push({ eias, frames: all });
    }
  }

  return {
    main: { eiasValues: animation.values, breakpoints: main },
    oddHits: rollback.oddHitsTable ? { eiasValues: animation.values, breakpoints: oddHits } : null,
  };
}

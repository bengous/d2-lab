import type { SkillId } from "@/contracts/build";
import type { BreakpointRow, RollbackHits } from "@/contracts/result";
import { gameFramesPerSecond } from "@/data/rules/animation";
import { skillRule } from "@/data/rules/skills";

/**
 * The frames of a row, per hit for a rollback skill: `8+(6)+11` reads `6 frames per hit · first
 * hit 8 · last hit 11`. The lists are the parts the UI joins with `·`.
 */
export interface FramesText {
  /** The large figure of a tile: `8`, `6` or `5–6`. */
  readonly figure: string;
  readonly unit: string;
  /** The hits outside the rhythm, `first hit 8`, `last hit 11`; none for a plain attack. */
  readonly others: readonly string[];
  /** The table cell: `8`, or `6 per hit`, `first 8`, `last 11`. */
  readonly cell: readonly string[];
}

/** `hits` when the frames count each hit, `attacks` when they count a whole use of the skill. */
export type PerSecondCount = "attacks" | "hits";

export interface PerSecondLabel {
  /** After the value in a tile. */
  readonly unit: string;
  readonly column: string;
}

export const perSecondLabels: Readonly<Record<PerSecondCount, PerSecondLabel>> = {
  attacks: { unit: "attacks per second", column: "Attacks per second" },
  hits: { unit: "hits per second", column: "Hits per second" },
};

function plainFrames(row: BreakpointRow): number {
  const [frames] = row.hits;

  if (frames === undefined) {
    throw new Error(`the row at ${row.value} has no hit`);
  }

  return frames;
}

function rhythm({ repeated: [one, other] }: RollbackHits): string {
  return other === undefined ? String(one) : `${Math.min(one, other)}–${Math.max(one, other)}`;
}

function rollbackText(rollback: RollbackHits): FramesText {
  const { first, last } = rollback;
  const figure = rhythm(rollback);
  const firstHits = first.join(", ");
  const tileFirst = first.length === 1 ? `first hit ${firstHits}` : `first hits ${firstHits}`;
  const lead = first.length === 0 ? [] : [tileFirst];
  const cellLead = first.length === 0 ? [] : [`first ${firstHits}`];

  return {
    figure,
    unit: "frames per hit",
    others: [...lead, `last hit ${last}`],
    cell: [`${figure} per hit`, ...cellLead, `last ${last}`],
  };
}

export function framesText(row: BreakpointRow): FramesText {
  if (row.rollback !== null) {
    return rollbackText(row.rollback);
  }

  const frames = String(plainFrames(row));

  return { figure: frames, unit: "frames", others: [], cell: [frames] };
}

function perSecondValue(hits: number, frames: number): string {
  return ((hits * gameFramesPerSecond.frames) / frames).toFixed(2);
}

/** For a rollback skill, the rhythm of the repeated hit: one alternating pair is two hits. */
export function perSecond(row: BreakpointRow): string {
  if (row.rollback === null) {
    return perSecondValue(1, plainFrames(row));
  }

  const { repeated } = row.rollback;

  return perSecondValue(
    repeated.length,
    repeated.reduce((sum, hit) => sum + hit, 0),
  );
}

/** A rollback skill and Whirlwind count each hit; the other sequences count a whole use. */
export function perSecondCount(skill: SkillId): PerSecondCount {
  const { family } = skillRule(skill);

  return family === "rollback" || family === "whirlwind" ? "hits" : "attacks";
}

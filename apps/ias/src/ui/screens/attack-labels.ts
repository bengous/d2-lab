import type { Unavailable } from "@/contracts/animation";
import type { SkillId, TableVariable } from "@/contracts/build";
import { gameFramesPerSecond } from "@/data/rules/animation";
import type { Playback } from "@/ui/hooks/use-game-clock";
import { tableVariables } from "@/ui/screens/labels";

/** Running text; the view highlights the figures. */
export type Phrase = readonly { readonly text: string; readonly figure: boolean }[];

function text(value: string): Phrase[number] {
  return { text: value, figure: false };
}

function figure(value: string): Phrase[number] {
  return { text: value, figure: true };
}

export interface AttackSentence {
  readonly lead: Phrase;
  readonly detail: string;
}

const perSecond = gameFramesPerSecond.frames;

export function seconds(frames: number): string {
  return (frames / perSecond).toFixed(2);
}

export const attackViewLabels = {
  watch: "Watch the attack",
  hide: "Hide the attack",
  section: "The attack",
  missing: "Animation files are missing",
  hit: "Hit",
  playback: "Playback",
  nextFrame: "Next frame",
  fastest: "This is the fastest breakpoint.",
  shield: "Shield",
  holyShield: "Holy Shield",
  holyShieldHint: "Holy Shield draws its own shield in place of the one held.",
} as const;

export const playbackLabels: Readonly<Record<Playback, string>> = {
  real: "Real speed",
  slow: "Slow ×4",
  step: "Step",
};

export function unavailableText(skill: string, reason: Unavailable["reason"]): string {
  return reason === "no-animation"
    ? `The game has no ${skill} animation with this weapon.`
    : `Animation not available for ${skill} yet`;
}

/** How the view names one use of a skill: Dodge avoids a blow, every other skill attacks. */
export interface Move {
  readonly noun: string;
  readonly verb: string;
}

const attack: Move = { noun: "attack", verb: "attacking" };

const moves: Readonly<Partial<Record<string, Move>>> = {
  dodge: { noun: "dodge", verb: "dodging" },
};

export function moveOf(skill: SkillId): Move {
  return moves[skill] ?? attack;
}

export function sceneLabel(character: string, move: Move): string {
  return `${character} ${move.verb} at the current breakpoint`;
}

/** `9`, `9 and 4`, `9, 4 and 5`. */
function listed(values: readonly number[]): string {
  const head = values.slice(0, -1);
  const tail = values.slice(-1).join("");

  return head.length === 0 ? tail : `${head.join(", ")} and ${tail}`;
}

/**
 * `hitFrames` count from 1: a hardcoded sequence lands several hits in one attack, and Dodge lands
 * none.
 */
export function attackSentence(
  move: Move,
  frames: number,
  hitFrames: readonly number[],
): AttackSentence {
  const total = [
    text(`Your ${move.noun} takes `),
    figure(`${frames} frames`),
    text(`: ${seconds(frames)} seconds.`),
  ];

  if (hitFrames.length === 0) {
    return {
      lead: total,
      detail: `The game runs at ${perSecond} frames per second. A ${move.noun} lands no hit.`,
    };
  }

  const hits = hitFrames.length === 1 ? " The hit lands on frame " : " The hits land on frames ";

  return {
    lead: [...total, text(hits), figure(listed(hitFrames)), text(".")],
    detail: `The game runs at ${perSecond} frames per second, so you ${move.noun} ${(perSecond / frames).toFixed(2)} times per second.`,
  };
}

/** `9 frames`, `9 and 4 frames`, `9, 4 and 5 frames`. */
function framesOf(values: readonly number[]): string {
  const frames = listed(values);

  return frames === "1" ? "1 frame" : `${frames} frames`;
}

/** `hit 2`, `hits 2 and 3` or `hits 2 to 5`, from 1. */
function hitRange(from: number, to: number): string {
  if (from === to) {
    return `hit ${from}`;
  }

  return to === from + 1 ? `hits ${from} and ${to}` : `hits ${from} to ${to}`;
}

function capitalized(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

/** The end of the list where the hits share one length or alternate between two. */
interface Rhythm {
  readonly length: number;
  readonly text: string;
}

/** The length of the run at the start of `values` where `kept(value, index)` holds. */
function runLength(
  values: readonly number[],
  kept: (value: number, index: number) => boolean,
): number {
  const end = values.findIndex((value, index) => !kept(value, index));

  return end === -1 ? values.length : end;
}

function rhythmOf(hits: readonly number[]): Rhythm | null {
  const reversed = hits.toReversed();
  const [last] = reversed;
  const same = runLength(reversed, (value) => value === last);
  const alternate = runLength(
    reversed,
    (value, index) => index < 2 || value === reversed[index - 2],
  );

  const range = (length: number): string => hitRange(hits.length - length + 1, hits.length);

  if (same >= 2) {
    return { length: same, text: `${range(same)} take ${framesOf(hits.slice(-1))} each` };
  }

  if (alternate >= 3) {
    const pair = hits.slice(-alternate, 2 - alternate);

    return { length: alternate, text: `${range(alternate)} take ${framesOf(pair)} in turn` };
  }

  return null;
}

/** The hits before the last: those before the rhythm settles, then the rhythm. */
function rolledBackText(hits: readonly number[]): string {
  const rhythm = rhythmOf(hits);
  const before = hits.slice(0, hits.length - (rhythm?.length ?? 0));
  const lead = `${hitRange(1, before.length)} ${before.length === 1 ? "takes" : "take"} ${framesOf(before)}`;

  if (rhythm === null) {
    return capitalized(lead);
  }

  return capitalized(before.length === 0 ? rhythm.text : `${lead}, then ${rhythm.text}`);
}

export interface SequenceOf {
  readonly skill: string;
  readonly character: string;
  /** Game frames of each hit. */
  readonly hits: readonly number[];
  /** Each hit before the last goes back to the start of the swing, not part of the way. */
  readonly fullRollback: boolean;
}

/** One use of a rollback skill: the total first, then each hit. */
export function sequenceSentence({
  skill,
  character,
  hits,
  fullRollback,
}: SequenceOf): AttackSentence {
  const frames = hits.reduce((sum, hit) => sum + hit, 0);
  const back = fullRollback ? "snaps back" : "snaps back part of the way";

  return {
    lead: [
      text(`One ${skill} makes `),
      figure(`${hits.length} hits`),
      text(" in "),
      figure(`${frames} frames`),
      text(`: ${seconds(frames)} seconds.`),
    ],
    detail: `${rolledBackText(hits.slice(0, -1))}: the ${character} strikes, then ${back} without finishing the swing. Hit ${hits.length} takes ${framesOf(hits.slice(-1))}: it finishes the swing.`,
  };
}

export function hitCountLabel(skill: string): string {
  return `Hits per ${skill}`;
}

const hitCountHints: Readonly<Partial<Record<string, string>>> = {
  zeal: "2 hits at skill level 1, one more per level up to 5 from level 4.",
};

export function hitCountHint(skill: SkillId, tableHits: number): string {
  return hitCountHints[skill] ?? `The breakpoint table counts ${tableHits} hits.`;
}

/** The label of a hit's thumbnails, when the attack makes several hits. */
export function hitGroupText(hit: number, hits: number, frames: number): string {
  const name = hit === hits ? `Hit ${hit}, the last` : `Hit ${hit}`;

  return `${name} · ${framesOf([frames])} (${seconds(frames)} s)`;
}

/** `frame 3 of 5`, or `hit 2 of 5 · frame 3 of 5` when the attack makes several hits. */
export function counterText(frame: number, frames: number, hit: number, hits: number): string {
  const within = `frame ${frame} of ${frames}`;

  return hits === 1 ? within : `hit ${hit} of ${hits} · ${within}`;
}

export function thumbnailText(frame: number, hit: boolean): string {
  return hit ? `${frame} · hit` : String(frame);
}

function moreLevels(more: number, value: number): string {
  return `${more} more ${more === 1 ? "level" : "levels"} (level ${value})`;
}

const moreSpeed: Readonly<Record<TableVariable, (more: number, value: number) => string>> = {
  eias: (more, value) => `${more} more EIAS (${value})`,
  ias: (more, value) => `${more} more IAS (${value})`,
  "primary-wias": (more, value) => `${more} more weapon IAS (${value})`,
  "secondary-wias": (more, value) => `${more} more off-hand IAS (${value})`,
  fanaticism: moreLevels,
  "burst-of-speed": moreLevels,
  werewolf: moreLevels,
  frenzy: moreLevels,
  maul: moreLevels,
};

export interface Comparison {
  readonly move: Move;
  readonly variable: TableVariable;
  readonly current: number;
  /** Hits of one use. */
  readonly hits: number;
  readonly frames: number;
  readonly next: { readonly value: number; readonly frames: number } | null;
}

export interface ComparisonText {
  readonly summary: string;
  readonly now: string;
  readonly next: string | null;
}

/**
 * The two rows of cells under the film strip: now and at the next breakpoint. A partial rollback
 * can split its hits differently at the next breakpoint, in as many frames or more.
 */
export function comparisonText({
  move,
  variable,
  current,
  hits,
  frames,
  next,
}: Comparison): ComparisonText {
  const now = `Now · ${frames} frames`;

  if (next === null) {
    return { summary: attackViewLabels.fastest, now, next: null };
  }

  const more = moreSpeed[variable](next.value - current, next.value);
  const per = hits === 1 ? `per ${move.noun}` : `for the ${hits} hits`;
  const gain = frames - next.frames;
  const change =
    gain === 0
      ? `still ${frames} frames ${per}`
      : `${next.frames} frames instead of ${frames}, ${seconds(Math.abs(gain))} s ${gain > 0 ? "faster" : "slower"} ${per}`;

  return {
    summary: `With ${more}: ${change}.`,
    now,
    next: `At ${tableVariables[variable].describe(next.value)} · ${next.frames} frames`,
  };
}

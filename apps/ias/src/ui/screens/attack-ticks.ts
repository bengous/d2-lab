import type { Tick, Timeline } from "@/contracts/animation";

/** A tick with its place: the hit it belongs to and its game frame within that hit, from 1. */
export interface PlacedTick {
  /** In the timeline, from 0. */
  readonly index: number;
  readonly hit: number;
  readonly frame: number;
  /** Game frames of its hit. */
  readonly frames: number;
  readonly tick: Tick;
}

export type HitGroup = readonly PlacedTick[];

/** The ticks of a timeline, grouped by hit. */
export function placeTicks({ ticks, hits }: Timeline): readonly HitGroup[] {
  const groups: HitGroup[] = [];
  let start = 0;

  for (const [hit, frames] of hits.entries()) {
    const first = start;

    groups.push(
      ticks.slice(first, first + frames).map((tick, offset) => ({
        index: first + offset,
        hit: hit + 1,
        frame: offset + 1,
        frames,
        tick,
      })),
    );

    start += frames;
  }

  return groups;
}

export function placedAt(groups: readonly HitGroup[], index: number): PlacedTick {
  const placed = groups.flat().find((candidate) => candidate.index === index);

  if (placed === undefined) {
    throw new Error(`no tick ${index} in the timeline`);
  }

  return placed;
}

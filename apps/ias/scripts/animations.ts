import { join } from "node:path";

import type { CharacterId } from "@/contracts/build";
import type { FrameData, WeaponClass } from "@/contracts/game-data";

import { cell, readTable, type GameCache, type Row } from "./game-files";

type FrameRow = Partial<Record<CharacterId, FrameData>>;

export type FrameTable = Readonly<Record<WeaponClass, Readonly<FrameRow>>>;

interface Animation {
  readonly framesPerDirection: number;
  readonly actionFrame: number | null;
}

/** Animation tokens of the playable classes, `tools/d2r-data/README.md` "Classes and tokens". */
const classTokens: ReadonlyMap<CharacterId, string> = new Map([
  ["amazon", "AM"],
  ["assassin", "AI"],
  ["barbarian", "BA"],
  ["druid", "DZ"],
  ["necromancer", "NE"],
  ["paladin", "PA"],
  ["sorceress", "SO"],
  ["warlock", "WK"],
]);

function parseAnimation(row: Row): Animation {
  const [firstFlag = ""] = cell(row, "flagged_frames").split(",");
  const [frame = ""] = firstFlag.split("=");

  return {
    framesPerDirection: Number(cell(row, "frames_per_direction")),
    actionFrame: frame === "" ? null : Number(frame),
  };
}

/** `animdata.tsv` repeats about 30 names: the first record wins, as in `tools/d2r-data`. */
export async function readAnimations(cache: GameCache): Promise<ReadonlyMap<string, Animation>> {
  const rows = await readTable(join(cache.dir, "animdata.tsv"), [
    "cof",
    "frames_per_direction",
    "flagged_frames",
  ]);

  const animations = new Map<string, Animation>();

  for (const row of rows) {
    const name = cell(row, "cof");

    if (!animations.has(name)) {
      animations.set(name, parseAnimation(row));
    }
  }

  return animations;
}

/** Throws unless the two throw animations agree: the contract keeps one `th` entry per class. */
function throwAnimation(
  animations: ReadonlyMap<string, Animation>,
  token: string,
): Animation | undefined {
  const swinging = animations.get(`${token}TH1HS`);
  const thrusting = animations.get(`${token}TH1HT`);

  if (
    swinging?.framesPerDirection !== thrusting?.framesPerDirection ||
    swinging?.actionFrame !== thrusting?.actionFrame
  ) {
    throw new Error(`animdata: ${token}TH1HS and ${token}TH1HT differ`);
  }

  return swinging;
}

/**
 * Mode A1, or TH for `th`. `alternate` is the A2 length when it differs from A1: Warren's
 * calculator draws a second table for it (`calculator.js:702`).
 */
function frameData(
  animations: ReadonlyMap<string, Animation>,
  token: string,
  weaponClass: WeaponClass,
): FrameData | undefined {
  if (weaponClass === "th") {
    const animation = throwAnimation(animations, token);

    return animation === undefined ? undefined : { ...animation, alternate: null };
  }

  const suffix = weaponClass === "ht" ? "HT1" : weaponClass.toUpperCase();
  const first = animations.get(`${token}A1${suffix}`);
  const second = animations.get(`${token}A2${suffix}`);

  if (first === undefined) {
    return undefined;
  }

  const alternate =
    second === undefined || second.framesPerDirection === first.framesPerDirection
      ? null
      : second.framesPerDirection;

  return {
    framesPerDirection: first.framesPerDirection,
    alternate,
    actionFrame: first.actionFrame,
  };
}

function frameRow(animations: ReadonlyMap<string, Animation>, weaponClass: WeaponClass): FrameRow {
  const row: FrameRow = {};

  for (const [character, token] of classTokens) {
    const entry = frameData(animations, token, weaponClass);

    if (entry !== undefined) {
      row[character] = entry;
    }
  }

  return row;
}

export async function extractFrames(cache: GameCache): Promise<FrameTable> {
  const animations = await readAnimations(cache);

  return {
    hth: frameRow(animations, "hth"),
    ht: frameRow(animations, "ht"),
    "1hs": frameRow(animations, "1hs"),
    "1ht": frameRow(animations, "1ht"),
    "2hs": frameRow(animations, "2hs"),
    "2ht": frameRow(animations, "2ht"),
    stf: frameRow(animations, "stf"),
    bow: frameRow(animations, "bow"),
    xbw: frameRow(animations, "xbw"),
    th: frameRow(animations, "th"),
  };
}

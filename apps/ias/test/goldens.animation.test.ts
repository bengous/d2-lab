import { expect, test } from "bun:test";

import type { Timeline } from "@/contracts/animation";
import type { Build } from "@/contracts/build";
import type { BreakpointRow, BreakpointTable } from "@/contracts/result";
import { gameData } from "@/data/generated/game-data";
import { playerSequences } from "@/data/rules/player-sequences";
import { shieldGraphics, skillsWithoutHit } from "@/data/rules/sprites";
import { attackTimeline } from "@/engine/animation";
import { computeTables } from "@/engine/compute-tables";
import { locate } from "@/engine/locate";

import { goldenFiles } from "./golden-suite";
import { fromOriginalInput } from "./original";

interface Checked {
  readonly id: string;
  readonly skill: string;
  readonly token: string;
  readonly weaponClass: string;
  /** The row's `frames`, `(5)+10`. */
  readonly notation: string;
  readonly row: readonly number[];
  readonly timeline: readonly number[];
  /** The hit of each tick where one lands, in order. */
  readonly landed: readonly number[];
  /** A row counts each hit of a rollback skill, one use of a hardcoded sequence; Dodge lands none. */
  readonly expectedHits: number;
  /** Ticks whose sprite frame its animation lacks. */
  readonly outside: readonly string[];
}

/**
 * The original table lifts a negative first value to 0 (`firstRowFloor`), which `locate` then picks
 * at 0: an Assassin with claws reads 90 frames at 0 EIAS, the frames of -85 EIAS. The timeline
 * plays the speed at `current`, 13 frames.
 */
function isLiftedFirstRow(table: BreakpointTable, row: BreakpointRow): boolean {
  const [first, second] = table.rows;

  return row === first && second !== undefined && second.value < first.value;
}

/** The rows a build reaches: `locate` picks the last of several rows that share a value. */
function reachedRows(table: BreakpointTable): readonly BreakpointRow[] {
  return table.rows.filter(
    (row) => locate(table, row.value)?.now === row && !isLiftedFirstRow(table, row),
  );
}

/** The tables of the primary weapon: the timeline plays neither the off-hand nor both hands merged. */
function primaryTables(build: Build): readonly BreakpointTable[] {
  return computeTables(build).tables.filter(({ role }) => role === "main" || role === "odd-hits");
}

/** The hits of a hardcoded sequence's steps: a player's by weapon class, a mercenary's own. */
function sequenceHits(build: Build, { clip }: Timeline): number | null {
  const mercenary = gameData.mercenaries[build.character];
  const steps =
    mercenary === undefined
      ? playerSequences[build.skill]?.byWeaponClass[clip.weaponClass]
      : mercenary.skillModes[build.skill] === "sq"
        ? mercenary.sequence
        : null;

  return steps?.hits.length ?? null;
}

function outsideTicks(build: Build, { clip, ticks }: Timeline): readonly string[] {
  const animations =
    clip.folder === "chars"
      ? gameData.animations[build.character]
      : gameData.monsterAnimations[clip.token];

  return ticks.flatMap(({ mode, position }) => {
    const frames = animations?.[`${mode}${clip.weaponClass}`]?.framesPerDirection ?? 0;

    return Math.floor(position) < frames ? [] : [`${mode}${clip.weaponClass} ${position}`];
  });
}

const checked: readonly Checked[] = [
  ...goldenFiles("single"),
  ...goldenFiles("dual"),
  ...goldenFiles("forms-mercs"),
]
  .flatMap(({ cases }) => cases)
  .flatMap(({ id, input }) => {
    const build = fromOriginalInput(input);

    return primaryTables(build).flatMap((table) =>
      reachedRows(table).flatMap((row) => {
        const timeline = attackTimeline(
          { ...build, current: row.value },
          row.hits.length,
          shieldGraphics.start,
        );

        if (timeline.kind === "unavailable") {
          return [];
        }

        return [
          {
            id,
            skill: build.skill,
            token: timeline.clip.token,
            weaponClass: timeline.clip.weaponClass,
            notation: row.frames,
            row: row.hits,
            timeline: timeline.hits,
            landed: timeline.ticks.flatMap(({ hit }) => (hit === null ? [] : [hit])),
            expectedHits: skillsWithoutHit.skills.some((skill) => skill === build.skill)
              ? 0
              : (sequenceHits(build, timeline) ?? row.hits.length),
            outside: outsideTicks(build, timeline),
          },
        ];
      }),
    );
  });

test("the golden builds the engine animates include every player class", () => {
  expect(new Set(checked.map(({ id }) => id)).size).toBeGreaterThan(1000);
});

test("they include every skill of the calculator, Whirlwind, Cleave and Mirrored Blades excepted", () => {
  expect(new Set(checked.map(({ skill }) => skill))).toEqual(
    new Set([
      "standard",
      "throw",
      "kick",
      "tiger-strike",
      "cobra-strike",
      "phoenix-strike",
      "dragon-tail",
      "laying-traps",
      "concentrate",
      "berserk",
      "bash",
      "stun",
      "smite",
      "sacrifice",
      "vengeance",
      "conversion",
      "dodge",
      "zeal",
      "strafe",
      "fend",
      "dragon-talon",
      "jab",
      "impale",
      "fists-of-fire",
      "claws-of-thunder",
      "blades-of-ice",
      "dragon-claw",
      "double-swing",
      "frenzy",
      "double-throw",
      "feral-rage",
      "hunger",
      "rabies",
      "fury",
      "taunt",
    ]),
  );
});

test("they include every dual-wield class", () => {
  const dualWield = new Set(["1ss", "1js", "1jt", "1st", "ht2"]);

  expect(
    new Set(
      checked.flatMap(({ weaponClass }) => (dualWield.has(weaponClass) ? [weaponClass] : [])),
    ),
  ).toEqual(dualWield);
});

test("they include both wereforms and every mercenary", () => {
  expect(new Set(checked.map(({ token }) => token))).toEqual(
    new Set(["am", "ai", "ba", "dz", "ne", "pa", "so", "wk", "40", "tg", "rg", "gu", "0a"]),
  );
});

test("the rollback rows cover the five notations", () => {
  const notations = checked.flatMap(({ row, notation }) =>
    row.length > 1 ? [notation.replaceAll(/\d+/gu, "n")] : [],
  );

  expect(new Set(notations)).toEqual(
    new Set(["(n)+n", "n+(n)+n", "n+n+(n)+n", "n+(n+n)+n", "n+n+(n+n)+n"]),
  );
});

test("at the hit count of its row, an attack lasts the game frames of each hit of the row", () => {
  expect(checked.filter(({ row, timeline }) => timeline.join("+") !== row.join("+"))).toEqual([]);
});

test("each hit lands once, in order", () => {
  expect(
    checked.filter(
      ({ landed, expectedHits }) =>
        landed.join(",") !==
        Array.from({ length: expectedHits }, (_, index) => index + 1).join(","),
    ),
  ).toEqual([]);
});

test("each tick shows a sprite frame of its animation", () => {
  expect(checked.filter(({ outside }) => outside.length > 0)).toEqual([]);
});

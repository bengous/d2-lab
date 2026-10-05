import { describe, expect, test } from "bun:test";

import type { BreakpointRow } from "@/contracts/result";
import { parseSkillId } from "@/data/rules/skills";
import { groupHits, rollbackNotation } from "@/engine/acceleration";
import { computeTables } from "@/engine/compute-tables";
import { framesText, perSecond, perSecondCount } from "@/ui/screens/hit-labels";

import { buildOf } from "./builds";

function rollbackRow(hits: readonly number[]): BreakpointRow {
  const rollback = groupHits(hits);

  return { value: 0, frames: rollbackNotation(rollback), hits, rollback };
}

function tileText(row: BreakpointRow): string {
  const { figure, unit, others } = framesText(row);

  return [`${figure} ${unit}`, ...others].join(" · ");
}

describe("a rollback row reads per hit", () => {
  test.each([
    {
      hits: [5, 5, 10],
      frames: "(5)+10",
      tile: "5 frames per hit · last hit 10",
      cell: "5 per hit · last 10",
      perSecond: "5.00",
    },
    {
      hits: [8, 6, 11],
      frames: "8+(6)+11",
      tile: "6 frames per hit · first hit 8 · last hit 11",
      cell: "6 per hit · first 8 · last 11",
      perSecond: "4.17",
    },
    {
      hits: [9, 8, 6, 6, 6, 11],
      frames: "9+8+(6)+11",
      tile: "6 frames per hit · first hits 9, 8 · last hit 11",
      cell: "6 per hit · first 9, 8 · last 11",
      perSecond: "4.17",
    },
    {
      hits: [7, 5, 6, 5, 6, 10],
      frames: "7+(5+6)+10",
      tile: "5–6 frames per hit · first hit 7 · last hit 10",
      cell: "5–6 per hit · first 7 · last 10",
      perSecond: "4.55",
    },
    {
      hits: [8, 5, 4, 5, 13],
      frames: "8+5+(4+5)+13",
      tile: "4–5 frames per hit · first hits 8, 5 · last hit 13",
      cell: "4–5 per hit · first 8, 5 · last 13",
      perSecond: "5.56",
    },
  ])("$frames", ({ hits, frames, tile, cell, perSecond: value }) => {
    const row = rollbackRow(hits);

    expect(row.frames).toBe(frames);
    expect(tileText(row)).toBe(tile);
    expect(framesText(row).cell.join(" · ")).toBe(cell);
    expect(perSecond(row)).toBe(value);
  });
});

describe("a plain attack reads in frames", () => {
  const row: BreakpointRow = { value: 5, frames: "8", hits: [8], rollback: null };

  test("its tile and cell show the frames", () => {
    expect(framesText(row)).toEqual({ figure: "8", unit: "frames", others: [], cell: ["8"] });
  });

  test("it lasts 25 / 8 of a second", () => {
    expect(perSecond(row)).toBe("3.13");
  });
});

describe("the engine lists every hit", () => {
  test("a Strafe table lists the six hits it computes, its odd-hits table five", () => {
    const tables = computeTables(buildOf({ skill: "strafe", primary: "light-crossbow" })).tables;

    expect(tables.map(({ role, rows }) => [role, rows[0]?.hits.length])).toEqual([
      ["main", 6],
      ["odd-hits", 5],
    ]);
  });

  test("a plain attack lists one hit, the frames of its row", () => {
    const [table] = computeTables(buildOf({ skill: "standard", primary: "short-bow" })).tables;

    expect(table?.rows.every((row) => row.hits.join() === row.frames)).toBe(true);
    expect(table?.rows.every((row) => row.rollback === null)).toBe(true);
  });
});

test.each([
  ["zeal", "hits"],
  ["whirlwind", "hits"],
  ["frenzy", "attacks"],
  ["smite", "attacks"],
] as const)("%s counts %s per second", (skill, count) => {
  expect(perSecondCount(parseSkillId(skill))).toBe(count);
});

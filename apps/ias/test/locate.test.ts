import { describe, expect, test } from "bun:test";

import type { BreakpointRow, BreakpointTable, Result, TableRole } from "@/contracts/result";
import { locate } from "@/engine/locate";
import { primaryTable } from "@/engine/primary-table";

function table(values: readonly number[], role: TableRole = "main"): BreakpointTable {
  return {
    role,
    variable: "fanaticism",
    rows: values.map((value, index) => ({
      value,
      frames: `${index}`,
      hits: [index],
      rollback: null,
    })),
  };
}

function row(from: BreakpointTable, index: number): BreakpointRow {
  const found = from.rows[index];

  if (found === undefined) {
    throw new Error(`no row ${index}`);
  }

  return found;
}

describe("locate", () => {
  const sorted = table([0, 5, 24, 65]);

  test("now is the last row at or below current, next the first row above", () => {
    expect(locate(sorted, 20)).toEqual({ now: row(sorted, 1), next: row(sorted, 2) });
  });

  test("a value equal to current is now", () => {
    expect(locate(sorted, 24)).toEqual({ now: row(sorted, 2), next: row(sorted, 3) });
  });

  test("next is null past the last breakpoint", () => {
    expect(locate(sorted, 400)).toEqual({ now: row(sorted, 3), next: null });
  });

  test("now is the first row when current is below every value", () => {
    const negative = table([-84, -83]);

    expect(locate(negative, -85)).toEqual({ now: row(negative, 0), next: row(negative, 0) });
  });

  test("unsorted rows: now is the greatest value at or below current, the last one on a tie", () => {
    const unsorted = table([0, 1, 1, 1, 2, 4, 11, 45]);

    expect(locate(unsorted, 1)).toEqual({ now: row(unsorted, 3), next: row(unsorted, 4) });
  });

  test("a table without rows has no location", () => {
    expect(locate(table([]), 0)).toBeNull();
  });

  test("unsorted rows: next is the smallest value above current", () => {
    const unsorted = table([0, -84, -83, 12, 5]);

    expect(locate(unsorted, 0)).toEqual({ now: row(unsorted, 0), next: row(unsorted, 4) });
  });
});

describe("primaryTable", () => {
  const main = table([0]);
  const offHand = table([1], "off-hand");
  const merged = table([2], "merged");

  test("the merged Whirlwind table wins", () => {
    const whirlwind: Result = { tables: [main, offHand, merged] };

    expect(primaryTable(whirlwind)).toBe(merged);
  });

  test("the first table otherwise", () => {
    expect(primaryTable({ tables: [main, offHand] })).toBe(main);
  });
});

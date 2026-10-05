import type { Locate } from "@/contracts/engine";
import type { BreakpointRow } from "@/contracts/result";

/**
 * Original tables can be unsorted. `now` is the row with the greatest value at or below `current`,
 * the last one on a tie, or the first row when `current` is below every value. `next` is the row
 * with the smallest value above `current`, the first one on a tie.
 */
export const locate: Locate = (table, current) => {
  const [first] = table.rows;

  if (first === undefined) {
    return null;
  }

  let now: BreakpointRow | null = null;
  let next: BreakpointRow | null = null;

  for (const row of table.rows) {
    if (row.value <= current && (now === null || row.value >= now.value)) {
      now = row;
    }

    if (row.value > current && (next === null || row.value < next.value)) {
      next = row;
    }
  }

  return { now: now ?? first, next };
};

import type { AccelerationTable, Breakpoint } from "@/engine/acceleration";

function averageUp(left: number, right: number): number {
  return Math.ceil((left + right) / 2);
}

interface HandBreakpoint {
  readonly left: boolean;
  readonly breakpoint: Breakpoint<number>;
}

function firstBreakpoint(table: AccelerationTable<number>): Breakpoint<number> {
  const [first] = table.breakpoints;

  if (first === undefined) {
    throw new Error("a Whirlwind table has no breakpoint");
  }

  return first;
}

/**
 * The table both Whirlwind weapons swing at: the rounded-up average of the two hands, kept only
 * when it drops. It converts with the EIAS values of the slower hand.
 * Source: calculator.js:913-973@bcc112d.
 */
export function mergeHands(
  leftTable: AccelerationTable<number>,
  rightTable: AccelerationTable<number>,
): AccelerationTable<number> {
  let left = firstBreakpoint(leftTable);
  let right = firstBreakpoint(rightTable);
  let average = averageUp(left.frames, right.frames);
  const later: readonly HandBreakpoint[] = [
    ...leftTable.breakpoints
      .slice(1)
      .map((breakpoint): HandBreakpoint => ({ left: true, breakpoint })),
    ...rightTable.breakpoints
      .slice(1)
      .map((breakpoint): HandBreakpoint => ({ left: false, breakpoint })),
  ].toSorted((a, b) => a.breakpoint.eias - b.breakpoint.eias);

  const merged: Breakpoint<number>[] = [{ eias: Math.min(left.eias, right.eias), frames: average }];

  for (const { left: isLeft, breakpoint } of later) {
    const current = isLeft ? left : right;

    if (current.frames > breakpoint.frames) {
      if (isLeft) {
        left = breakpoint;
      } else {
        right = breakpoint;
      }

      const next = averageUp(left.frames, right.frames);

      if (next < average) {
        average = next;
        merged.push({ eias: breakpoint.eias, frames: next });
      }
    }
  }

  const slower = leftTable.eiasValues.eias > rightTable.eiasValues.eias ? rightTable : leftTable;

  return { eiasValues: slower.eiasValues, breakpoints: merged };
}

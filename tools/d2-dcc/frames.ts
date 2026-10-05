/**
 * Part of the DCC decoder ported from OpenDiablo2 `d2common/d2fileformats/d2dcc` at
 * 7f92c571bf04057a7fbdfb5d25a486f7d775e3c3, under GPL-3.0 like its source.
 *
 * @module
 */

import type { BitReader } from "./bit-reader";
import type { Cell, FrameCells, Grid, LastCell, PixelEntry } from "./types";

function copyRows(from: Uint8Array, to: Uint8Array, cell: Cell, stride: number): void {
  for (let y = 0; y < cell.height; y++) {
    const start = cell.x + (y + cell.y) * stride;

    to.set(from.subarray(start, start + cell.width), start);
  }
}

/** Repeats the cell this grid cell drew last, or clears it when the size changed. */
function repeatCell(work: Uint8Array, out: Uint8Array, cell: Cell, last: LastCell, stride: number) {
  if (cell.width !== last.width || cell.height !== last.height) {
    for (let y = 0; y < cell.height; y++) {
      const start = cell.x + (y + cell.y) * stride;

      work.fill(0, start, start + cell.width);
    }

    return;
  }

  for (let y = 0; y < cell.height; y++) {
    for (let x = 0; x < cell.width; x++) {
      work[x + cell.x + (y + cell.y) * stride] = work[x + last.x + (y + last.y) * stride]!;
    }
  }

  copyRows(work, out, cell, stride);
}

function drawCell(
  work: Uint8Array,
  entry: PixelEntry,
  cell: Cell,
  codes: BitReader,
  stride: number,
) {
  if (entry.value[0] === entry.value[1]) {
    for (let y = 0; y < cell.height; y++) {
      const start = cell.x + (y + cell.y) * stride;

      work.fill(entry.value[0]!, start, start + cell.width);
    }

    return;
  }

  const bits = entry.value[1] === entry.value[2] ? 1 : 2;

  for (let y = 0; y < cell.height; y++) {
    for (let x = 0; x < cell.width; x++) {
      work[x + cell.x + (y + cell.y) * stride] = entry.value[codes.bits(bits)]!;
    }
  }
}

export function generateFrames(
  grid: Grid,
  frames: readonly FrameCells[],
  buffer: readonly PixelEntry[],
  codes: BitReader,
): readonly Uint8Array[] {
  const stride = grid.box.width;
  const work = new Uint8Array(stride * grid.box.height);
  const lastCells: LastCell[] = Array.from({ length: grid.columns * grid.rows }, () => ({
    width: -1,
    height: -1,
    x: 0,
    y: 0,
  }));

  let next = 0;

  return frames.map(({ cells }, frame) => {
    const out = new Uint8Array(stride * grid.box.height);

    for (const [index, cell] of cells.entries()) {
      const last = lastCells[Math.trunc(cell.x / 4) + Math.trunc(cell.y / 4) * grid.columns]!;
      const entry = buffer[next];

      if (entry?.frame === frame && entry.frameCell === index) {
        drawCell(work, entry, cell, codes, stride);
        copyRows(work, out, cell, stride);
        next++;
      } else {
        repeatCell(work, out, cell, last, stride);
      }

      Object.assign(last, { width: cell.width, height: cell.height, x: cell.x, y: cell.y });
    }

    return out;
  });
}

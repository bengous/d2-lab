/**
 * Part of the DCC decoder ported from OpenDiablo2 `d2common/d2fileformats/d2dcc` at
 * 7f92c571bf04057a7fbdfb5d25a486f7d775e3c3, under GPL-3.0 like its source.
 *
 * @module
 */

import type { FrameCells, Grid, PixelEntry, Streams, StreamSizes } from "./types";

const pixelMaskLookup = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4] as const;

/** The palette slots of one cell, the newest first, until a repeat ends the list. */
function cellColors(mask: number, streams: Streams, encodingTypeBits: number): readonly number[] {
  const count = pixelMaskLookup[mask]!;
  const raw = count !== 0 && encodingTypeBits > 0 && streams.encodingType.bit() === 1;
  const colors: number[] = [];
  let last = 0;

  for (let index = 0; index < count; index++) {
    let color = raw ? streams.rawPixel.bits(8) : last;

    if (!raw) {
      let displacement = streams.pixelCodes.bits(4);

      color += displacement;

      while (displacement === 15) {
        displacement = streams.pixelCodes.bits(4);
        color += displacement;
      }
    }

    if (color === last) {
      break;
    }

    last = color;
    colors.push(color);
  }

  return colors;
}

function cellValue(mask: number, colors: readonly number[], old: PixelEntry | null): Uint8Array {
  const value = new Uint8Array(4);
  let next = colors.length - 1;

  for (let index = 0; index < 4; index++) {
    if ((mask & (1 << index)) === 0) {
      value[index] = old?.value[index] ?? 0;
    } else {
      value[index] = next >= 0 ? colors[next]! : 0;
      next--;
    }
  }

  return value;
}

export function fillPixelBuffer(
  grid: Grid,
  frames: readonly FrameCells[],
  streams: Streams,
  streamBits: StreamSizes,
): readonly PixelEntry[] {
  const buffer: PixelEntry[] = [];
  const cellBuffer: (PixelEntry | null)[] = Array.from(
    { length: grid.columns * grid.rows },
    () => null,
  );

  for (const [frame, cells] of frames.entries()) {
    const originX = Math.trunc((cells.box.left - grid.box.left) / 4);
    const originY = Math.trunc((cells.box.top - grid.box.top) / 4);

    for (let cellY = 0; cellY < cells.rows; cellY++) {
      for (let cellX = 0; cellX < cells.columns; cellX++) {
        const current = originX + cellX + (cellY + originY) * grid.columns;
        const old = cellBuffer[current] ?? null;
        const equal = old !== null && streamBits.equalCells > 0 && streams.equalCells.bit() === 1;

        if (!equal) {
          const mask = old === null ? 0x0f : streams.pixelMask.bits(4);
          const colors = cellColors(mask, streams, streamBits.encodingType);
          const entry = {
            value: cellValue(mask, colors, old),
            frame,
            frameCell: cellX + cellY * cells.columns,
          };

          buffer.push(entry);
          cellBuffer[current] = entry;
        }
      }
    }
  }

  return buffer;
}

/**
 * DCC decoder: a TypeScript port of OpenDiablo2 `d2common/d2fileformats/d2dcc` at
 * 7f92c571bf04057a7fbdfb5d25a486f7d775e3c3, under GPL-3.0 like its source. The functions follow the
 * steps of `dcc_direction.go`: header, frame headers, streams, cells, pixel buffer, frames.
 *
 * @module
 */
import { BitReader } from "./bit-reader";
import { generateFrames } from "./frames";
import { fillPixelBuffer } from "./pixel-buffer";
import type { Box, Cell, DccDirection, DccFile, FrameCells, Streams, StreamSizes } from "./types";

export type { Box, DccDirection, DccFile } from "./types";

const crazyBitTable = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32] as const;

interface DirectionHeader {
  readonly compression: number;
  readonly variable0Bits: number;
  readonly widthBits: number;
  readonly heightBits: number;
  readonly xOffsetBits: number;
  readonly yOffsetBits: number;
  readonly optionalBits: number;
  readonly codedBytesBits: number;
}

function sizes(count: number, total: number, first: number): readonly number[] {
  if (count === 1) {
    return [total];
  }

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return first;
    }

    return index === count - 1 ? total - first - 4 * (count - 2) : 4;
  });
}

function cellCount(length: number, first: number): number {
  if (length - first <= 1) {
    return 1;
  }

  const rest = length - first - 1;

  return 2 + Math.trunc(rest / 4) - (rest % 4 === 0 ? 1 : 0);
}

export function readDcc(bytes: Uint8Array): DccFile {
  const reader = new BitReader(bytes, 0);

  if (reader.bits(8) !== 0x74) {
    throw new Error("DCC: bad signature");
  }

  reader.bits(8);

  const directionCount = reader.bits(8);
  const framesPerDirection = reader.signed(32);

  if (reader.signed(32) !== 1) {
    throw new Error("DCC: expected 1");
  }

  reader.bits(32);

  const directionOffsets = Array.from({ length: directionCount }, () => reader.signed(32));

  return { directionCount, framesPerDirection, directionOffsets, bytes };
}

function directionHeader(reader: BitReader): DirectionHeader {
  reader.bits(32);

  const compression = reader.bits(2);
  const width = (): number => crazyBitTable[reader.bits(4)]!;

  return {
    compression,
    variable0Bits: width(),
    widthBits: width(),
    heightBits: width(),
    xOffsetBits: width(),
    yOffsetBits: width(),
    optionalBits: width(),
    codedBytesBits: width(),
  };
}

function frameBoxes(reader: BitReader, header: DirectionHeader, count: number): readonly Box[] {
  return Array.from({ length: count }, () => {
    reader.bits(header.variable0Bits);

    const width = reader.bits(header.widthBits);
    const height = reader.bits(header.heightBits);
    const x = reader.signed(header.xOffsetBits);
    const y = reader.signed(header.yOffsetBits);

    reader.bits(header.optionalBits);
    reader.bits(header.codedBytesBits);

    if (reader.bit() === 1) {
      throw new Error("DCC: bottom-up frames are not supported");
    }

    return { left: x, top: y - height + 1, width, height };
  });
}

function unionBox(boxes: readonly Box[]): Box {
  const left = Math.min(100_000, ...boxes.map((box) => box.left));
  const top = Math.min(100_000, ...boxes.map((box) => box.top));
  const right = Math.max(-100_000, ...boxes.map((box) => box.left + box.width));
  const bottom = Math.max(-100_000, ...boxes.map((box) => box.top + box.height));

  return { left, top, width: right - left, height: bottom - top };
}

function streamSizes(reader: BitReader, compression: number): StreamSizes {
  const equalCells = (compression & 2) === 0 ? 0 : reader.bits(20);
  const pixelMask = reader.bits(20);
  const encoded = (compression & 1) !== 0;
  const encodingType = encoded ? reader.bits(20) : 0;
  const rawPixel = encoded ? reader.bits(20) : 0;

  return { equalCells, pixelMask, encodingType, rawPixel };
}

function readPalette(reader: BitReader): Uint8Array {
  const palette = new Uint8Array(256);
  let next = 0;

  for (let index = 0; index < 256; index++) {
    if (reader.bit() === 1) {
      palette[next] = index;
      next++;
    }
  }

  return palette;
}

function splitStreams(reader: BitReader, streamBits: StreamSizes): Streams {
  const equalCells = reader.copy();

  reader.skip(streamBits.equalCells);

  const pixelMask = reader.copy();

  reader.skip(streamBits.pixelMask);

  const encodingType = reader.copy();

  reader.skip(streamBits.encodingType);

  const rawPixel = reader.copy();

  reader.skip(streamBits.rawPixel);

  return { equalCells, pixelMask, encodingType, rawPixel, pixelCodes: reader.copy() };
}

function frameCells(frame: Box, box: Box): FrameCells {
  const firstWidth = 4 - ((frame.left - box.left) % 4);
  const firstHeight = 4 - ((frame.top - box.top) % 4);
  const columns = cellCount(frame.width, firstWidth);
  const rows = cellCount(frame.height, firstHeight);
  const widths = sizes(columns, frame.width, firstWidth);
  const heights = sizes(rows, frame.height, firstHeight);
  const cells: Cell[] = [];
  let y = frame.top - box.top;

  for (const height of heights) {
    let x = frame.left - box.left;

    for (const width of widths) {
      cells.push({ width, height, x, y });
      x += width;
    }

    y += height;
  }

  return { box: frame, columns, rows, cells };
}

/** Decodes one direction: each direction starts at its own offset, so the others can be skipped. */
export function decodeDirection(file: DccFile, direction: number): DccDirection {
  const reader = new BitReader(file.bytes, file.directionOffsets[direction]! * 8);
  const header = directionHeader(reader);
  const boxes = frameBoxes(reader, header, file.framesPerDirection);
  const box = unionBox(boxes);

  if (header.optionalBits > 0) {
    throw new Error("DCC: optional data is not supported");
  }

  const streamBits = streamSizes(reader, header.compression);
  const palette = readPalette(reader);
  const streams = splitStreams(reader, streamBits);

  const grid = {
    box,
    columns: 1 + Math.trunc((box.width - 1) / 4),
    rows: 1 + Math.trunc((box.height - 1) / 4),
  };

  const frames = boxes.map((frame) => frameCells(frame, box));
  const buffer = fillPixelBuffer(grid, frames, streams, streamBits);

  for (const { value } of buffer) {
    value.set(Array.from(value, (slot) => palette[slot]!));
  }

  const decoded = generateFrames(grid, frames, buffer, streams.pixelCodes);

  if (
    streams.equalCells.bitsRead !== streamBits.equalCells ||
    streams.pixelMask.bitsRead !== streamBits.pixelMask ||
    streams.encodingType.bitsRead !== streamBits.encodingType ||
    streams.rawPixel.bitsRead !== streamBits.rawPixel
  ) {
    throw new Error("DCC: bitstream sizes do not match");
  }

  return { box, frames: decoded };
}

export function decodeDcc(bytes: Uint8Array): { readonly directions: readonly DccDirection[] } {
  const file = readDcc(bytes);

  return {
    directions: Array.from({ length: file.directionCount }, (_, index) =>
      decodeDirection(file, index),
    ),
  };
}

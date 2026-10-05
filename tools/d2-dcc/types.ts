/**
 * Part of the DCC decoder ported from OpenDiablo2 `d2common/d2fileformats/d2dcc` at
 * 7f92c571bf04057a7fbdfb5d25a486f7d775e3c3, under GPL-3.0 like its source.
 *
 * @module
 */

import type { BitReader } from "./bit-reader";

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface DccDirection {
  readonly box: Box;
  /** Palette indices, one array per frame, each covering `box` with stride `box.width`. */
  readonly frames: readonly Uint8Array[];
}

export interface DccFile {
  readonly directionCount: number;
  readonly framesPerDirection: number;
  readonly directionOffsets: readonly number[];
  readonly bytes: Uint8Array;
}

export interface Cell {
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
}

/** The cell of the direction grid a frame cell last drew, read to repeat an unchanged cell. */
export interface LastCell {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface FrameCells {
  readonly box: Box;
  readonly columns: number;
  readonly rows: number;
  readonly cells: readonly Cell[];
}

export interface Streams {
  readonly equalCells: BitReader;
  readonly pixelMask: BitReader;
  readonly encodingType: BitReader;
  readonly rawPixel: BitReader;
  readonly pixelCodes: BitReader;
}

export interface StreamSizes {
  readonly equalCells: number;
  readonly pixelMask: number;
  readonly encodingType: number;
  readonly rawPixel: number;
}

export interface PixelEntry {
  readonly value: Uint8Array;
  readonly frame: number;
  readonly frameCell: number;
}

export interface Grid {
  readonly box: Box;
  readonly columns: number;
  readonly rows: number;
}

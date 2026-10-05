/**
 * Reader of a COF file, the recipe of one legacy animation: its layers, sprite frames per
 * direction, and the order to stack the layers at each sprite frame. Layout from the files of
 * D2R 3.3.93847: a 28-byte header, 9 bytes per layer, one event byte per sprite frame, then one
 * layer byte per layer, sprite frame and direction.
 *
 * @module
 */

import type { LayerCode } from "@/contracts/animation";

/** Indexed by the layer type byte. */
const layerCodes: readonly LayerCode[] = [
  "hd",
  "tr",
  "lg",
  "ra",
  "la",
  "rh",
  "lh",
  "sh",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
];

export interface CofLayer {
  readonly code: LayerCode;
  /** The weapon class its DCC files carry, for example `1hs` or `hth`. */
  readonly weaponClass: string;
}

export interface Cof {
  readonly layers: readonly CofLayer[];
  readonly framesPerDirection: number;
  readonly directionCount: number;
  /** Per direction, then per sprite frame: the layers from back to front. */
  readonly order: readonly (readonly (readonly LayerCode[])[])[];
}

const headerBytes = 28;
const layerBytes = 9;
const weaponClassOffset = 5;

function byteAt(bytes: Uint8Array, offset: number): number {
  const value = bytes[offset];

  if (value === undefined) {
    throw new RangeError(`COF: no byte at ${offset} of ${bytes.length}`);
  }

  return value;
}

function layerCode(type: number): LayerCode {
  const code = layerCodes[type];

  if (code === undefined) {
    throw new RangeError(`COF: unknown layer type ${type}`);
  }

  return code;
}

function readLayer(bytes: Uint8Array, offset: number): CofLayer {
  const name = bytes.subarray(offset + weaponClassOffset, offset + layerBytes);
  const end = name.indexOf(0);

  return {
    code: layerCode(byteAt(bytes, offset)),
    weaponClass: new TextDecoder()
      .decode(end === -1 ? name : name.subarray(0, end))
      .trim()
      .toLowerCase(),
  };
}

export function readCof(bytes: Uint8Array): Cof {
  const layerCount = byteAt(bytes, 0);
  const framesPerDirection = byteAt(bytes, 1);
  const directionCount = byteAt(bytes, 2);
  const layers = Array.from({ length: layerCount }, (_, index) =>
    readLayer(bytes, headerBytes + index * layerBytes),
  );

  const orderStart = headerBytes + layerCount * layerBytes + framesPerDirection;
  const slotsOf = (start: number): readonly LayerCode[] =>
    Array.from({ length: layerCount }, (_, slot) => layerCode(byteAt(bytes, start + slot)));

  const framesOf = (direction: number): readonly (readonly LayerCode[])[] =>
    Array.from({ length: framesPerDirection }, (_, frame) =>
      slotsOf(orderStart + (direction * framesPerDirection + frame) * layerCount),
    );

  const order = Array.from({ length: directionCount }, (_, direction) => framesOf(direction));

  return { layers, framesPerDirection, directionCount, order };
}

/** The COF direction of one of the game's 64 directions: the nearest, counted from direction 0. */
export function cofDirection(direction64: number, directionCount: number): number {
  const step = 64 / directionCount;

  return Math.floor((direction64 + step / 2) / step) % directionCount;
}

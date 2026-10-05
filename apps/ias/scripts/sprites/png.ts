/**
 * Writer of 8-bit indexed PNG files, with palette index 0 transparent.
 *
 * @module
 */
import { deflateSync } from "node:zlib";

export interface IndexedImage {
  readonly width: number;
  readonly height: number;
  /** One palette index per pixel, row after row. */
  readonly pixels: Uint8Array;
}

const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function chunk(type: string, body: Uint8Array): Uint8Array {
  const typed = new Uint8Array([...new TextEncoder().encode(type), ...body]);
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);

  view.setUint32(0, body.length);
  out.set(typed, 4);
  view.setUint32(8 + body.length, Bun.hash.crc32(typed));

  return out;
}

function header(width: number, height: number): Uint8Array {
  const body = new Uint8Array(13);
  const view = new DataView(body.buffer);

  view.setUint32(0, width);
  view.setUint32(4, height);
  body.set([8, 3, 0, 0, 0], 8);

  return body;
}

/** Each row starts with filter type 0, none. */
function scanlines({ width, height, pixels }: IndexedImage): Uint8Array {
  const rows = new Uint8Array((width + 1) * height);

  for (let y = 0; y < height; y++) {
    rows.set(pixels.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  }

  return rows;
}

/** `palette` holds 256 RGB triplets. */
export function indexedPng(image: IndexedImage, palette: Uint8Array): Uint8Array {
  const parts = [
    new Uint8Array(signature),
    chunk("IHDR", header(image.width, image.height)),
    chunk("PLTE", palette),
    chunk("tRNS", new Uint8Array([0])),
    chunk("IDAT", deflateSync(scanlines(image))),
    chunk("IEND", new Uint8Array()),
  ];

  const out = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

/**
 * Decodes the legacy sprites of each animation the calculator plays into one sheet per layer
 * component, in one direction, plus the `manifest.json` a renderer composes them with.
 *
 * @module
 */
import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import type {
  Clip,
  LayerCode,
  SpriteBox,
  SpriteLayer,
  SpriteManifest,
} from "@/contracts/animation";

import { type DccDirection, decodeDirection, readDcc } from "../../../../tools/d2-dcc/dcc";
import { dccDirection } from "../../../../tools/d2-dcc/directions";
import { type GameCache, run } from "../game-files";
import { cofDirection, readCof } from "./cof";
import type { OfferedAnimation } from "./offered-animations";
import { indexedPng } from "./png";

interface Component {
  readonly code: LayerCode;
  readonly name: string;
  readonly direction: DccDirection;
}

/** Of the game's 64, the one direction every sheet is drawn in. */
const shownDirection = 4;

/** Transparent pixels around the union of the frames. */
const margin = 2;

/** `pal.dat` holds 256 BGR triplets; a PNG palette holds RGB. */
async function readPalette(cache: GameCache): Promise<Uint8Array> {
  const bgr = await Bun.file(
    join(cache.dir, "files/data/data/global/palette/act1/pal.dat"),
  ).bytes();

  const rgb = new Uint8Array(256 * 3);

  for (let index = 1; index < 256; index++) {
    rgb.set([bgr[index * 3 + 2] ?? 0, bgr[index * 3 + 1] ?? 0, bgr[index * 3] ?? 0], index * 3);
  }

  return rgb;
}

async function readComponents(
  folder: string,
  animation: OfferedAnimation,
  code: LayerCode,
  weaponClass: string,
): Promise<readonly Component[]> {
  const prefix = `${animation.token}${code}`;
  const suffix = `${animation.mode}${weaponClass}.dcc`;
  const drawn = animation.components.get(code) ?? new Set<string>();
  const names = (await readdir(join(folder, code)))
    .filter(
      (name) =>
        name.startsWith(prefix) &&
        name.endsWith(suffix) &&
        drawn.has(name.slice(prefix.length, -suffix.length)),
    )
    .toSorted();

  return Promise.all(
    names.map(async (name) => {
      const file = readDcc(await Bun.file(join(folder, code, name)).bytes());

      return {
        code,
        name: name.slice(prefix.length, -suffix.length),
        direction: decodeDirection(file, dccDirection(shownDirection, file.directionCount)),
      };
    }),
  );
}

function sharedBox(components: readonly Component[]): SpriteBox {
  const boxes = components.map(({ direction }) => direction.box);
  const left = Math.min(...boxes.map((box) => box.left)) - margin;
  const top = Math.min(...boxes.map((box) => box.top)) - margin;
  const right = Math.max(...boxes.map((box) => box.left + box.width)) + margin;
  const bottom = Math.max(...boxes.map((box) => box.top + box.height)) + margin;

  return { left, top, width: right - left, height: bottom - top };
}

/** The sprite frames side by side, each drawn at its place in the shared box. */
function sheetPixels({ direction }: Component, box: SpriteBox, frames: number): Uint8Array {
  const own = direction.box;
  const stride = box.width * frames;
  const pixels = new Uint8Array(stride * box.height);

  for (const [frame, source] of direction.frames.slice(0, frames).entries()) {
    for (let y = 0; y < own.height; y++) {
      for (let x = 0; x < own.width; x++) {
        const index = source[x + y * own.width] ?? 0;

        if (index !== 0) {
          pixels[frame * box.width + own.left + x - box.left + (own.top + y - box.top) * stride] =
            index;
        }
      }
    }
  }

  return pixels;
}

/** The sprite cache of each folder: `chars` for the players, `monsters` for the others. */
export type SpriteCaches = Readonly<Record<Clip["folder"], GameCache>>;

async function extractAnimation(
  caches: SpriteCaches,
  palette: Uint8Array,
  key: OfferedAnimation,
  outDir: string,
): Promise<readonly string[]> {
  const folder = join(caches[key.folder].dir, "files/data/data/global", key.folder, key.token);
  const cof = readCof(
    await Bun.file(join(folder, "cof", `${key.token}${key.mode}${key.weaponClass}.cof`)).bytes(),
  );

  const layers = await Promise.all(
    cof.layers.map(({ code, weaponClass }) => readComponents(folder, key, code, weaponClass)),
  );

  const components = layers.flat();
  const box = sharedBox(components);
  const frames = cof.framesPerDirection;
  const dir = join(outDir, key.token, `${key.mode}${key.weaponClass}`);

  await mkdir(dir, { recursive: true });

  const pngs = await Promise.all(
    components.map(async (component) => {
      const png = join(dir, `${component.code}-${component.name}.png`);
      const pixels = sheetPixels(component, box, frames);

      await Bun.write(
        png,
        indexedPng({ width: box.width * frames, height: box.height, pixels }, palette),
      );

      return png;
    }),
  );

  const manifest: SpriteManifest = {
    direction: shownDirection,
    box,
    frames,
    layers: cof.layers.map(({ code, weaponClass }, index): SpriteLayer => ({
      code,
      weaponClass,
      components: (layers[index] ?? []).map(({ name }) => name),
    })),
    order: cof.order[cofDirection(shownDirection, cof.directionCount)] ?? [],
  };

  await Bun.write(join(dir, "manifest.json"), `${JSON.stringify(manifest)}\n`);

  return pngs;
}

/**
 * Replaces each PNG sheet with a lossless WebP, a third lighter and pixel for pixel the same, in one
 * `mogrify` batch per core.
 */
async function convertToWebp(pngs: readonly string[]): Promise<void> {
  const batchCount = navigator.hardwareConcurrency;
  const batches = Array.from({ length: batchCount }, (_, batch) =>
    pngs.filter((_png, index) => index % batchCount === batch),
  ).filter((batch) => batch.length > 0);

  await Promise.all(
    batches.map((batch) =>
      run([
        "magick",
        "mogrify",
        "-format",
        "webp",
        "-define",
        "webp:lossless=true",
        "-define",
        "webp:method=6",
        ...batch,
      ]),
    ),
  );

  await Promise.all(pngs.map((png) => rm(png)));
}

/**
 * Writes `<outDir>/<token>/<mode><weapon class>/` for each animation, the sheets of the components
 * the attack view draws only; returns the number of sheets.
 */
export async function extractSprites(
  caches: SpriteCaches,
  outDir: string,
  animations: readonly OfferedAnimation[],
): Promise<number> {
  await rm(outDir, { recursive: true, force: true });

  const palette = await readPalette(caches.chars);
  const sheets = await Promise.all(
    animations.map((key) => extractAnimation(caches, palette, key, outDir)),
  );

  await convertToWebp(sheets.flat());

  return sheets.flat().length;
}

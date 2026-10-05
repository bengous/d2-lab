import { cn } from "cn";
import { useEffect, useRef, useState } from "react";

import type {
  Clip,
  LayerCode,
  Mode,
  SpriteBox,
  SpriteLayer,
  SpriteManifest,
  Timeline,
} from "@/contracts/animation";

/** One animation of a clip, with the sheet of each layer the outfit draws. */
interface Animation {
  readonly manifest: SpriteManifest;
  readonly sheets: ReadonlyMap<LayerCode, ImageBitmap>;
  /** Where these sheets draw a pixel, in any sprite frame. */
  readonly drawn: SpriteBox;
}

export interface ReadySprites {
  readonly kind: "ready";
  /** What every mode draws, in pixels from the sprite origin: a canvas shows this box. */
  readonly box: SpriteBox;
  readonly animations: ReadonlyMap<Mode, Animation>;
}

/** `missing` when `public/game/sprites/` lacks a file the clip draws. */
export type Sprites = { readonly kind: "loading" } | { readonly kind: "missing" } | ReadySprites;

const loading: Sprites = { kind: "loading" };

const missing: Sprites = { kind: "missing" };

/** Transparent sprite pixels around what the layers draw. */
const cropMargin = 4;

/** Each animation once per page: a build change replays the same files. */
const animations = new Map<string, Promise<Animation | null>>();

function animationDir(clip: Clip, mode: Mode): string {
  return `game/sprites/${clip.token}/${mode}${clip.weaponClass}`;
}

function drawnComponent({ code }: SpriteLayer, clip: Clip): string | null {
  if (code === "rh") {
    return clip.weapons.right;
  }

  if (code === "lh") {
    return clip.weapons.left;
  }

  return clip.outfit[code] ?? null;
}

/** The extraction writes it from `SpriteManifest`: the check guards a stale or foreign file. */
export function isSpriteManifest(body: unknown): body is SpriteManifest {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const fields = new Map(Object.entries(body));

  return (
    typeof fields.get("frames") === "number" &&
    typeof fields.get("box") === "object" &&
    Array.isArray(fields.get("layers")) &&
    Array.isArray(fields.get("order"))
  );
}

async function fetchFound(url: string): Promise<Response | null> {
  const response = await fetch(url);

  return response.ok ? response : null;
}

type Sheet = readonly [LayerCode, ImageBitmap];

async function loadSheet(dir: string, code: LayerCode, name: string): Promise<Sheet | null> {
  const response = await fetchFound(`${dir}/${code}-${name}.webp`);

  return response === null ? null : [code, await createImageBitmap(await response.blob())];
}

/** The layers of a held item: weapons and shield. A body layer without its component draws nothing. */
const heldLayers: ReadonlySet<LayerCode> = new Set(["rh", "lh", "sh"]);

/** The component each layer draws; `null` when a held item has no sheet in this animation. */
function drawnComponents(
  manifest: SpriteManifest,
  clip: Clip,
): readonly (readonly [LayerCode, string])[] | null {
  const drawn: (readonly [LayerCode, string])[] = [];

  for (const layer of manifest.layers) {
    const name = drawnComponent(layer, clip);

    if (name !== null && layer.components.includes(name)) {
      drawn.push([layer.code, name]);
    } else if (name !== null && heldLayers.has(layer.code)) {
      return null;
    }
  }

  return drawn;
}

/** `null` when a file is missing, the sheet of a weapon or shield included. */
async function loadAnimation(clip: Clip, mode: Mode): Promise<Animation | null> {
  const dir = animationDir(clip, mode);
  const response = await fetchFound(`${dir}/manifest.json`);
  const manifest: unknown = response === null ? null : await response.json();

  if (manifest === null) {
    return null;
  }

  if (!isSpriteManifest(manifest)) {
    throw new Error(`${dir}/manifest.json is not a sprite manifest`);
  }

  const drawn = drawnComponents(manifest, clip);
  const sheets =
    drawn === null
      ? [null]
      : await Promise.all(drawn.map(([code, name]) => loadSheet(dir, code, name)));

  const found = sheets.flatMap((sheet) => (sheet === null ? [] : [sheet]));

  if (found.length < sheets.length) {
    return null;
  }

  const bounds = found.flatMap(([, sheet]) => opaqueBox(sheet, manifest.box) ?? []);

  return {
    manifest,
    sheets: new Map(found),
    drawn: bounds.length === 0 ? manifest.box : unionBox(bounds),
  };
}

/** The opaque pixels of a sheet, over every sprite frame; `null` when it draws none. */
function opaqueBox(sheet: ImageBitmap, box: SpriteBox): SpriteBox | null {
  const canvas = new OffscreenCanvas(sheet.width, sheet.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (context === null) {
    throw new Error("no 2D context to measure a sheet");
  }

  context.drawImage(sheet, 0, 0);

  const { data: rgba } = context.getImageData(0, 0, sheet.width, sheet.height);
  let left = box.width;
  let top = box.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < sheet.height; y++) {
    for (let x = 0; x < sheet.width; x++) {
      if (rgba[(y * sheet.width + x) * 4 + 3] !== 0) {
        const column = x % box.width;

        left = Math.min(left, column);
        right = Math.max(right, column);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  return right < 0
    ? null
    : {
        left: box.left + left,
        top: box.top + top,
        width: right - left + 1,
        height: bottom - top + 1,
      };
}

/** What the clip draws in each layer. */
function clipLook({ weapons, outfit }: Clip): string {
  return JSON.stringify([weapons.right, weapons.left, outfit]);
}

function cachedAnimation(clip: Clip, mode: Mode): Promise<Animation | null> {
  const key = `${animationDir(clip, mode)}|${clipLook(clip)}`;
  const cached = animations.get(key) ?? loadAnimation(clip, mode);

  animations.set(key, cached);

  return cached;
}

function unionBox(boxes: readonly SpriteBox[]): SpriteBox {
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const right = Math.max(...boxes.map((box) => box.left + box.width));
  const bottom = Math.max(...boxes.map((box) => box.top + box.height));

  return { left, top, width: right - left, height: bottom - top };
}

function withMargin({ left, top, width, height }: SpriteBox): SpriteBox {
  return {
    left: left - cropMargin,
    top: top - cropMargin,
    width: width + 2 * cropMargin,
    height: height + 2 * cropMargin,
  };
}

async function loadSprites(clip: Clip, modes: readonly Mode[]): Promise<Sprites> {
  const loaded = await Promise.all(
    modes.map(async (mode) => [mode, await cachedAnimation(clip, mode)] as const),
  );

  const found = loaded.flatMap(([mode, animation]) =>
    animation === null ? [] : [[mode, animation] as const],
  );

  if (found.length < modes.length) {
    return missing;
  }

  return {
    kind: "ready",
    box: withMargin(unionBox(found.map(([, { drawn }]) => drawn))),
    animations: new Map(found),
  };
}

function modesOf({ ticks }: Timeline): readonly Mode[] {
  return [...new Set(ticks.map(({ mode }) => mode))];
}

function timelineKey(timeline: Timeline): string {
  const { token, weaponClass } = timeline.clip;

  return [token, weaponClass, clipLook(timeline.clip), ...modesOf(timeline)].join("|");
}

/** The sheets a timeline plays; a timeline equal to the last one keeps them while it reloads. */
export function useSprites(timeline: Timeline): Sprites {
  const key = timelineKey(timeline);
  const [loaded, setLoaded] = useState<{ readonly key: string; readonly sprites: Sprites } | null>(
    null,
  );

  useEffect(() => {
    let live = true;

    loadSprites(timeline.clip, modesOf(timeline)).then(
      (sprites) => {
        if (live) {
          setLoaded({ key: timelineKey(timeline), sprites });
        }
      },
      (error: Readonly<Error>) => {
        reportError(error);

        if (live) {
          setLoaded({ key: timelineKey(timeline), sprites: missing });
        }
      },
    );

    return () => {
      live = false;
    };
  }, [timeline]);

  return loaded?.key === key ? loaded.sprites : loading;
}

interface Drawn {
  readonly sprites: ReadySprites;
  readonly mode: Mode;
  readonly frame: number;
  readonly scale: number;
}

function drawFrame(
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- drawing writes to the canvas context
  context: CanvasRenderingContext2D,
  { sprites, mode, frame, scale }: Drawn,
): void {
  const animation = sprites.animations.get(mode);
  const layers = animation?.manifest.order[frame];

  if (animation === undefined || layers === undefined) {
    throw new Error(`no sprite frame ${frame} for the mode ${mode}`);
  }

  const { box } = animation.manifest;
  const x = (box.left - sprites.box.left) * scale;
  const y = (box.top - sprites.box.top) * scale;

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (const code of layers) {
    const sheet = animation.sheets.get(code);

    if (sheet !== undefined) {
      const width = box.width * scale;
      const height = box.height * scale;

      context.drawImage(sheet, frame * box.width, 0, box.width, box.height, x, y, width, height);
    }
  }
}

interface SpriteCanvasProps {
  readonly sprites: ReadySprites;
  readonly mode: Mode;
  /** Sprite frame position of a tick; the canvas floors it. */
  readonly position: number;
  /** Canvas pixels per sprite pixel. */
  readonly scale: number;
  /** Read by screen readers; without it the canvas is hidden from them. */
  readonly label?: string;
  readonly className?: string;
}

/** Stacks the layers of one sprite frame in the manifest's order, pixelated. */
export function SpriteCanvas({
  sprites,
  mode,
  position,
  scale,
  label,
  className,
}: SpriteCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = Math.floor(position);

  useEffect(() => {
    const context = ref.current?.getContext("2d") ?? null;

    if (context === null) {
      throw new Error("the sprite canvas has no 2D context");
    }

    drawFrame(context, { sprites, mode, frame, scale });
  }, [sprites, mode, frame, scale]);

  return (
    <canvas
      ref={ref}
      width={sprites.box.width * scale}
      height={sprites.box.height * scale}
      className={cn("[image-rendering:pixelated]", className)}
      {...(label === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
    />
  );
}

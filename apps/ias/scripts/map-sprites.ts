import { join } from "node:path";

import type { Clip, LayerCode, Mode, SpriteLayer, SpriteManifest } from "@/contracts/animation";
import { isSpriteManifest } from "@/ui/components/sprite-player";

const spritesDir = join(import.meta.dir, "../public/game/sprites");

/** One animation of the walkthrough clip, its sheets inlined as data URLs for the map page. */
export interface InlinedAnimation {
  readonly manifest: SpriteManifest;
  readonly sheets: Readonly<Partial<Record<LayerCode, string>>>;
}

/** The same choice as `drawnComponent` in `ui/components/sprite-player.tsx`. */
function drawnComponent({ code }: SpriteLayer, clip: Clip): string | null {
  if (code === "rh") {
    return clip.weapons.right;
  }

  if (code === "lh") {
    return clip.weapons.left;
  }

  return clip.outfit[code] ?? null;
}

async function dataUrl(path: string): Promise<string> {
  const bytes = await Bun.file(path).bytes();

  return `data:image/webp;base64,${bytes.toBase64()}`;
}

async function inlinedAnimation(clip: Clip, mode: Mode): Promise<InlinedAnimation> {
  const dir = join(spritesDir, clip.token, `${mode}${clip.weaponClass}`);
  const manifest: unknown = await Bun.file(join(dir, "manifest.json")).json();

  if (!isSpriteManifest(manifest)) {
    throw new Error(`${dir}/manifest.json is not a sprite manifest`);
  }

  const drawn = manifest.layers.flatMap((layer) => {
    const name = drawnComponent(layer, clip);

    return name !== null && layer.components.includes(name) ? [[layer.code, name] as const] : [];
  });

  const sheets = await Promise.all(
    drawn.map(
      async ([code, name]) => [code, await dataUrl(join(dir, `${code}-${name}.webp`))] as const,
    ),
  );

  return { manifest, sheets: Object.fromEntries(sheets) };
}

/** The sheets `public/game/sprites/` holds for each mode a timeline plays. */
export async function inlinedSprites(
  clip: Clip,
  modes: readonly Mode[],
): Promise<Readonly<Partial<Record<Mode, InlinedAnimation>>>> {
  const animations = await Promise.all(
    modes.map(async (mode) => [mode, await inlinedAnimation(clip, mode)] as const),
  );

  return Object.fromEntries(animations);
}

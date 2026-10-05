import { expect, test } from "bun:test";
import { join } from "node:path";

import { isSpriteManifest } from "@/ui/components/sprite-player";

import { type OfferedAnimation, offeredAnimations } from "../scripts/sprites/offered-animations";

const spritesDir = join(import.meta.dir, "..", "public/game/sprites");

const offered = offeredAnimations();

/** A body layer without its component draws nothing; a held item without its sheet is a missing file. */
const heldLayers = ["rh", "lh", "sh"] as const;

async function problemsOf(animation: OfferedAnimation): Promise<readonly string[]> {
  const name = `${animation.token}/${animation.mode}${animation.weaponClass}`;
  const file = Bun.file(join(spritesDir, name, "manifest.json"));

  if (!(await file.exists())) {
    return [`${name}: no manifest`];
  }

  const manifest: unknown = await file.json();

  if (!isSpriteManifest(manifest)) {
    return [`${name}: not a sprite manifest`];
  }

  const sheets = manifest.layers.flatMap(({ code, components }) =>
    components.map((component) => `${code}-${component}.webp`),
  );

  const absent = await Promise.all(
    sheets.map(async (sheet) =>
      (await Bun.file(join(spritesDir, name, sheet)).exists()) ? [] : [`${name}: no file ${sheet}`],
    ),
  );

  return [
    ...absent.flat(),
    ...heldLayers.flatMap((held) => {
      const layer = manifest.layers.find(({ code }) => code === held);

      return [...(animation.components.get(held) ?? [])].flatMap((graphic) =>
        layer?.components.includes(graphic) === true
          ? []
          : [`${name}: no ${held} sheet for ${graphic}`],
      );
    }),
  ];
}

test("the form offers the attack view an animation of each player class, wereform and mercenary", () => {
  expect(new Set(offered.map(({ token }) => token))).toEqual(
    new Set(["am", "ai", "ba", "dz", "ne", "pa", "so", "wk", "40", "tg", "rg", "gu", "0a"]),
  );
});

test("it offers every dual-wield class: a Barbarian's four pairs and an Assassin's two claws", () => {
  const dualWield = new Set(["1ss", "1js", "1jt", "1st", "ht2"]);

  expect(
    new Set(
      offered.flatMap(({ token, weaponClass }) =>
        dualWield.has(weaponClass) ? [`${token}${weaponClass}`] : [],
      ),
    ),
  ).toEqual(new Set(["ba1ss", "ba1js", "ba1jt", "ba1st", "aiht2"]));
});

test("it offers Smite every shield graphic and Holy Shield's own", () => {
  const shields = ["bsh", "buc", "hsh", "kit", "lrg", "pa1", "pa3", "pa5", "spk", "tow"];
  const smite = offered.flatMap(({ token, mode, weaponClass, components }) =>
    token === "pa" && mode === "s1"
      ? [[weaponClass, [...(components.get("sh") ?? [])].toSorted()] as const]
      : [],
  );

  expect(Object.fromEntries(smite)).toEqual({ "1hs": shields, "1ht": shields, hth: shields });
});

test("every animation the form offers has a manifest that draws its weapons and shields", async () => {
  const problems = await Promise.all(offered.map((animation) => problemsOf(animation)));

  expect(problems.flat()).toEqual([]);
});

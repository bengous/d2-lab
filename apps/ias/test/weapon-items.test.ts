import { expect, test } from "bun:test";

import type { WeaponData, WeaponItem, WeaponTier } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { type WeaponCategory, weaponCategories } from "@/data/rules/weapon-categories";
import { keysOf } from "@/lib/keys";

interface ItemWeapon {
  readonly weapon: WeaponData;
  readonly item: WeaponItem;
}

const bases: readonly ItemWeapon[] = gameData.weapons.flatMap((weapon) =>
  weapon.item === null ? [] : [{ weapon, item: weapon.item }],
);

function typeOf(weapon: WeaponData): string {
  const [type] = weapon.itemTypes;

  if (type === undefined) {
    throw new Error(`${weapon.id} has no item type`);
  }

  return type;
}

test("gives every weapon base an item, and unarmed none", () => {
  expect(bases).toHaveLength(291);
  expect(gameData.weapons.flatMap(({ id, item }) => (item === null ? [String(id)] : []))).toEqual([
    "unarmed",
  ]);
});

test("holds one weapon of each tier per family, all three with the same icon", () => {
  const families = new Map<string, readonly WeaponItem[]>();

  for (const { item } of bases) {
    families.set(item.family, [...(families.get(item.family) ?? []), item]);
  }

  const tiers: readonly WeaponTier[] = ["elite", "exceptional", "normal"];
  const broken: string[] = [];

  for (const [family, items] of families) {
    const tiersHeld = items.map(({ tier }) => tier).toSorted();

    if (tiersHeld.join() !== tiers.join() || new Set(items.map(({ icon }) => icon)).size !== 1) {
      broken.push(family);
    }
  }

  expect(families.size).toBe(97);
  expect(broken).toEqual([]);
});

test("puts every weapon type in exactly one category", () => {
  const types = new Set(bases.map(({ weapon }) => typeOf(weapon)));
  const declared = keysOf(weaponCategories).flatMap((category) => weaponCategories[category].types);

  expect(declared.toSorted()).toEqual([...types].toSorted());
});

test("declares the categories in the order weapons.txt first lists them", () => {
  const firstRow = new Map<WeaponCategory, number>();

  for (const category of keysOf(weaponCategories)) {
    const rows = bases.flatMap(({ weapon, item }) =>
      weaponCategories[category].types.includes(typeOf(weapon)) ? [item.row] : [],
    );

    firstRow.set(category, Math.min(...rows));
  }

  const inFileOrder = keysOf(weaponCategories).toSorted(
    (left, right) => (firstRow.get(left) ?? 0) - (firstRow.get(right) ?? 0),
  );

  expect(keysOf(weaponCategories)).toEqual(inFileOrder);
});

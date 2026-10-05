import { expect, test } from "bun:test";

import type { WeaponTier } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import type { WeaponCategory } from "@/data/rules/weapon-categories";
import { resolveForm } from "@/engine/available-inputs";
import { weaponById } from "@/engine/context";
import {
  effectiveFilters,
  familiesOf,
  filterGroups,
  groupWeapons,
  noFilters,
  offeredCategories,
  toggled,
  type WeaponGroup,
} from "@/ui/screens/weapon-groups";

import { buildOf } from "./builds";

const all = groupWeapons(gameData.weapons);

function names(groups: readonly WeaponGroup[]): readonly string[] {
  return groups.flatMap(({ items }) => items.map(({ name }) => name));
}

test("lists unarmed first, then the 18 categories in file order", () => {
  expect(all.map(({ value }) => value)).toEqual([
    "none",
    "axes",
    "wands",
    "clubs",
    "scepters",
    "maces",
    "hammers",
    "swords",
    "daggers",
    "throwingKnives",
    "throwingAxes",
    "javelins",
    "spears",
    "polearms",
    "staves",
    "bows",
    "crossbows",
    "claws",
    "orbs",
  ]);

  expect(names(all)).toHaveLength(292);
});

test("orders a category by family, then by tier", () => {
  const axes = all.find(({ value }) => value === "axes")?.items ?? [];

  expect(axes.slice(0, 6).map(({ name }) => name)).toEqual([
    "Hand Axe",
    "Hatchet",
    "Tomahawk",
    "Axe",
    "Cleaver",
    "Small Crescent",
  ]);

  expect(familiesOf(axes).map(({ weapons }) => weapons.length)).toEqual(
    Array.from({ length: 10 }, () => 3),
  );
});

test("keeps the Amazon bows in Bows, with their class", () => {
  const bows = all.find(({ value }) => value === "bows")?.items ?? [];
  const amazon = familiesOf(bows).filter(({ restrictedTo }) => restrictedTo === "amazon");

  expect(amazon.map(({ weapons }) => weapons[0]?.name)).toEqual(["Stag Bow", "Reflex Bow"]);
});

test("filters by category and tier facets, and hides unarmed while a facet is set", () => {
  const filters = {
    categories: new Set<WeaponCategory>(["swords"]),
    tiers: new Set<WeaponTier>(["elite"]),
  };

  const swords = filterGroups(all, filters);

  expect(swords.map(({ value }) => value)).toEqual(["swords"]);
  expect(names(swords)).toHaveLength(14);
  expect(names(swords)).toContain("Phase Blade");
});

test("keeps unarmed only while no facet is set", () => {
  const tiers = { categories: new Set<WeaponCategory>(), tiers: new Set<WeaponTier>(["elite"]) };

  expect(filterGroups(all, noFilters)[0]?.value).toBe("none");
  expect(filterGroups(all, tiers)[0]?.value).toBe("axes");
});

test("drops from the filter a category the build no longer offers", () => {
  const offer = resolveForm(buildOf({ character: "paladin", wereform: "werebear" })).spec;
  const groups = groupWeapons(offer.primaryWeapons.map((id) => weaponById(id)));
  const offered = offeredCategories(groups);
  const filters = {
    categories: new Set<WeaponCategory>(["swords", "axes"]),
    tiers: new Set<WeaponTier>(),
  };

  expect(offered).toEqual(["axes", "scepters", "hammers"]);
  expect([...effectiveFilters(filters, offered).categories]).toEqual(["axes"]);
});

test("toggles a facet value, and empties a facet that would hold every value", () => {
  const one = toggled(new Set<string>(), "a", 3);
  const two = toggled(one, "b", 3);

  expect([...two]).toEqual(["a", "b"]);
  expect([...toggled(two, "a", 3)]).toEqual(["b"]);
  expect(toggled(two, "c", 3).size).toBe(0);
});

import type { CharacterId } from "@/contracts/build";
import type { WeaponData, WeaponTier } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { type WeaponCategory, weaponCategories } from "@/data/rules/weapon-categories";
import { keysOf } from "@/lib/keys";

/**
 * A group of the weapon list: `unarmed` alone, or one category. A type alias, not an interface:
 * Base UI's `Group` has an index signature, which only an alias satisfies.
 */
// oxlint-disable-next-line typescript/consistent-type-definitions -- Base UI's Group type needs an alias, see above
export type WeaponGroup = {
  readonly value: WeaponCategory | "none";
  readonly items: readonly WeaponData[];
};

/** The weapons of one family that a group shows, in tier order. */
export interface WeaponFamily {
  readonly family: string;
  readonly icon: string;
  readonly restrictedTo: CharacterId | null;
  readonly weapons: readonly WeaponData[];
}

/** Facets: an empty set keeps everything. */
export interface WeaponFilters {
  readonly categories: ReadonlySet<WeaponCategory>;
  readonly tiers: ReadonlySet<WeaponTier>;
}

export const noFilters: WeaponFilters = { categories: new Set(), tiers: new Set() };

export const weaponTiers: readonly WeaponTier[] = ["normal", "exceptional", "elite"];

const categoryOrder: readonly WeaponCategory[] = keysOf(weaponCategories);

const categoryByType: ReadonlyMap<string, WeaponCategory> = new Map(
  categoryOrder.flatMap((category) =>
    weaponCategories[category].types.map((type) => [type, category] as const),
  ),
);

/** A family sorts by the weapons.txt row of its normal base, which a build may not offer. */
const familyRows: ReadonlyMap<string, number> = new Map(
  gameData.weapons.flatMap(({ item }) =>
    item?.tier === "normal" ? [[item.family, item.row] as const] : [],
  ),
);

function categoryOf(weapon: WeaponData): WeaponCategory {
  const category = categoryByType.get(weapon.itemTypes[0] ?? "");

  if (category === undefined) {
    throw new Error(`no weapon category holds ${weapon.id}`);
  }

  return category;
}

function familyRow(weapon: WeaponData): number {
  if (weapon.item === null) {
    return 0;
  }

  const row = familyRows.get(weapon.item.family);

  if (row === undefined) {
    throw new Error(`the weapon family ${weapon.item.family} has no normal base`);
  }

  return row;
}

function tierIndex(weapon: WeaponData): number {
  return weapon.item === null ? 0 : weaponTiers.indexOf(weapon.item.tier);
}

/** `unarmed` first, then the categories in file order, each by family then tier. */
export function groupWeapons(weapons: readonly WeaponData[]): readonly WeaponGroup[] {
  const sorted = weapons.toSorted(
    (left, right) => familyRow(left) - familyRow(right) || tierIndex(left) - tierIndex(right),
  );

  const none = sorted.filter((weapon) => weapon.item === null);
  const categories = categoryOrder.flatMap((category): readonly WeaponGroup[] => {
    const items = sorted.filter(
      (weapon) => weapon.item !== null && categoryOf(weapon) === category,
    );

    return items.length === 0 ? [] : [{ value: category, items }];
  });

  return none.length === 0 ? categories : [{ value: "none", items: none }, ...categories];
}

export function offeredCategories(groups: readonly WeaponGroup[]): readonly WeaponCategory[] {
  return groups.flatMap(({ value }) => (value === "none" ? [] : [value]));
}

/** Drops the categories the list no longer offers: an empty facet then keeps everything. */
export function effectiveFilters(
  filters: WeaponFilters,
  offered: readonly WeaponCategory[],
): WeaponFilters {
  return {
    categories: new Set(offered.filter((category) => filters.categories.has(category))),
    tiers: filters.tiers,
  };
}

function passes<T>(facet: ReadonlySet<T>, value: T): boolean {
  return facet.size === 0 || facet.has(value);
}

function tierKept(weapon: WeaponData, filters: WeaponFilters): boolean {
  return weapon.item === null ? filters.tiers.size === 0 : passes(filters.tiers, weapon.item.tier);
}

/**
 * The groups the facets keep; the combobox searches them by name. `unarmed` shows only while no
 * facet is set.
 */
export function filterGroups(
  groups: readonly WeaponGroup[],
  filters: WeaponFilters,
): readonly WeaponGroup[] {
  return groups.flatMap((group): readonly WeaponGroup[] => {
    const categoryKept =
      group.value === "none"
        ? filters.categories.size === 0
        : passes(filters.categories, group.value);

    const items = categoryKept ? group.items.filter((weapon) => tierKept(weapon, filters)) : [];

    return items.length === 0 ? [] : [{ value: group.value, items }];
  });
}

/** Splits a category's weapons into runs of one family. */
export function familiesOf(weapons: readonly WeaponData[]): readonly WeaponFamily[] {
  const families: WeaponFamily[] = [];

  for (const weapon of weapons) {
    const last = families.at(-1);

    if (weapon.item === null) {
      continue;
    }

    if (last?.family === weapon.item.family) {
      families[families.length - 1] = { ...last, weapons: [...last.weapons, weapon] };
    } else {
      families.push({
        family: weapon.item.family,
        icon: weapon.item.icon,
        restrictedTo: weapon.restrictedTo,
        weapons: [weapon],
      });
    }
  }

  return families;
}

/** Adds or removes one value; a facet that holds every value keeps everything, so it empties. */
export function toggled<T>(facet: ReadonlySet<T>, value: T, universe: number): ReadonlySet<T> {
  const next = new Set(facet);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next.size === universe ? new Set() : next;
}

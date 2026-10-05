import { cn } from "cn";
import type { ReactNode } from "react";

import type { WeaponCategory } from "@/data/rules/weapon-categories";
import { weaponCategoryNames, weaponTierLabels } from "@/ui/screens/labels";
import { toggled, type WeaponFilters, weaponTiers } from "@/ui/screens/weapon-groups";

interface FacetChipProps {
  readonly pressed: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
}

/**
 * A pointer-only shortcut: a press keeps the focus in the search input, whose blur would clear the
 * search, and Tab closes the popup. The keyboard searches by name instead.
 */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `children: ReactNode` includes ReactElement, whose fields are mutable in @types/react
function FacetChip({ pressed, onPress, children }: FacetChipProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-pressed={pressed}
      // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- React passes DOM events, whose members are mutable
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onPress}
      className={cn(
        "border-border bg-input text-foreground/85 hover:bg-border focus-visible:ring-ring/50 cursor-pointer rounded-full border px-2.5 py-0.5 text-sm transition-colors outline-none focus-visible:ring-3",
        pressed && "border-primary bg-primary/15 text-figure",
      )}
    >
      {children}
    </button>
  );
}

interface WeaponFacetsProps {
  /** The categories the list holds, in list order. */
  readonly offered: readonly WeaponCategory[];
  readonly filters: WeaponFilters;
  readonly onFiltersChange: (filters: WeaponFilters) => void;
}

function CategoryChips({ offered, filters, onFiltersChange }: WeaponFacetsProps) {
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="sr-only">Categories</legend>
      <FacetChip
        pressed={filters.categories.size === 0}
        onPress={() => {
          onFiltersChange({ ...filters, categories: new Set() });
        }}
      >
        All
      </FacetChip>
      {offered.map((category) => (
        <FacetChip
          key={category}
          pressed={filters.categories.has(category)}
          onPress={() => {
            onFiltersChange({
              ...filters,
              categories: toggled(filters.categories, category, offered.length),
            });
          }}
        >
          {weaponCategoryNames[category]}
        </FacetChip>
      ))}
    </fieldset>
  );
}

function TierChips({ filters, onFiltersChange }: Omit<WeaponFacetsProps, "offered">) {
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="sr-only">Tiers</legend>
      {weaponTiers.map((tier) => (
        <FacetChip
          key={tier}
          pressed={filters.tiers.has(tier)}
          onPress={() => {
            onFiltersChange({
              ...filters,
              tiers: toggled(filters.tiers, tier, weaponTiers.length),
            });
          }}
        >
          <span className="font-display me-1 text-xs font-semibold">
            {weaponTierLabels[tier].numeral}
          </span>
          {weaponTierLabels[tier].name}
        </FacetChip>
      ))}
    </fieldset>
  );
}

/** Category chips, then tier chips. A pressed chip keeps its value; none pressed keeps all. */
export function WeaponFacets(props: WeaponFacetsProps) {
  return (
    <div className="grid gap-2 border-b p-2">
      {props.offered.length > 1 && <CategoryChips {...props} />}
      <TierChips filters={props.filters} onFiltersChange={props.onFiltersChange} />
    </div>
  );
}

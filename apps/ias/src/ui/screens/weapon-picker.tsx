import { cn } from "cn";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { WeaponData, WeaponTier } from "@/contracts/game-data";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/ui/components/ui/combobox";
import { InputGroupAddon } from "@/ui/components/ui/input-group";
import {
  characterNames,
  portraitSrc,
  weaponCategoryNames,
  weaponIconSrc,
  weaponTierLabels,
} from "@/ui/screens/labels";
import { WeaponFacets } from "@/ui/screens/weapon-facets";
import {
  effectiveFilters,
  familiesOf,
  filterGroups,
  groupWeapons,
  noFilters,
  offeredCategories,
  type WeaponFamily,
  type WeaponFilters,
  type WeaponGroup,
} from "@/ui/screens/weapon-groups";

function weaponName(weapon: WeaponData): string {
  return weapon.name;
}

function TierTag({ tier }: { readonly tier: WeaponTier }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display border-border min-w-8 rounded border px-1 text-center text-xs leading-5 font-semibold",
        tier === "normal" && "text-muted-foreground",
        tier === "elite" && "text-figure border-figure/25",
      )}
    >
      {weaponTierLabels[tier].numeral}
    </span>
  );
}

function WeaponOption({ weapon }: { readonly weapon: WeaponData }) {
  const tier = weapon.item?.tier;
  const signedWsm = weapon.wsm > 0 ? `+${weapon.wsm}` : String(weapon.wsm);

  return (
    <ComboboxItem
      value={weapon}
      aria-label={
        tier === undefined ? weapon.name : `${weapon.name}, ${weaponTierLabels[tier].name}`
      }
      className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto_auto] gap-3 text-base"
    >
      <span className="leading-tight">{weapon.name}</span>
      {tier !== undefined && (
        <>
          <span className="text-muted-foreground text-right text-xs tabular-nums">{signedWsm}</span>
          <TierTag tier={tier} />
        </>
      )}
    </ComboboxItem>
  );
}

function FamilyIcon({ family }: { readonly family: WeaponFamily }) {
  const rows = family.weapons.length;

  return (
    <span className="relative grid place-items-center py-1">
      <img
        src={weaponIconSrc(family.icon)}
        alt=""
        loading="lazy"
        className="w-auto max-w-10 drop-shadow-[0_2px_4px_rgb(0_0_0/0.7)]"
        style={{ maxHeight: `min(5.5rem, ${(rows + 1) * 1.5}rem)` }}
      />
      {family.restrictedTo !== null && (
        <img
          src={portraitSrc(family.restrictedTo)}
          alt=""
          title={`${characterNames[family.restrictedTo]} only`}
          className="border-item/70 absolute right-0 bottom-0.5 size-[1.125rem] rounded-sm border"
        />
      )}
    </span>
  );
}

function WeaponGroupView({ group }: { readonly group: WeaponGroup }) {
  if (group.value === "none") {
    return (
      <ComboboxGroup items={group.items}>
        {group.items.map((weapon) => (
          <WeaponOption key={weapon.id} weapon={weapon} />
        ))}
      </ComboboxGroup>
    );
  }

  return (
    <ComboboxGroup items={group.items}>
      <ComboboxLabel className="font-display bg-popover text-primary sticky top-0 z-10 border-b pt-3 text-xs font-semibold tracking-widest uppercase">
        {weaponCategoryNames[group.value]}
      </ComboboxLabel>
      {familiesOf(group.items).map((family, index) => (
        <div
          key={family.family}
          className={cn("grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-1", index > 0 && "border-t")}
        >
          <FamilyIcon family={family} />
          <div className="grid content-center py-0.5">
            {family.weapons.map((weapon) => (
              <WeaponOption key={weapon.id} weapon={weapon} />
            ))}
          </div>
        </div>
      ))}
    </ComboboxGroup>
  );
}

interface PickerFieldProps {
  readonly label: string;
  readonly value: WeaponData;
  readonly open: boolean;
  readonly describedBy: string | undefined;
  readonly className: string | undefined;
}

/** Closed, the field shows the weapon's icon and tier; open, a search icon. */
function PickerField({ label, value, open, describedBy, className }: PickerFieldProps) {
  return (
    <ComboboxInput
      aria-label={label}
      aria-describedby={describedBy}
      placeholder="Search a weapon"
      showTrigger={false}
      showClear
      className={cn(
        "border-border bg-input/60 text-figure h-10 w-full [&_input]:text-[1.1875rem]",
        className,
      )}
    >
      <InputGroupAddon className="ps-3 pe-1.5">
        {open || value.item === null ? (
          <SearchIcon />
        ) : (
          <img src={weaponIconSrc(value.item.icon)} alt="" className="max-h-8 max-w-5" />
        )}
      </InputGroupAddon>
      {!open && value.item !== null && <TierTag tier={value.item.tier} />}
    </ComboboxInput>
  );
}

interface WeaponPickerProps {
  readonly label: string;
  /** The weapons the hand may hold. */
  readonly weapons: readonly WeaponData[];
  readonly value: WeaponData;
  readonly onValueChange: (weapon: WeaponData) => void;
  /** Id of the element that describes the input. */
  readonly describedBy?: string | undefined;
  readonly className?: string;
}

/**
 * A search over the weapons, grouped by category and family, with category and tier facets. The
 * facets outlive a close; a category the list no longer offers leaves them. Opening empties the
 * search; the clear button empties it and opens the list, and the chosen weapon stays.
 */
export function WeaponPicker(props: WeaponPickerProps) {
  const { label, weapons, value, onValueChange, describedBy, className } = props;
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<WeaponFilters>(noFilters);
  const groups = useMemo(() => groupWeapons(weapons), [weapons]);
  const offered = offeredCategories(groups);
  const active = effectiveFilters(filters, offered);

  return (
    <Combobox
      items={filterGroups(groups, active)}
      value={value}
      onValueChange={(weapon: WeaponData | null) => {
        if (weapon === null) {
          setQuery("");
          setOpen(true);
        } else {
          setQuery(null);
          onValueChange(weapon);
        }
      }}
      inputValue={query ?? value.name}
      onInputValueChange={setQuery}
      itemToStringLabel={weaponName}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setQuery(next ? "" : null);
      }}
    >
      <PickerField
        label={label}
        value={value}
        open={open}
        describedBy={describedBy}
        className={className}
      />
      <ComboboxContent className="flex flex-col">
        <WeaponFacets offered={offered} filters={active} onFiltersChange={setFilters} />
        <ComboboxEmpty>No weapon found.</ComboboxEmpty>
        <ComboboxList className="max-h-[28rem] min-h-0 flex-1 pt-0">
          {(group: WeaponGroup) => <WeaponGroupView key={group.value} group={group} />}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

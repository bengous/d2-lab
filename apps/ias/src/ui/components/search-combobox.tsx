import { cn } from "cn";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/ui/components/ui/combobox";
import { InputGroupAddon } from "@/ui/components/ui/input-group";

interface SearchComboboxProps<Item> {
  /** Accessible name of the input. */
  readonly label: string;
  readonly items: readonly Item[];
  readonly value: Item | null;
  /** `null` when the user clears the input; the input shows `value` again on blur. */
  readonly onValueChange: (item: Item | null) => void;
  /** Also the filter text and the React key, so labels must be unique. */
  readonly itemToLabel: (item: Item) => string;
  readonly placeholder: string;
  readonly emptyText: string;
  /** Id of the element that describes the input. */
  readonly describedBy?: string | undefined;
  readonly className?: string;
}

function SearchResults<Item>({
  itemToLabel,
  emptyText,
}: Pick<SearchComboboxProps<Item>, "itemToLabel" | "emptyText">) {
  return (
    <ComboboxContent>
      <ComboboxEmpty>{emptyText}</ComboboxEmpty>
      <ComboboxList>
        {(item: Item) => (
          <ComboboxItem key={itemToLabel(item)} value={item} className="text-base">
            {itemToLabel(item)}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  );
}

export function SearchCombobox<Item>({
  label,
  items,
  value,
  onValueChange,
  itemToLabel,
  placeholder,
  emptyText,
  describedBy,
  className,
}: SearchComboboxProps<Item>) {
  const [query, setQuery] = useState<string | null>(null);

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(item) => {
        setQuery(null);
        onValueChange(item);
      }}
      inputValue={query ?? (value === null ? "" : itemToLabel(value))}
      onInputValueChange={setQuery}
      itemToStringLabel={itemToLabel}
    >
      <ComboboxInput
        aria-label={label}
        aria-describedby={describedBy}
        placeholder={placeholder}
        showTrigger={false}
        showClear
        onBlur={() => {
          setQuery(null);
        }}
        className={cn(
          "h-10 w-full border-border bg-input/60 text-figure [&_input]:text-[1.1875rem]",
          className,
        )}
      >
        <InputGroupAddon className="ps-3.5 pe-2">
          <SearchIcon />
        </InputGroupAddon>
      </ComboboxInput>
      <SearchResults itemToLabel={itemToLabel} emptyText={emptyText} />
    </Combobox>
  );
}

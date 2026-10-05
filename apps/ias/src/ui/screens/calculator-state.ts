import type { Build } from "@/contracts/build";
import type { InputSpec } from "@/contracts/inputs";
import type { ShareLinkError } from "@/contracts/share-link";
import { computeTables } from "@/engine/compute-tables";
import { defaultBuild } from "@/engine/default-build";
import { withBounds } from "@/engine/floors";
import { locate } from "@/engine/locate";
import { resolveBuild } from "@/engine/normalize";
import { primaryTable } from "@/engine/primary-table";
import { parseShareLink } from "@/share-link/parse";
import type { LocatedTable } from "@/ui/screens/breakpoints-panels";

/**
 * What the screen shows for a raw UI state. The raw state keeps every value the player typed, a
 * hidden or refused one included; `unraised` coerces its selects, `build` bounds it by its floors
 * and ceilings, and the tables come from `normalize(raw)`, which also resets the hidden fields.
 */
export interface CalculatorView {
  /**
   * The raw state with the select values the form offers, `current` for the table variable shown,
   * every value under a floor raised to it and every value over a ceiling lowered to it.
   */
  readonly build: Build;
  /** `build` before its floors and ceilings move it: an edit lands on it (`applyEdit`). */
  readonly unraised: Build;
  /** `normalize(raw)`: the tables and the attack animation come from it. */
  readonly normalized: Build;
  readonly inputs: InputSpec;
  readonly tables: readonly LocatedTable[];
  readonly primary: LocatedTable;
}

export function calculatorView(raw: Build): CalculatorView {
  const { spec, coerced, normalized: engineBuild } = resolveBuild(raw);
  const breakpoints = computeTables(engineBuild);

  const tables: readonly LocatedTable[] = breakpoints.tables.map((table) => ({
    table,
    position: locate(table, engineBuild.current),
  }));

  const main = primaryTable(breakpoints);
  const located = tables.find(({ table }) => table === main);

  if (located === undefined) {
    throw new Error("the primary table is not one of the computed tables");
  }

  return {
    build: withBounds(coerced, spec),
    unraised: coerced,
    normalized: engineBuild,
    inputs: spec,
    tables,
    primary: located,
  };
}

/** Where the page starts: the raw state, and the error of a link that did not parse. */
export interface LoadedLink {
  readonly raw: Build;
  readonly linkError: ShareLinkError | null;
}

/** An empty search is no link: the default build loads without a parse. An invalid link loads it too. */
export function loadLink(search: string): LoadedLink {
  if (search === "") {
    return { raw: defaultBuild, linkError: null };
  }

  const parsed = parseShareLink(search);

  return parsed.ok
    ? { raw: parsed.build, linkError: null }
    : { raw: defaultBuild, linkError: parsed.error };
}

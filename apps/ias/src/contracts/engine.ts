import type { Build, TableVariable } from "@/contracts/build";
import type { InputSpec } from "@/contracts/inputs";
import type { BreakpointRow, BreakpointTable, Result } from "@/contracts/result";

/**
 * Engine and share-link input only.
 * Resets the fields that `availableInputs` hides to their defaults, except `current`, then raises
 * each field under its floor.
 */
export type Normalize = (build: Build) => Build;

export type AvailableInputs = (build: Build) => InputSpec;

/** UI transition: swaps `current` with the speed field that matches the variable. */
export type WithTableVariable = (build: Build, variable: TableVariable) => Build;

export type ComputeTables = (build: Build) => Result;

/** The Whirlwind merged table if present, else the first. */
export type PrimaryTable = (result: Result) => BreakpointTable;

/** `null` only for a table without rows: WIAS rows stop above 120 WIAS (calculator.js:760@bcc112d). */
export type Locate = (
  table: BreakpointTable,
  current: number,
) => { readonly now: BreakpointRow; readonly next: BreakpointRow | null } | null;

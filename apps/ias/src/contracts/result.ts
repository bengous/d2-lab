import type { TableVariable } from "@/contracts/build";

/** The hits of a rollback skill as `frames` groups them: `9+8+(6)+11`. */
export interface RollbackHits {
  /** The hits before the rhythm settles: `[9, 8]`. */
  readonly first: readonly number[];
  /** One hit, or two that alternate: `[6]`. */
  readonly repeated: readonly [number] | readonly [number, number];
  readonly last: number;
}

export interface BreakpointRow {
  readonly value: number;
  /** `'8'` or `'(6)+11'`: the original output, pinned by the goldens. */
  readonly frames: string;
  /** Game frames of each hit; one entry for a plain attack. */
  readonly hits: readonly number[];
  /** `null` for one entry. */
  readonly rollback: RollbackHits | null;
}

/**
 * `main`: the primary weapon. `off-hand`: the second weapon of a dual wield.
 * `merged`: the swing both Whirlwind weapons share. `odd-hits`: Strafe or Fend with an odd number of hits.
 */
export type TableRole = "main" | "off-hand" | "merged" | "odd-hits";

export interface BreakpointTable {
  readonly role: TableRole;
  readonly variable: TableVariable;
  readonly rows: readonly BreakpointRow[];
}

export interface Result {
  readonly tables: readonly BreakpointTable[];
}

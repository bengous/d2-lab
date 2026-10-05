export type SelectId =
  | "characterSelect"
  | "wereformSelect"
  | "skillSelect"
  | "primaryWeaponSelect"
  | "secondaryWeaponSelect"
  | "tableVariableSelect";

/**
 * The canonical order. The table variable comes after the weapons because its options depend on
 * the secondary weapon (calculator.js:305-311).
 */
export const SELECT_ORDER: readonly SelectId[] = [
  "characterSelect",
  "wereformSelect",
  "skillSelect",
  "primaryWeaponSelect",
  "secondaryWeaponSelect",
  "tableVariableSelect",
];

export type OriginalValue = string | number | boolean;

/** The 24 controls of `#calculator` keyed by element id, in DOM order: select values, numbers, checkbox states. */
export type OriginalInput = Readonly<Record<string, OriginalValue>>;

/** Offered options per select (disabled dividers read `divider`), and the visible `#calculator > div` ids. */
export interface FormState {
  readonly options: Readonly<Record<SelectId, readonly string[]>>;
  readonly visible: readonly string[];
}

export interface OriginalTable {
  readonly header: readonly [string, string];
  readonly rows: readonly (readonly [string, string])[];
}

export interface CaseOutput {
  readonly tables: readonly OriginalTable[];
}

export type FieldValue = number | boolean;

export type SelectChoice = readonly [SelectId, string];

export type FieldChoice = readonly [string, FieldValue];

/** A number field or a checkbox of `#calculator`, with its HTML bounds and its value on a fresh page. */
export type FieldSpec =
  | {
      readonly id: string;
      readonly kind: "number";
      readonly min: number;
      readonly max: number | null;
      readonly initial: number;
    }
  | { readonly id: string; readonly kind: "checkbox"; readonly initial: boolean };

export interface Baseline {
  readonly input: OriginalInput;
  readonly fields: readonly FieldSpec[];
}

export interface PathRequest {
  readonly selects: readonly SelectChoice[];
  readonly fields: readonly FieldChoice[];
  readonly baseline: OriginalInput;
}

export type PathResponse =
  | { readonly kind: "branch"; readonly select: SelectId; readonly options: readonly string[] }
  | {
      readonly kind: "leaf";
      readonly input: OriginalInput;
      readonly form: FormState;
      readonly output: CaseOutput;
      readonly visibleFields: readonly string[];
    };

/** Installed on `window` by the in-page bundle of `in-page.ts`. */
export interface GoldenPageApi {
  readonly readBaseline: () => Baseline;
  readonly runPath: (request: PathRequest) => PathResponse;
}

declare global {
  interface Window {
    iasGolden?: GoldenPageApi;
  }
}

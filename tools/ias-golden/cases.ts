import type { CharacterId } from "../../apps/ias/src/contracts/build";
import {
  type FieldChoice,
  type FieldSpec,
  type FieldValue,
  type FormState,
  type OriginalInput,
  type OriginalValue,
  SELECT_ORDER,
  type SelectChoice,
  type SelectId,
} from "./original-form";

/** The IAS field has no HTML `max`; the app bounds it to 400. */
const IAS_MAX = 400;

/** `char` values of constants.js:63-77. */
const CHARACTERS: ReadonlyMap<string, CharacterId> = new Map([
  ["0", "amazon"],
  ["1", "assassin"],
  ["2", "barbarian"],
  ["3", "druid"],
  ["4", "necromancer"],
  ["5", "paladin"],
  ["6", "sorceress"],
  ["7", "rogue-scout"],
  ["8", "desert-mercenary"],
  ["9", "bash-barbarian"],
  ["10", "frenzy-barbarian"],
  ["11", "warlock"],
]);

const MERCENARIES: ReadonlySet<CharacterId> = new Set([
  "rogue-scout",
  "desert-mercenary",
  "bash-barbarian",
  "frenzy-barbarian",
]);

export type Family = "single" | "forms-mercs" | "dual";

export type CaseKind = "structural" | "variant" | "bounds" | "reference";

/** A case to replay: `rank` orders the golden files, the id derives from the choices. */
export interface PlannedCase {
  readonly kind: CaseKind;
  readonly rank: readonly number[];
  readonly selects: readonly SelectChoice[];
  readonly fields: readonly FieldChoice[];
}

function isString(value: OriginalValue | undefined): value is string {
  return typeof value === "string";
}

export function selectValue(input: OriginalInput, id: SelectId): string {
  const value = input[id];

  if (!isString(value)) {
    throw new TypeError(`#${id} holds ${value}, expected a select value`);
  }

  return value;
}

export function characterOf(input: OriginalInput): CharacterId {
  const value = selectValue(input, "characterSelect");
  const character = CHARACTERS.get(value);

  if (character === undefined) {
    throw new Error(`unknown character ${value}`);
  }

  return character;
}

export function compareRanks(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return left.length - right.length;
}

/** The six select values in canonical order (`-` when hidden), then the filled fields. */
export function caseId(selects: readonly SelectChoice[], fields: readonly FieldChoice[]): string {
  const chosen = new Map(selects);
  const path = SELECT_ORDER.map((id) => chosen.get(id) ?? "-").join("|");

  return fields.length === 0
    ? path
    : `${path}|${fields.map(([id, value]) => `${id}=${value}`).join(",")}`;
}

/** A value in [0, 1) drawn from the seed alone, so a variant does not depend on run order. */
function drawUnit(seed: string): number {
  return new Bun.CryptoHasher("sha256").update(seed).digest().readUInt32BE(0) / 2 ** 32;
}

function upperBound(spec: Extract<FieldSpec, { kind: "number" }>): number {
  return spec.max ?? IAS_MAX;
}

/** A value within the field's bounds, drawn from the structural case id and the field id. */
export function drawField(spec: FieldSpec, seed: string): FieldValue {
  const unit = drawUnit(`${seed}#${spec.id}`);

  if (spec.kind === "checkbox") {
    return unit < 0.5;
  }

  return spec.min + Math.floor(unit * (upperBound(spec) - spec.min + 1));
}

export function boundsOf(spec: FieldSpec): readonly [FieldValue, FieldValue] {
  return spec.kind === "checkbox" ? [false, true] : [spec.min, upperBound(spec)];
}

/** `dual`: a second item equipped or Whirlwind; `forms-mercs`: a wereform or a mercenary. */
export function familyOf(input: OriginalInput, form: FormState): Family {
  const hasSecondItem =
    form.visible.includes("secondaryWeaponContainer") &&
    selectValue(input, "secondaryWeaponSelect") !== "None";

  if (hasSecondItem || selectValue(input, "skillSelect") === "Whirlwind") {
    return "dual";
  }

  if (selectValue(input, "wereformSelect") !== "0" || MERCENARIES.has(characterOf(input))) {
    return "forms-mercs";
  }

  return "single";
}

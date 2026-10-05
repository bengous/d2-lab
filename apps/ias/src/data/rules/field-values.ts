import type { Slows, SpeedNumberField, SpeedSources, TableVariable } from "@/contracts/build";
import type { Floor, InputSpec } from "@/contracts/inputs";
import { eiasLimits } from "@/data/rules/caps";

export interface NumberField {
  readonly default: number;
  readonly min: number;
  readonly max: number;
  readonly source: string;
}

export interface CheckboxField {
  readonly default: boolean;
  readonly source: string;
}

type FieldValues<Values> = {
  readonly [Field in keyof Values]: Values[Field] extends boolean ? CheckboxField : NumberField;
};

/** Original HTML `value`, `min` and `max`. IAS has no original `max`: the app bounds it at 400. */
export const speedFields: FieldValues<SpeedSources> = {
  ias: { default: 0, min: 0, max: 400, source: "index.html:95@bcc112d decision: max 400" },
  primaryWias: { default: 0, min: 0, max: 120, source: "index.html:80@bcc112d" },
  secondaryWias: { default: 0, min: 0, max: 120, source: "index.html:90@bcc112d" },
  fanaticism: { default: 0, min: 0, max: 60, source: "index.html:100@bcc112d" },
  burstOfSpeed: { default: 0, min: 0, max: 60, source: "index.html:105@bcc112d" },
  werewolf: { default: 0, min: 0, max: 60, source: "index.html:110@bcc112d" },
  maul: { default: 0, min: 0, max: 60, source: "index.html:115@bcc112d" },
  frenzy: { default: 0, min: 0, max: 60, source: "index.html:120@bcc112d" },
  purge: { default: 0, min: 0, max: 60, source: "index.html:130@bcc112d" },
  cleave: { default: 1, min: 1, max: 60, source: "index.html:135@bcc112d" },
  mirroredBlades: { default: 1, min: 1, max: 60, source: "index.html:140@bcc112d" },
  markOfTheBear: { default: false, source: "index.html:124@bcc112d" },
};

export const slowFields: FieldValues<Slows> = {
  holyFreeze: { default: 0, min: 0, max: 60, source: "index.html:145@bcc112d" },
  slowedBy: { default: 0, min: 0, max: 50, source: "index.html:150@bcc112d" },
  decrepify: { default: false, source: "index.html:154@bcc112d" },
  chilled: { default: false, source: "index.html:158@bcc112d" },
  lethargy: { default: false, source: "index.html:162@bcc112d" },
};

export const oneHandedField: CheckboxField = { default: false, source: "index.html:75@bcc112d" };

/** The speed field that holds each table variable while it is not the table variable. EIAS has none. */
export const variableFields: Readonly<Record<TableVariable, SpeedNumberField | null>> = {
  eias: null,
  ias: "ias",
  "primary-wias": "primaryWias",
  "secondary-wias": "secondaryWias",
  fanaticism: "fanaticism",
  "burst-of-speed": "burstOfSpeed",
  werewolf: "werewolf",
  maul: "maul",
  frenzy: "frenzy",
};

/**
 * `current` for EIAS, which the original form has no field for: 0, bounded by the EIAS the
 * engine clamps to. Every other variable takes the bounds of its speed field.
 */
export const eiasCurrent: NumberField = {
  default: 0,
  min: eiasLimits.min,
  max: eiasLimits.wereformMax,
  source: "constants.js:137-139@bcc112d",
};

export function currentField(variable: TableVariable): NumberField {
  const field = variableFields[variable];

  return field === null ? eiasCurrent : speedFields[field];
}

/** The bounds of a field, its minimum raised to its floor and its maximum lowered to its ceiling. */
export function bounded(
  field: NumberField,
  floor: Floor | undefined,
  ceiling: number | undefined,
): NumberField {
  return {
    ...field,
    min: Math.max(field.min, floor?.min ?? field.min),
    max: Math.min(field.max, ceiling ?? field.max),
  };
}

/** `currentField`, bounded by the floor and the ceiling of the table variable's field. */
export function boundedCurrentField(
  variable: TableVariable,
  { floors, ceilings }: Pick<InputSpec, "floors" | "ceilings">,
): NumberField {
  const field = variableFields[variable];

  return field === null ? eiasCurrent : bounded(speedFields[field], floors[field], ceilings[field]);
}

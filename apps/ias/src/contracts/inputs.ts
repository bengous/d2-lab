import type {
  Slows,
  SkillId,
  SpeedNumberField,
  SpeedSources,
  TableVariable,
  WeaponId,
  Wereform,
} from "@/contracts/build";

export type FieldId =
  | "wereform"
  | "primary"
  | "secondary"
  | "tableVariable"
  | "oneHanded"
  | "current"
  | keyof SpeedSources
  | keyof Slows;

/** An item the build must carry, or a skill the build uses. */
export type FloorOrigin =
  | { readonly kind: "item"; readonly item: string }
  | { readonly kind: "skill"; readonly skill: string };

/** The lowest value the build allows in a speed field. */
export interface Floor {
  readonly min: number;
  readonly origin: FloorOrigin;
}

/** Only the fields that count: shown, or held by `current` as the table variable. */
export type Floors = Readonly<Partial<Record<SpeedNumberField, Floor>>>;

/** The highest value the build allows in a speed field, only for the fields that count. */
export type Ceilings = Readonly<Partial<Record<SpeedNumberField, number>>>;

export interface InputSpec {
  readonly wereforms: readonly Wereform[];
  /** Class skills, then oskills after a `divider`, duplicates removed. */
  readonly skills: readonly (SkillId | "divider")[];
  readonly primaryWeapons: readonly WeaponId[];
  readonly secondaryWeapons: readonly WeaponId[];
  readonly tableVariables: readonly TableVariable[];
  /** A hidden select or input is absent. */
  readonly fields: ReadonlySet<FieldId>;
  readonly floors: Floors;
  readonly ceilings: Ceilings;
}

import type { Build, Slows, SpeedSources, TableVariable } from "@/contracts/build";
import { withTableVariable } from "@/engine/with-table-variable";
import type { CalculatorView } from "@/ui/screens/calculator-state";

type FieldEdit<Shape> = {
  readonly [Field in keyof Shape]: { readonly field: Field; readonly value: Shape[Field] };
}[keyof Shape];

type BuildField =
  | "character"
  | "wereform"
  | "skill"
  | "primary"
  | "secondary"
  | "oneHanded"
  | "current";

/** One change the player makes on the form, in terms of the shown build. */
export type BuildEdit =
  | ({ readonly kind: "build" } & FieldEdit<Pick<Build, BuildField>>)
  | ({ readonly kind: "speed" } & FieldEdit<SpeedSources>)
  | ({ readonly kind: "slows" } & FieldEdit<Slows>)
  | { readonly kind: "table-variable"; readonly variable: TableVariable };

/**
 * Applies an edit to the raw state. The edit lands on the shown build before its bounds move it,
 * whose `current` matches the table variable shown. Every select but the edited one keeps its raw
 * value, so a weapon or skill the form hides or refuses comes back once the form offers it again;
 * a value a floor or a ceiling moved comes back once the build leaves it.
 */
export function applyEdit(
  raw: Build,
  { unraised }: Pick<CalculatorView, "unraised">,
  edit: BuildEdit,
): Build {
  const base: Build = {
    ...unraised,
    wereform: raw.wereform,
    skill: raw.skill,
    primary: raw.primary,
    secondary: raw.secondary,
  };

  if (edit.kind === "table-variable") {
    return withTableVariable(base, edit.variable);
  }

  if (edit.kind === "speed") {
    return { ...base, speed: { ...base.speed, [edit.field]: edit.value } };
  }

  if (edit.kind === "slows") {
    return { ...base, slows: { ...base.slows, [edit.field]: edit.value } };
  }

  return { ...base, [edit.field]: edit.value };
}

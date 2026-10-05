import type { Build } from "@/contracts/build";
import type { Normalize } from "@/contracts/engine";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import { oneHandedField, slowFields, speedFields } from "@/data/rules/field-values";
import { resolveForm } from "@/engine/available-inputs";
import { withBounds } from "@/engine/floors";
import { withTableVariable } from "@/engine/with-table-variable";

/** A build on its way through `normalize`, with the form it resolved. */
export interface ResolvedBuild {
  readonly spec: InputSpec;
  /**
   * Every select coerced to what the form offers, `current` moved along if the table variable
   * changed. Hidden fields keep their values; no floor or ceiling moves a value.
   */
  readonly coerced: Build;
  /** `normalize(build)`: `coerced` with every hidden field reset, then bounded by its floors and ceilings. */
  readonly normalized: Build;
}

/** `current` is always shown. */
function resetHidden(coerced: Build, fields: ReadonlySet<FieldId>): Build {
  const { speed, slows } = coerced;

  const keep = <Value>(field: FieldId, value: Value, reset: { readonly default: Value }): Value =>
    fields.has(field) ? value : reset.default;

  return {
    ...coerced,
    oneHanded: keep("oneHanded", coerced.oneHanded, oneHandedField),
    speed: {
      ias: keep("ias", speed.ias, speedFields.ias),
      primaryWias: keep("primaryWias", speed.primaryWias, speedFields.primaryWias),
      secondaryWias: keep("secondaryWias", speed.secondaryWias, speedFields.secondaryWias),
      fanaticism: keep("fanaticism", speed.fanaticism, speedFields.fanaticism),
      burstOfSpeed: keep("burstOfSpeed", speed.burstOfSpeed, speedFields.burstOfSpeed),
      werewolf: keep("werewolf", speed.werewolf, speedFields.werewolf),
      maul: keep("maul", speed.maul, speedFields.maul),
      frenzy: keep("frenzy", speed.frenzy, speedFields.frenzy),
      purge: keep("purge", speed.purge, speedFields.purge),
      cleave: keep("cleave", speed.cleave, speedFields.cleave),
      mirroredBlades: keep("mirroredBlades", speed.mirroredBlades, speedFields.mirroredBlades),
      markOfTheBear: keep("markOfTheBear", speed.markOfTheBear, speedFields.markOfTheBear),
    },
    slows: {
      holyFreeze: keep("holyFreeze", slows.holyFreeze, slowFields.holyFreeze),
      slowedBy: keep("slowedBy", slows.slowedBy, slowFields.slowedBy),
      decrepify: keep("decrepify", slows.decrepify, slowFields.decrepify),
      chilled: keep("chilled", slows.chilled, slowFields.chilled),
      lethargy: keep("lethargy", slows.lethargy, slowFields.lethargy),
    },
  };
}

/** Resolves the form of a build once, for a caller that needs the form and several stages. */
export function resolveBuild(build: Build): ResolvedBuild {
  const { wereform, skill, primary, secondary, tableVariable, spec } = resolveForm(build);
  const coerced = withTableVariable(
    { ...build, wereform, skill, primary, secondary },
    tableVariable,
  );

  return {
    spec,
    coerced,
    normalized: withBounds(resetHidden(coerced, spec.fields), spec),
  };
}

export const normalize: Normalize = (build) => resolveBuild(build).normalized;

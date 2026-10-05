import type {
  Build,
  CharacterId,
  SkillId,
  SlowFlag,
  SlowNumberField,
  SpeedFlag,
  SpeedNumberField,
} from "@/contracts/build";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import type { ParseShareLink } from "@/contracts/share-link";
import {
  bounded,
  boundedCurrentField,
  type NumberField,
  slowFields,
  speedFields,
} from "@/data/rules/field-values";
import { availableInputs } from "@/engine/available-inputs";
import { defaultBuild } from "@/engine/default-build";
import { keysOf } from "@/lib/keys";

export type ApplyResult = ReturnType<ParseShareLink>;

export type ApplyFailure = Extract<ApplyResult, { readonly ok: false }>;

export const versionParam = "v";

export const shareLinkVersion = "1";

/** A query parameter that sets a form select, checked against what `availableInputs` offers. */
export interface SelectParam {
  readonly name: string;
  readonly edits: "select";
  /** The build with `raw` applied, or the error the value earns. */
  readonly apply: (build: Build, raw: string) => ApplyResult;
  /** The text to write, `undefined` when the value equals the default build's. */
  readonly emit: (build: Build) => string | undefined;
}

/** A query parameter that sets a field `availableInputs` may hide. A link that sets a hidden field is an error. */
export interface FieldParam {
  readonly name: string;
  readonly edits: FieldId;
  /** The build with `raw` applied, or the error the value earns, given the form of the build. */
  readonly apply: (build: Build, raw: string, form: InputSpec) => ApplyResult;
  /** The text to write, `undefined` when the value equals the default build's. */
  readonly emit: (build: Build) => string | undefined;
}

/** One query parameter: how a raw value changes a build, and how a build writes it back. */
export type ShareParam = SelectParam | FieldParam;

const characters: Readonly<Record<CharacterId, true>> = {
  amazon: true,
  assassin: true,
  barbarian: true,
  druid: true,
  necromancer: true,
  paladin: true,
  sorceress: true,
  warlock: true,
  "rogue-scout": true,
  "desert-mercenary": true,
  "bash-barbarian": true,
  "frenzy-barbarian": true,
};

const characterIds: readonly CharacterId[] = keysOf(characters);

function isSkillId(option: SkillId | "divider"): option is SkillId {
  return option !== "divider";
}

/** One canonical spelling per integer: no sign but `-`, no leading zero, no `-0`. */
const integerText = /^(?:0|-?[1-9]\d*)$/u;

export function unknownValue(param: string, value: string): ApplyFailure {
  return { ok: false, error: { kind: "unknown-value", param, value } };
}

function slugParam<Value extends string>(
  name: string,
  field: {
    readonly options: (build: Build) => readonly Value[];
    readonly read: (build: Build) => Value;
    readonly write: (build: Build, value: Value) => Build;
  },
): SelectParam {
  return {
    name,
    edits: "select",
    apply: (build, raw) => {
      const value = field.options(build).find((option) => option === raw);

      return value === undefined
        ? unknownValue(name, raw)
        : { ok: true, build: field.write(build, value) };
    },
    emit: (build) => {
      const value = field.read(build);

      return value === field.read(defaultBuild) ? undefined : value;
    },
  };
}

function numberParam(
  name: string,
  edits: FieldId,
  field: {
    readonly bounds: (build: Build, form: InputSpec) => NumberField;
    readonly read: (build: Build) => number;
    readonly write: (build: Build, value: number) => Build;
  },
): FieldParam {
  return {
    name,
    edits,
    apply: (build, raw, form) => {
      if (!integerText.test(raw)) {
        return unknownValue(name, raw);
      }

      const value = Number(raw);
      const { min, max } = field.bounds(build, form);

      return value < min || value > max
        ? { ok: false, error: { kind: "out-of-range", param: name, value } }
        : { ok: true, build: field.write(build, value) };
    },
    emit: (build) => {
      const value = field.read(build);

      return value === field.read(defaultBuild) ? undefined : String(value);
    },
  };
}

/** A checkbox is written `name=1` when checked and left out otherwise. */
function flagParam(
  name: string,
  edits: FieldId,
  field: {
    readonly read: (build: Build) => boolean;
    readonly check: (build: Build) => Build;
  },
): FieldParam {
  return {
    name,
    edits,
    apply: (build, raw) =>
      raw === "1" ? { ok: true, build: field.check(build) } : unknownValue(name, raw),
    emit: (build) => (field.read(build) ? "1" : undefined),
  };
}

/**
 * The parameter name of every speed and slow field, in link order. Version 1 of the link format
 * fixes these names: a renamed parameter breaks the links already shared.
 */
const speedNumberParams: Readonly<Record<SpeedNumberField, string>> = {
  ias: "ias",
  primaryWias: "wias1",
  secondaryWias: "wias2",
  fanaticism: "fana",
  burstOfSpeed: "bos",
  werewolf: "wolf",
  maul: "maul",
  frenzy: "frenzy",
  purge: "purge",
  cleave: "cleave",
  mirroredBlades: "mblades",
};

const speedFlagParams: Readonly<Record<SpeedFlag, string>> = { markOfTheBear: "motb" };

const slowNumberParams: Readonly<Record<SlowNumberField, string>> = {
  holyFreeze: "hf",
  slowedBy: "slow",
};

const slowFlagParams: Readonly<Record<SlowFlag, string>> = {
  decrepify: "decrep",
  chilled: "chill",
  lethargy: "lethargy",
};

function speedParam(key: SpeedNumberField): FieldParam {
  return numberParam(speedNumberParams[key], key, {
    bounds: (_build, form) => bounded(speedFields[key], form.floors[key], form.ceilings[key]),
    read: (build) => build.speed[key],
    write: (build, value) => ({ ...build, speed: { ...build.speed, [key]: value } }),
  });
}

function speedFlagParam(key: SpeedFlag): FieldParam {
  return flagParam(speedFlagParams[key], key, {
    read: (build) => build.speed[key],
    check: (build) => ({ ...build, speed: { ...build.speed, [key]: true } }),
  });
}

function slowParam(key: SlowNumberField): FieldParam {
  return numberParam(slowNumberParams[key], key, {
    bounds: () => slowFields[key],
    read: (build) => build.slows[key],
    write: (build, value) => ({ ...build, slows: { ...build.slows, [key]: value } }),
  });
}

function slowFlagParam(key: SlowFlag): FieldParam {
  return flagParam(slowFlagParams[key], key, {
    read: (build) => build.slows[key],
    check: (build) => ({ ...build, slows: { ...build.slows, [key]: true } }),
  });
}

/**
 * The link's parameters in the order they are validated and written. Each slug is checked against
 * what `availableInputs` offers for the parameters before it, so the order is the form's canonical
 * order, then the numbers and checkboxes.
 */
export const shareParams: readonly ShareParam[] = [
  slugParam("class", {
    options: () => characterIds,
    read: (build) => build.character,
    write: (build, character) => ({ ...build, character }),
  }),
  slugParam("form", {
    options: (build) => availableInputs(build).wereforms,
    read: (build) => build.wereform,
    write: (build, wereform) => ({ ...build, wereform }),
  }),
  slugParam("skill", {
    options: (build) => availableInputs(build).skills.filter((option) => isSkillId(option)),
    read: (build) => build.skill,
    write: (build, skill) => ({ ...build, skill }),
  }),
  slugParam("weapon", {
    options: (build) => availableInputs(build).primaryWeapons,
    read: (build) => build.primary,
    write: (build, primary) => ({ ...build, primary }),
  }),
  slugParam("offhand", {
    options: (build) => availableInputs(build).secondaryWeapons,
    read: (build) => build.secondary,
    write: (build, secondary) => ({ ...build, secondary }),
  }),
  flagParam("onehand", "oneHanded", {
    read: (build) => build.oneHanded,
    check: (build) => ({ ...build, oneHanded: true }),
  }),
  slugParam("table", {
    options: (build) => availableInputs(build).tableVariables,
    read: (build) => build.tableVariable,
    write: (build, tableVariable) => ({ ...build, tableVariable }),
  }),
  numberParam("current", "current", {
    bounds: (build, form) => boundedCurrentField(build.tableVariable, form),
    read: (build) => build.current,
    write: (build, current) => ({ ...build, current }),
  }),
  ...keysOf(speedNumberParams).map((key) => speedParam(key)),
  ...keysOf(speedFlagParams).map((key) => speedFlagParam(key)),
  ...keysOf(slowNumberParams).map((key) => slowParam(key)),
  ...keysOf(slowFlagParams).map((key) => slowFlagParam(key)),
];

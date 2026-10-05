import { describe, expect, test } from "bun:test";

import type { Build, SpeedNumberField, WeaponId } from "@/contracts/build";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import { gameData } from "@/data/generated/game-data";
import { oneHandedField, slowFields, speedFields, variableFields } from "@/data/rules/field-values";
import { availableInputs } from "@/engine/available-inputs";
import { normalize } from "@/engine/normalize";

import { type ComparableInputs, comparable, readForms, snapshotInputs } from "./form-snapshots";
import {
  addedOptions,
  type AppliedCeiling,
  appliedCeilings,
  type AppliedFloor,
  appliedFloors,
  ceilingsOf,
  floorsOf,
  removedOptions,
} from "./golden-deviations";
import { families, type GoldenCase, goldenFiles } from "./golden-suite";
import { buildOutput, fromOriginalInput } from "./original";

const forms = readForms();

const strayWeapon = strayWeaponOf();

function strayWeaponOf(): WeaponId {
  const found = gameData.weapons.find((weapon) => weapon.id !== "unarmed");

  if (found === undefined) {
    throw new Error("the game data holds no weapon");
  }

  return found.id;
}

/** Puts a value other than the default in every hidden field but the selects that shape the form. */
function withHiddenNoise(build: Build, spec: InputSpec): Build {
  const noise = <Value>(field: FieldId, value: Value, stray: Value): Value =>
    spec.fields.has(field) ? value : stray;

  const { speed, slows } = build;

  return {
    ...build,
    primary: noise("primary", build.primary, strayWeapon),
    secondary: noise("secondary", build.secondary, strayWeapon),
    oneHanded: noise("oneHanded", build.oneHanded, !oneHandedField.default),
    speed: {
      ias: noise("ias", speed.ias, speedFields.ias.max),
      primaryWias: noise("primaryWias", speed.primaryWias, speedFields.primaryWias.max),
      secondaryWias: noise("secondaryWias", speed.secondaryWias, speedFields.secondaryWias.max),
      fanaticism: noise("fanaticism", speed.fanaticism, speedFields.fanaticism.max),
      burstOfSpeed: noise("burstOfSpeed", speed.burstOfSpeed, speedFields.burstOfSpeed.max),
      werewolf: noise("werewolf", speed.werewolf, speedFields.werewolf.max),
      maul: noise("maul", speed.maul, speedFields.maul.max),
      frenzy: noise("frenzy", speed.frenzy, speedFields.frenzy.max),
      purge: noise("purge", speed.purge, speedFields.purge.max),
      cleave: noise("cleave", speed.cleave, speedFields.cleave.max),
      mirroredBlades: noise("mirroredBlades", speed.mirroredBlades, speedFields.mirroredBlades.max),
      markOfTheBear: noise(
        "markOfTheBear",
        speed.markOfTheBear,
        !speedFields.markOfTheBear.default,
      ),
    },
    slows: {
      holyFreeze: noise("holyFreeze", slows.holyFreeze, slowFields.holyFreeze.max),
      slowedBy: noise("slowedBy", slows.slowedBy, slowFields.slowedBy.max),
      decrepify: noise("decrepify", slows.decrepify, !slowFields.decrepify.default),
      chilled: noise("chilled", slows.chilled, !slowFields.chilled.default),
      lethargy: noise("lethargy", slows.lethargy, !slowFields.lethargy.default),
    },
  };
}

function formOf(ref: string): Parameters<typeof snapshotInputs>[0] {
  const form = forms.get(ref);

  if (form === undefined) {
    throw new Error(`forms.json has no form ${ref}`);
  }

  return form;
}

/** A case that selects an option the game forbids: the app never builds it. */
function selectsRemoved(expected: ComparableInputs, build: Build): boolean {
  return (
    !expected.wereforms.includes(build.wereform) ||
    !expected.skills.includes(build.skill) ||
    !expected.primaryWeapons.includes(build.primary) ||
    !expected.secondaryWeapons.includes(build.secondary)
  );
}

function held(build: Build, field: SpeedNumberField): boolean {
  return variableFields[build.tableVariable] === field;
}

function valueOf(build: Build, field: SpeedNumberField): number {
  return held(build, field) ? build.current : build.speed[field];
}

function withValue(build: Build, field: SpeedNumberField, value: number): Build {
  return held(build, field)
    ? { ...build, current: value }
    : { ...build, speed: { ...build.speed, [field]: value } };
}

/** The build with each removed field at its default, as the app hides it. */
function withDefaults(build: Build, fields: readonly SpeedNumberField[]): Build {
  const speed = { ...build.speed };

  for (const field of fields) {
    speed[field] = speedFields[field].default;
  }

  return { ...build, speed };
}

/** The build with every value under its floor raised to it and every value over its ceiling lowered to it. */
function bound(
  build: Build,
  floors: readonly AppliedFloor[],
  ceilings: readonly AppliedCeiling[],
): Build {
  const raised = floors.reduce(
    (next, { field, floor }) => withValue(next, field, Math.max(valueOf(next, field), floor.min)),
    build,
  );

  return ceilings.reduce(
    (next, { field, max }) => withValue(next, field, Math.min(valueOf(next, field), max)),
    raised,
  );
}

interface KeptCase {
  readonly golden: GoldenCase;
  readonly build: Build;
  readonly expected: ComparableInputs;
  readonly removedFields: readonly SpeedNumberField[];
  /** The removed fields that hold a value other than their default: the original output counts it. */
  readonly resetting: readonly SpeedNumberField[];
  readonly floors: readonly AppliedFloor[];
  /** The floors that raise a value of the case: the original output holds the value under them. */
  readonly raising: readonly AppliedFloor[];
  readonly ceilings: readonly AppliedCeiling[];
  /** The ceilings that lower a value of the case: the original output holds the value over them. */
  readonly lowering: readonly AppliedCeiling[];
}

function keptCases(cases: readonly GoldenCase[]): readonly KeptCase[] {
  return cases.flatMap((golden) => {
    const build = fromOriginalInput(golden.input);
    const removed = removedOptions(build);
    const expected = snapshotInputs(formOf(golden.form), build, removed, addedOptions(build));

    if (selectsRemoved(expected, build)) {
      return [];
    }

    const removedFields = removed.fields;
    const resetting = removedFields.filter(
      (field) => build.speed[field] !== speedFields[field].default,
    );

    const floors = appliedFloors(build, expected.fields);
    const raising = floors.filter(({ field, floor }) => valueOf(build, field) < floor.min);
    const ceilings = appliedCeilings(build, expected.fields);
    const lowering = ceilings.filter(({ field, max }) => valueOf(build, field) > max);

    return [
      { golden, build, expected, removedFields, resetting, floors, raising, ceilings, lowering },
    ];
  });
}

interface Suite {
  readonly name: string;
  readonly total: number;
  readonly kept: readonly KeptCase[];
}

const suites: readonly Suite[] = families.flatMap((family) =>
  goldenFiles(family).map((file) => ({
    name: `${family}/${file.name}`,
    total: file.cases.length,
    kept: keptCases(file.cases),
  })),
);

for (const suite of suites) {
  describe(suite.name, () => {
    for (const kept of suite.kept) {
      const { golden, build, expected, removedFields, floors, ceilings } = kept;

      test(golden.id, () => {
        const spec = availableInputs(build);
        const bounded = bound(withDefaults(build, removedFields), floors, ceilings);
        const cleaned = normalize(withHiddenNoise(build, spec));

        expect(comparable(spec)).toEqual(expected);
        expect(spec.floors).toEqual(floorsOf(floors));
        expect(spec.ceilings).toEqual(ceilingsOf(ceilings));
        expect(normalize(build)).toEqual(bounded);
        expect(cleaned).toEqual(bounded);
        expect(normalize(cleaned)).toEqual(cleaned);

        if ([kept.resetting, kept.raising, kept.lowering].every((moved) => moved.length === 0)) {
          expect(buildOutput(cleaned)).toEqual(golden.output);
        }
      });
    }
  });
}

test("skips the cases that select an option the game forbids", () => {
  const skipped = suites.reduce((count, suite) => count + suite.total - suite.kept.length, 0);

  expect(skipped).toBe(19_166);
});

function countByName(names: readonly string[]): Record<string, number> {
  const counts = new Map<string, number>();

  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Object.fromEntries(counts);
}

const everyKept = suites.flatMap((suite) => suite.kept);

test("raises the values under a floor, and skips their original output", () => {
  expect(countByName(everyKept.flatMap((kept) => kept.raising.map(({ name }) => name)))).toEqual({
    "beast-fanaticism": 47,
    "beast-ias": 50,
    "chaos-ias": 68,
    "passion-ias": 360,
    "wolfhowl-werewolf": 1927,
    "druid-werewolf": 847,
    frenzy: 1749,
  });
});

test("lowers the values over a ceiling, and skips their original output", () => {
  expect(countByName(everyKept.flatMap((kept) => kept.lowering.map(({ name }) => name)))).toEqual({
    "hustle-burst-of-speed": 9172,
  });
});

test("resets the removed fields, and skips the original output of a case that held a value in one", () => {
  expect(countByName(everyKept.flatMap((kept) => kept.resetting))).toEqual({ purge: 8 });
});

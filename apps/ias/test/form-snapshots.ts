import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Build, SkillId, WeaponId } from "@/contracts/build";
import type { WeaponData } from "@/contracts/game-data";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import { gameData } from "@/data/generated/game-data";
import { weaponById } from "@/engine/context";

import {
  type FormState,
  SELECT_ORDER,
  type SelectId,
} from "../../../tools/ias-golden/original-form";
import type { AddedOptions, RemovedOptions } from "./golden-deviations";
import { originalSkill, originalTableVariable, originalWeapon, originalWereform } from "./original";

/**
 * An `InputSpec` whose `fields` is a sorted list, so `toEqual` compares it, without `floors` and
 * `ceilings`: the original form has none, the floor and ceiling deviations give them.
 */
export interface ComparableInputs extends Omit<InputSpec, "fields" | "floors" | "ceilings"> {
  readonly fields: readonly FieldId[];
}

/** Every `#calculator > div` id of the original form, with the field it shows. */
const containerFields: ReadonlyMap<string, FieldId> = new Map([
  ["wereformContainer", "wereform"],
  ["tableVariableContainer", "tableVariable"],
  ["primaryWeaponContainer", "primary"],
  ["isOneHandedContainer", "oneHanded"],
  ["primaryWeaponIASContainer", "primaryWias"],
  ["secondaryWeaponContainer", "secondary"],
  ["secondaryWeaponIASContainer", "secondaryWias"],
  ["IASContainer", "ias"],
  ["fanaticismContainer", "fanaticism"],
  ["burstOfSpeedContainer", "burstOfSpeed"],
  ["werewolfContainer", "werewolf"],
  ["maulContainer", "maul"],
  ["frenzyContainer", "frenzy"],
  ["markOfBearContainer", "markOfTheBear"],
  ["purgeContainer", "purge"],
  ["cleaveContainer", "cleave"],
  ["mirroredBladesContainer", "mirroredBlades"],
  ["holyFreezeContainer", "holyFreeze"],
  ["slowedByContainer", "slowedBy"],
  ["decrepifyContainer", "decrepify"],
  ["chilledContainer", "chilled"],
  ["lethargyContainer", "lethargy"],
]);

const weaponOrder: ReadonlyMap<WeaponId, number> = new Map(
  gameData.weapons.map((weapon, index) => [weapon.id, index]),
);

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptions(value: unknown): value is FormState["options"] {
  if (!isObject(value)) {
    return false;
  }

  const lists = new Map(Object.entries(value));

  return SELECT_ORDER.every((select) => isStringList(lists.get(select)));
}

function isFormState(value: unknown): value is FormState {
  if (!isObject(value)) {
    return false;
  }

  const parts = new Map(Object.entries(value));

  return isOptions(parts.get("options")) && isStringList(parts.get("visible"));
}

/** The form snapshots of `forms.json`, by ref. */
export function readForms(): ReadonlyMap<string, FormState> {
  const parsed: unknown = JSON.parse(
    readFileSync(join(import.meta.dir, "goldens", "forms.json"), "utf8"),
  );

  if (!isObject(parsed)) {
    throw new Error("forms.json is not an object");
  }

  const forms = new Map<string, FormState>();

  for (const [ref, form] of Object.entries(parsed)) {
    if (!isFormState(form)) {
      throw new Error(`forms.json ${ref} is not a form snapshot`);
    }

    forms.set(ref, form);
  }

  return forms;
}

export function comparable({
  floors: _floors,
  ceilings: _ceilings,
  ...spec
}: InputSpec): ComparableInputs {
  return { ...spec, fields: [...spec.fields].toSorted() };
}

function fieldOf(container: string): FieldId {
  const field = containerFields.get(container);

  if (field === undefined) {
    throw new Error(`unknown container of the original form: ${container}`);
  }

  return field;
}

function orderOf(weapon: WeaponId): number {
  const index = weaponOrder.get(weapon);

  if (index === undefined) {
    throw new Error(`unknown weapon id: ${weapon}`);
  }

  return index;
}

function inOrder(
  names: readonly string[],
  removed: (weapon: WeaponData) => boolean,
): readonly WeaponId[] {
  return names
    .flatMap((name) => {
      const weapon = originalWeapon(name);

      return removed(weaponById(weapon)) ? [] : [weapon];
    })
    .toSorted((left, right) => orderOf(left) - orderOf(right));
}

/**
 * Drops the removed skills on either side of the divider, a repeated skill, then a trailing divider;
 * appends the added oskills behind the divider.
 */
function uniqueSkills(
  names: readonly string[],
  removed: RemovedOptions,
  added: AddedOptions,
): readonly (SkillId | "divider")[] {
  const options = names.map((name) => (name === "divider" ? name : originalSkill(name)));
  const divider = options.includes("divider") ? options.indexOf("divider") : options.length;
  const kept = options.filter(
    (option, index) =>
      option === "divider" ||
      !(index < divider ? removed.classSkills : removed.oskills).includes(option),
  );

  const skills = kept.filter(
    (option, index) => option === "divider" || kept.indexOf(option) === index,
  );

  const trimmed = skills.at(-1) === "divider" ? skills.slice(0, -1) : skills;

  if (added.oskills.length === 0) {
    return trimmed;
  }

  return [
    ...trimmed,
    ...(trimmed.includes("divider") ? [] : ["divider" as const]),
    ...added.oskills,
  ];
}

/**
 * The inputs an original snapshot shows, in contract terms, less the removed options of its shown
 * selects and the removed fields, plus the added options. A hidden select offers only the value
 * Warren's calculator left in it. Weapons follow the game data order, where Warren's calculator
 * keeps the insertion order of constants.js:530-532,639-640@bcc112d (Blade Bow, Blade Talons,
 * Blade; Hatchet Hands, Hatchet). `current` has no original field and is always shown.
 */
export function snapshotInputs(
  form: FormState,
  build: Build,
  removed: RemovedOptions,
  added: AddedOptions,
): ComparableInputs {
  const visible = new Set(form.visible);
  const shown = (select: SelectId, container: string): readonly string[] | null =>
    visible.has(container) ? form.options[select] : null;

  const wereforms = shown("wereformSelect", "wereformContainer");
  const primaries = shown("primaryWeaponSelect", "primaryWeaponContainer");
  const secondaries = shown("secondaryWeaponSelect", "secondaryWeaponContainer");
  const tableVariables = shown("tableVariableSelect", "tableVariableContainer");

  return {
    wereforms: wereforms?.flatMap((value) => {
      const wereform = originalWereform(value);

      return removed.wereforms.includes(wereform) ? [] : [wereform];
    }) ?? [build.wereform],
    skills: uniqueSkills(form.options.skillSelect, removed, added),
    primaryWeapons:
      primaries === null ? [build.primary] : inOrder(primaries, removed.primaryWeapons),
    secondaryWeapons:
      secondaries === null ? [build.secondary] : inOrder(secondaries, removed.secondaryWeapons),
    tableVariables: tableVariables?.map((value) => originalTableVariable(value)) ?? [
      build.tableVariable,
    ],
    fields: ["current" as const, ...form.visible.map((container) => fieldOf(container))]
      .filter((field) => !removed.fields.some((removedField) => removedField === field))
      .toSorted(),
  };
}

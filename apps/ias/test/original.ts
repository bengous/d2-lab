import type {
  Build,
  CharacterId,
  SkillId,
  TableVariable,
  WeaponId,
  Wereform,
} from "@/contracts/build";
import { gameData } from "@/data/generated/game-data";
import { parseSkillId } from "@/data/rules/skills";
import { computeTables } from "@/engine/compute-tables";
import { tableHeader } from "@/engine/table-header";

import type {
  CaseOutput,
  OriginalInput,
  OriginalValue,
} from "../../../tools/ias-golden/original-form";

/** `char` values of constants.js:63-77@bcc112d. */
const characters: ReadonlyMap<string, CharacterId> = new Map([
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

/** `wf` values of constants.js:79-83@bcc112d. */
const wereforms: ReadonlyMap<string, Wereform> = new Map([
  ["0", "none"],
  ["1", "werebear"],
  ["2", "werewolf"],
]);

/** `tv` values of constants.js:85-95@bcc112d. */
const tableVariables: ReadonlyMap<string, TableVariable> = new Map([
  ["0", "eias"],
  ["1", "ias"],
  ["2", "fanaticism"],
  ["3", "primary-wias"],
  ["4", "secondary-wias"],
  ["5", "burst-of-speed"],
  ["6", "werewolf"],
  ["7", "frenzy"],
  ["8", "maul"],
]);

const weaponsById: ReadonlyMap<string, WeaponId> = new Map(
  gameData.weapons.map((weapon) => [weapon.id, weapon.id]),
);

/** Lowercase, apostrophes dropped, every other run of non-alphanumerics becomes `-`. */
export function slug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
}

function isString(value: OriginalValue | undefined): value is string {
  return typeof value === "string";
}

function isNumber(value: OriginalValue | undefined): value is number {
  return typeof value === "number";
}

function isBoolean(value: OriginalValue | undefined): value is boolean {
  return typeof value === "boolean";
}

function text(input: OriginalInput, id: string): string {
  const value = input[id];

  if (!isString(value)) {
    throw new TypeError(`#${id} holds ${String(value)}, expected a select value`);
  }

  return value;
}

function integer(input: OriginalInput, id: string): number {
  const value = input[id];

  if (!isNumber(value) || !Number.isInteger(value)) {
    throw new TypeError(`#${id} holds ${String(value)}, expected an integer`);
  }

  return value;
}

function flag(input: OriginalInput, id: string): boolean {
  const value = input[id];

  if (!isBoolean(value)) {
    throw new TypeError(`#${id} holds ${String(value)}, expected a checkbox state`);
  }

  return value;
}

function mapped<T>(map: ReadonlyMap<string, T>, value: string, select: string): T {
  const mappedValue = map.get(value);

  if (mappedValue === undefined) {
    throw new Error(`#${select} holds an unknown value: ${value}`);
  }

  return mappedValue;
}

export function originalCharacter(value: string): CharacterId {
  return mapped(characters, value, "characterSelect");
}

export function originalWereform(value: string): Wereform {
  return mapped(wereforms, value, "wereformSelect");
}

export function originalTableVariable(value: string): TableVariable {
  return mapped(tableVariables, value, "tableVariableSelect");
}

export function originalSkill(name: string): SkillId {
  return parseSkillId(slug(name));
}

/** A select that never held a weapon reads "", like "None". */
export function originalWeapon(name: string): WeaponId {
  const weaponId = weaponsById.get(name === "" || name === "None" ? "unarmed" : slug(name));

  if (weaponId === undefined) {
    throw new Error(`unknown weapon: ${name}`);
  }

  return weaponId;
}

/** Maps the 24 original form values to a build, by id and name, never by position. */
export function fromOriginalInput(input: OriginalInput): Build {
  return {
    character: originalCharacter(text(input, "characterSelect")),
    wereform: originalWereform(text(input, "wereformSelect")),
    skill: originalSkill(text(input, "skillSelect")),
    primary: originalWeapon(text(input, "primaryWeaponSelect")),
    secondary: originalWeapon(text(input, "secondaryWeaponSelect")),
    oneHanded: flag(input, "isOneHanded"),
    tableVariable: originalTableVariable(text(input, "tableVariableSelect")),
    current: 0,
    speed: {
      ias: integer(input, "IAS"),
      primaryWias: integer(input, "primaryWeaponIAS"),
      secondaryWias: integer(input, "secondaryWeaponIAS"),
      fanaticism: integer(input, "fanaticismLevel"),
      burstOfSpeed: integer(input, "burstOfSpeedLevel"),
      werewolf: integer(input, "werewolfLevel"),
      maul: integer(input, "maulLevel"),
      frenzy: integer(input, "frenzyLevel"),
      purge: integer(input, "purgeLevel"),
      cleave: integer(input, "cleaveLevel"),
      mirroredBlades: integer(input, "mirroredBladesLevel"),
      markOfTheBear: flag(input, "markOfBear"),
    },
    slows: {
      holyFreeze: integer(input, "holyFreezeLevel"),
      slowedBy: integer(input, "slowedByLevel"),
      decrepify: flag(input, "decrepify"),
      chilled: flag(input, "chilled"),
      lethargy: flag(input, "lethargy"),
    },
  };
}

/** The tables Warren's calculator renders for these form values, from the engine. */
export function originalOutput(input: OriginalInput): CaseOutput {
  return buildOutput(fromOriginalInput(input));
}

/** The tables of a build, as Warren's calculator renders them. */
export function buildOutput(build: Build): CaseOutput {
  const { tables } = computeTables(build);

  return {
    tables: tables.map((table) => ({
      header: tableHeader(table.variable, build.skill),
      rows: table.rows.map((row) => [String(row.value), row.frames] as const),
    })),
  };
}

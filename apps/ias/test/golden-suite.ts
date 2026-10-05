import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  CaseOutput,
  OriginalInput,
  OriginalTable,
  OriginalValue,
} from "../../../tools/ias-golden/original-form";
import { originalOutput } from "./original";

export type Family = "single" | "forms-mercs" | "dual";

export const families: readonly Family[] = ["single", "forms-mercs", "dual"];

export interface GoldenCase {
  readonly id: string;
  readonly input: OriginalInput;
  /** A key of `forms.json`. */
  readonly form: string;
  readonly output: CaseOutput;
}

export interface GoldenFile {
  readonly name: string;
  readonly cases: readonly GoldenCase[];
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOriginalValue(value: unknown): value is OriginalValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isStringPair(value: unknown): value is readonly [string, string] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => isString(item));
}

function isOriginalInput(value: unknown): value is OriginalInput {
  return isObject(value) && Object.values(value).every((item) => isOriginalValue(item));
}

function isOriginalTable(value: unknown): value is OriginalTable {
  if (!isObject(value)) {
    return false;
  }

  const fields = new Map(Object.entries(value));
  const header: unknown = fields.get("header");
  const rows: unknown = fields.get("rows");

  return isStringPair(header) && Array.isArray(rows) && rows.every((row) => isStringPair(row));
}

function isCaseOutput(value: unknown): value is CaseOutput {
  if (!isObject(value)) {
    return false;
  }

  const fields = new Map(Object.entries(value));
  const tables: unknown = fields.get("tables");

  return Array.isArray(tables) && tables.every((table) => isOriginalTable(table));
}

function parseCase(line: string, where: string): GoldenCase {
  const parsed: unknown = JSON.parse(line);

  if (!isObject(parsed)) {
    throw new Error(`${where} is not a JSON object`);
  }

  const fields = new Map(Object.entries(parsed));
  const id: unknown = fields.get("id");
  const input: unknown = fields.get("input");
  const form: unknown = fields.get("form");
  const output: unknown = fields.get("output");

  if (!isString(id) || !isOriginalInput(input) || !isString(form) || !isCaseOutput(output)) {
    throw new Error(`${where} is not a golden case`);
  }

  return { id, input, form, output };
}

function readCases(path: string): readonly GoldenCase[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .flatMap((line, index) => (line === "" ? [] : [parseCase(line, `${path}:${index + 1}`)]));
}

/** The case files of a family, sorted by name. */
export function goldenFiles(family: Family): readonly GoldenFile[] {
  const directory = join(import.meta.dir, "goldens", "cases", family);

  return readdirSync(directory)
    .toSorted()
    .map((name) => ({ name, cases: readCases(join(directory, name)) }));
}

/** One test per golden case of the family, named by its case id, grouped by character file. */
export function goldenSuite(family: Family): void {
  for (const file of goldenFiles(family)) {
    describe(`${family}/${file.name}`, () => {
      for (const golden of file.cases) {
        test(golden.id, () => {
          expect(originalOutput(golden.input)).toEqual(golden.output);
        });
      }
    });
  }
}

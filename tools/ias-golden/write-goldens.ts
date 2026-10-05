import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

import { caseId, characterOf, compareRanks, familyOf, type PlannedCase } from "./cases";
import type { FormState, PathResponse } from "./original-form";
import { formatWithRepoConfig, repoRoot } from "./repo";

const GENERATOR_VERSION = "2";

const GAME_VERSION = "3.3.93847";

const goldensDir = join(repoRoot, "apps/ias/test/goldens");

export interface GoldenCase {
  readonly planned: PlannedCase;
  readonly response: Extract<PathResponse, { kind: "leaf" }>;
}

export interface RunInfo {
  readonly upstreamSha: string;
  readonly seconds: number;
}

interface FormRegistry {
  readonly ref: (form: FormState) => string;
  readonly forms: () => Readonly<Record<string, FormState>>;
}

function compareByRef(
  [left]: readonly [string, FormState],
  [right]: readonly [string, FormState],
): number {
  return left < right ? -1 : 1;
}

/** Forms repeat across cases: forms.json stores each once, keyed by the hash of its JSON. */
function createFormRegistry(): FormRegistry {
  const refsByJson = new Map<string, string>();
  const formsByRef = new Map<string, FormState>();

  return {
    ref: (form) => {
      const json = JSON.stringify(form);
      const known = refsByJson.get(json);

      if (known !== undefined) {
        return known;
      }

      const ref = new Bun.CryptoHasher("sha256").update(json).digest("hex").slice(0, 16);

      if (formsByRef.has(ref)) {
        throw new Error(`two forms share the reference ${ref}`);
      }

      refsByJson.set(json, ref);
      formsByRef.set(ref, form);

      return ref;
    },
    forms: () => Object.fromEntries([...formsByRef].toSorted(compareByRef)),
  };
}

function toLine(golden: GoldenCase, registry: FormRegistry): string {
  const { input, form, output } = golden.response;

  return JSON.stringify({
    id: caseId(golden.planned.selects, golden.planned.fields),
    input,
    form: registry.ref(form),
    output,
  });
}

function countBy(values: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }

  return counts;
}

/** Groups the lines by cases/<family>/<character>.jsonl, in the order of `sorted`. */
function caseFiles(
  sorted: readonly GoldenCase[],
  registry: FormRegistry,
): ReadonlyMap<string, readonly string[]> {
  const files = new Map<string, string[]>();

  for (const golden of sorted) {
    const { input, form } = golden.response;
    const path = join(goldensDir, "cases", familyOf(input, form), `${characterOf(input)}.jsonl`);
    const lines = files.get(path) ?? [];

    lines.push(toLine(golden, registry));
    files.set(path, lines);
  }

  return files;
}

async function writeCaseFiles(files: ReadonlyMap<string, readonly string[]>): Promise<void> {
  const writes: Promise<void>[] = [];

  await rm(join(goldensDir, "cases"), { recursive: true, force: true });

  for (const [path, lines] of files) {
    writes.push(
      mkdir(dirname(path), { recursive: true }).then(async () => {
        await Bun.write(path, `${lines.join("\n")}\n`);
      }),
    );
  }

  await Promise.all(writes);
}

/** Writes cases/<family>/<character>.jsonl in rank order, forms.json and meta.json. */
export async function writeGoldens(cases: readonly GoldenCase[], run: RunInfo): Promise<void> {
  const registry = createFormRegistry();
  const sorted = cases.toSorted((left, right) =>
    compareRanks(left.planned.rank, right.planned.rank),
  );

  const ids = new Set(
    sorted.map((golden) => caseId(golden.planned.selects, golden.planned.fields)),
  );

  if (ids.size !== sorted.length) {
    throw new Error(`${sorted.length - ids.size} cases share an id`);
  }

  const files = caseFiles(sorted, registry);
  const kinds = countBy(sorted.map((golden) => golden.planned.kind));
  const families = countBy(sorted.map(({ response }) => familyOf(response.input, response.form)));
  const formsPath = join(goldensDir, "forms.json");
  const metaPath = join(goldensDir, "meta.json");

  await writeCaseFiles(files);
  await Bun.write(formsPath, `${JSON.stringify(registry.forms(), null, 2)}\n`);
  await Bun.write(
    metaPath,
    `${JSON.stringify(
      {
        upstreamSha: run.upstreamSha,
        gameVersion: GAME_VERSION,
        generatedAt: new Date().toISOString(),
        generatorVersion: GENERATOR_VERSION,
        cases: sorted.length,
        casesByKind: kinds,
      },
      null,
      2,
    )}\n`,
  );

  await formatWithRepoConfig([formsPath, metaPath]);

  console.log(
    `${sorted.length} cases ${JSON.stringify(kinds)}, families ${JSON.stringify(families)}, ${files.size} files, ${Object.keys(registry.forms()).length} forms, 0 page errors, ${run.seconds.toFixed(0)} s`,
  );
}

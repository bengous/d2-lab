import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type Row = ReadonlyMap<string, string>;

export interface GameCache {
  readonly version: string;
  /** `files/` mirrors the CASC paths; `VERSION`, written last, marks a complete extraction. */
  readonly dir: string;
}

interface LocalizedString {
  readonly Key: string;
  readonly enUS: string;
}

export const repoRoot = join(import.meta.dir, "..", "..", "..");

const kitDir = join(repoRoot, "tools/d2r-data");
const kit = join(kitDir, "extract.sh");

/** Lowercase, apostrophes dropped, every other run of non-alphanumerics becomes `-`, trimmed. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/['’]/gu, "")
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
}

export function required<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(context);
  }

  return value;
}

async function readVersion(install: string): Promise<string> {
  const [header = "", firstRow = ""] = (await Bun.file(join(install, ".build.info")).text()).split(
    /\r?\n/u,
  );

  const column = header.split("|").findIndex((name) => name.startsWith("Version!"));
  const version = firstRow.split("|")[column]?.trim() ?? "";

  if (column === -1 || version === "") {
    throw new Error(`${install}/.build.info: no Version in its first row`);
  }

  return version;
}

async function cachedVersion(dir: string): Promise<string | null> {
  const file = Bun.file(join(dir, "VERSION"));

  return (await file.exists()) ? (await file.text()).trim() : null;
}

export async function run(command: readonly string[]): Promise<void> {
  const child = Bun.spawn([...command], { stdout: "ignore", stderr: "inherit" });
  const exitCode = await child.exited;

  if (exitCode !== 0) {
    throw new Error(`${command[0] ?? ""} exited with ${exitCode}`);
  }
}

async function runKit(install: string, dir: string): Promise<void> {
  const child = Bun.spawn([kit, install, dir], { stdout: "inherit", stderr: "inherit" });
  const exitCode = await child.exited;

  if (exitCode !== 0) {
    throw new Error(`${kit} exited with ${exitCode}`);
  }
}

const paletteMask = String.raw`data:data\global\palette\act1\pal.dat`;

/** The legacy sprite files `extract.sh` leaves out: the act 1 palette and every `chars` COF and DCC. */
const spriteMasks = [paletteMask, String.raw`data:data\global\chars\*`];

/** Extracts the masks through the kit's CASC reader, with the install mounted read-only. */
function extractMasks(masks: readonly string[]) {
  return async (install: string, dir: string): Promise<void> => {
    const casc = join(kitDir, "build/casc-cli");

    if (!existsSync(casc)) {
      await run([join(kitDir, "build.sh")]);
    }

    await run([
      join(kitDir, "ro-run.sh"),
      install,
      casc,
      install,
      "extract",
      join(dir, "files"),
      ...masks,
    ]);

    await Bun.write(join(dir, "VERSION"), `${await readVersion(install)}\n`);
  };
}

/**
 * Reuses `~/.cache/d2r-data/<version><suffix>/` when its `VERSION` matches the install, else
 * extracts it into a fresh directory, renamed into place once complete.
 */
async function cachedExtraction(
  suffix: string,
  extract: (install: string, dir: string) => Promise<void>,
): Promise<GameCache> {
  const install = process.env["D2R_INSTALL"] ?? "";

  if (install === "") {
    throw new Error(
      "D2R_INSTALL must name the Diablo II: Resurrected install, the directory that holds .build.info",
    );
  }

  const version = await readVersion(install);
  const root = join(homedir(), ".cache", "d2r-data");
  const dir = join(root, `${version}${suffix}`);

  if ((await cachedVersion(dir)) === version) {
    return { version, dir };
  }

  if (existsSync(dir)) {
    throw new Error(`${dir} has no VERSION ${version}: remove it, then rerun`);
  }

  await mkdir(root, { recursive: true });

  const fresh = await mkdtemp(join(root, `.${version}${suffix}-`));

  try {
    await extract(install, fresh);
  } catch (error) {
    await rm(fresh, { recursive: true, force: true });

    throw error;
  }

  await rename(fresh, dir);

  return { version, dir };
}

/** The output of `tools/d2r-data/extract.sh`, in `~/.cache/d2r-data/<version>/`. */
export function gameCache(): Promise<GameCache> {
  return cachedExtraction("", runKit);
}

/**
 * The legacy sprite files, in `~/.cache/d2r-data/<version>-sprites/files/`: a cache apart from
 * `gameCache`, so adding them never rebuilds it.
 */
export function spriteCache(): Promise<GameCache> {
  return cachedExtraction("-sprites", extractMasks(spriteMasks));
}

/**
 * The palette and the `monsters` folders of `tokens`, the wereforms and mercenaries, in
 * `~/.cache/d2r-data/<version>-monster-sprites/files/`.
 */
export async function monsterSpriteCache(tokens: readonly string[]): Promise<GameCache> {
  const cache = await cachedExtraction(
    "-monster-sprites",
    extractMasks([
      paletteMask,
      ...tokens.map((token) => `data:data\\global\\monsters\\${token}\\*`),
    ]),
  );

  const missing = tokens.filter(
    (token) => !existsSync(join(cache.dir, "files/data/data/global/monsters", token)),
  );

  if (missing.length > 0) {
    throw new Error(`${cache.dir} lacks the monsters ${missing.join(", ")}: remove it, then rerun`);
  }

  return cache;
}

/** Reads a TSV table and checks that it has every column the caller reads. */
export async function readTable(path: string, columns: readonly string[]): Promise<readonly Row[]> {
  const [header, ...lines] = (await Bun.file(path).text())
    .split(/\r?\n/u)
    .filter((line) => line !== "");

  const names = required(header, `${path}: empty table`).split("\t");
  const missing = columns.filter((column) => !names.includes(column));

  if (missing.length > 0) {
    throw new Error(`${path}: missing columns ${missing.join(", ")}`);
  }

  return lines.map((line) => {
    const cells = line.split("\t");

    return new Map(names.map((name, index) => [name, cells[index] ?? ""]));
  });
}

export function cell(row: Row, column: string): string {
  return required(row.get(column), `row has no column ${column}`);
}

function isLocalizedString(value: unknown): value is LocalizedString {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const fields = new Map(Object.entries(value));

  return typeof fields.get("Key") === "string" && typeof fields.get("enUS") === "string";
}

/** Reads a `local/lng/strings/*.json` file into a map from `Key` to its enUS text. */
export async function readStrings(path: string): Promise<ReadonlyMap<string, string>> {
  const entries: unknown = JSON.parse((await Bun.file(path).text()).replace(/^﻿/u, ""));

  if (!Array.isArray(entries) || !entries.every((entry) => isLocalizedString(entry))) {
    throw new TypeError(`${path}: expected an array of { Key, enUS }`);
  }

  const strings = new Map<string, string>();

  for (const { Key, enUS } of entries) {
    const known = strings.get(Key);

    if (known !== undefined && known !== enUS) {
      throw new Error(`${path}: ${Key} is both "${known}" and "${enUS}"`);
    }

    strings.set(Key, enUS);
  }

  return strings;
}

/** Formats generated files with the repo's oxfmt config, so `bun run check` accepts them. */
export async function formatWithRepoConfig(path: string): Promise<void> {
  const child = Bun.spawn([join(repoRoot, "node_modules/.bin/oxfmt"), path], {
    cwd: repoRoot,
    stdout: "ignore",
    stderr: "pipe",
  });

  const [stderr, exitCode] = await Promise.all([new Response(child.stderr).text(), child.exited]);

  if (exitCode !== 0) {
    throw new Error(`oxfmt exited with ${exitCode}: ${stderr.trim()}`);
  }
}

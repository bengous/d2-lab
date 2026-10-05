/**
 * Compares the TypeScript decoder with OpenDiablo2's Go decoder on every DCC file under a folder:
 * one line per direction, with its box, frame count and the sha256 of its frames. Needs Go and the
 * game files, so it runs by hand, outside `bun test`:
 * `bun run dcc:oracle ~/.cache/d2r-data/<version>-sprites/files/data/data/global/chars`.
 *
 * @module
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { decodeDcc } from "./dcc";

const folder = process.argv[2];

if (folder === undefined) {
  throw new Error("usage: bun tools/d2-dcc/oracle.ts <folder of DCC files>");
}

const paths = (await readdir(folder, { recursive: true }))
  .filter((name) => name.endsWith(".dcc"))
  .toSorted()
  .map((name) => join(folder, name));

async function goLines(): Promise<readonly string[]> {
  const child = Bun.spawn(["go", "run", "."], {
    cwd: join(import.meta.dir, "oracle"),
    stdin: new Blob([`${paths.join("\n")}\n`]),
    stdout: "pipe",
    stderr: "inherit",
  });

  const [text, exitCode] = await Promise.all([new Response(child.stdout).text(), child.exited]);

  if (exitCode !== 0) {
    throw new Error(`the Go oracle exited with ${exitCode}`);
  }

  return text.trimEnd().split("\n");
}

async function typeScriptLines(path: string): Promise<readonly string[]> {
  try {
    const { directions } = decodeDcc(await Bun.file(path).bytes());

    return directions.map(({ box, frames }, index) => {
      const hash = new Bun.CryptoHasher("sha256");

      for (const frame of frames) {
        hash.update(frame);
      }

      return `${path} ${index} ${box.left} ${box.top} ${box.width} ${box.height} ${frames.length} ${hash.digest("hex")}`;
    });
  } catch (error) {
    return [`${path} ERROR ${error instanceof Error ? error.message : String(error)}`];
  }
}

const expected = await goLines();
const actual: string[] = [];

for (const path of paths) {
  // oxlint-disable-next-line no-await-in-loop -- one file at a time keeps the decoded frames of a single file in memory
  actual.push(...(await typeScriptLines(path)));
}

const mismatches = actual.filter((line, index) => line !== expected[index]);

console.log(
  `${paths.length} files, ${actual.length} directions (Go ${expected.length}), ${mismatches.length} mismatches`,
);

for (const line of mismatches.slice(0, 5)) {
  console.log(`  ${line}`);
}

if (mismatches.length > 0 || actual.length !== expected.length) {
  process.exitCode = 1;
}

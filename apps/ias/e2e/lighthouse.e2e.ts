/**
 * Runs Lighthouse, mobile preset, on the page at `SMOKE_URL` with Playwright's Chromium, and fails
 * under a category's floor. Run by CI on the deployed site; `npx` fetches Lighthouse at its pinned
 * version, outside the repo's dependencies.
 *
 * @module
 */
import { join } from "node:path";

import { chromium } from "playwright";

const lighthouseVersion = "13.5.0";

/** Below the scores of the first deploy, performance 0.82 to 0.89 and 1 elsewhere: CI runners vary. */
const floors = {
  performance: 0.7,
  accessibility: 0.95,
  "best-practices": 0.95,
  seo: 0.95,
} as const;

const url = process.env["SMOKE_URL"];

if (url === undefined) {
  throw new Error("SMOKE_URL must name the page to audit");
}

const report = join(process.env["RUNNER_TEMP"] ?? import.meta.dir, "lighthouse.json");

const child = Bun.spawn(
  [
    "npx",
    "--yes",
    `lighthouse@${lighthouseVersion}`,
    url,
    "--quiet",
    "--output=json",
    `--output-path=${report}`,
    `--only-categories=${Object.keys(floors).join(",")}`,
    "--chrome-flags=--headless=new --no-sandbox",
  ],
  { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, stderr: "inherit" },
);

if ((await child.exited) !== 0) {
  throw new Error(`lighthouse exited with ${String(child.exitCode)}`);
}

interface LighthouseReport {
  readonly categories: Readonly<Partial<Record<string, { readonly score: number | null }>>>;
}

/** Lighthouse writes the report: the check guards a failed or foreign run. */
function isReport(body: unknown): body is LighthouseReport {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const categories = new Map<string, unknown>(Object.entries(body)).get("categories");

  return typeof categories === "object" && categories !== null;
}

const body: unknown = await Bun.file(report).json();

if (!isReport(body)) {
  throw new TypeError(`${report} is not a Lighthouse report`);
}

const scores: string[] = [];
const failed: string[] = [];

for (const [name, floor] of Object.entries(floors)) {
  const score = body.categories[name]?.score ?? 0;

  scores.push(`${name} ${String(score)}`);

  if (score < floor) {
    failed.push(`${name} ${String(score)} < ${String(floor)}`);
  }
}

console.log(scores.join(", "));

if (failed.length > 0) {
  throw new Error(`lighthouse under its floors: ${failed.join(", ")}`);
}

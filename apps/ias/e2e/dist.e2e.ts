/**
 * Checks the files of `apps/ias/dist/` before they are published: the gzipped size of the JS and the
 * CSS, the total size, no sourcemap, and the page's Content Security Policy and prerendered page.
 * Run by `bun run e2e` after the build.
 *
 * @module
 */
import { join } from "node:path";

const dist = join(import.meta.dir, "..", "dist");

const files = await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd: dist }));

async function gzippedSize(file: string): Promise<number> {
  return Bun.gzipSync(await Bun.file(join(dist, file)).bytes()).length;
}

async function gzipSize(extension: string): Promise<number> {
  const sizes = await Promise.all(
    files.flatMap((file) => (file.endsWith(extension) ? [gzippedSize(file)] : [])),
  );

  return sizes.reduce((sum, size) => sum + size, 0);
}

/** About 5 % over the sizes measured when the budgets were set: a jump fails, a fix passes. */
const measures = [
  { name: "JS gzip", size: await gzipSize(".js"), budget: 228_000 },
  { name: "CSS gzip", size: await gzipSize(".css"), budget: 16_000 },
  {
    name: "total",
    size: files.reduce((sum, file) => sum + Bun.file(join(dist, file)).size, 0),
    budget: 8_300_000,
  },
] as const;

const overBudget = measures.flatMap(({ name, size, budget }) =>
  size > budget ? [`${name}: ${String(size)} B, over its budget of ${String(budget)} B`] : [],
);

const sourcemaps = files.filter((file) => file.endsWith(".map"));
const index = await Bun.file(join(dist, "index.html")).text();

const problems = [
  ...overBudget,
  ...(sourcemaps.length > 0 ? [`sourcemaps: ${sourcemaps.join(", ")}`] : []),
  ...(index.includes('http-equiv="Content-Security-Policy"') ? [] : ["index.html has no CSP"]),
  ...(index.includes('<div id="root"></div>') ? ["index.html has no prerendered page"] : []),
];

if (problems.length > 0) {
  throw new Error(`dist check failed:\n${problems.join("\n")}`);
}

console.log(
  `dist check passed: ${measures.map(({ name, size }) => `${name} ${String(size)} B`).join(", ")}`,
);

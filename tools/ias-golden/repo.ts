import { join } from "node:path";

export const repoRoot = join(import.meta.dir, "..", "..");

/** Formats generated files with the repo's oxfmt config, so `bun run check` accepts them. */
export async function formatWithRepoConfig(paths: readonly string[]): Promise<void> {
  const child = Bun.spawn([join(repoRoot, "node_modules/.bin/oxfmt"), ...paths], {
    cwd: repoRoot,
    stdout: "ignore",
    stderr: "pipe",
  });

  const [stderr, exitCode] = await Promise.all([new Response(child.stderr).text(), child.exited]);

  if (exitCode !== 0) {
    throw new Error(`oxfmt exited with ${exitCode}: ${stderr.trim()}`);
  }
}

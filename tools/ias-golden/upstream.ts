import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";

export const UPSTREAM_REPOSITORY = "https://github.com/Warren1001/IAS_Calculator";

export const UPSTREAM_SHA = "bcc112d4b6d41a646f6abc6751daf78752157e40";

export interface OriginalSite {
  readonly indexUrl: string;
}

async function git(cwd: string, args: readonly string[]): Promise<string> {
  const child = Bun.spawn(["git", ...args], {
    cwd,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} exited with ${exitCode}: ${stderr.trim()}`);
  }

  return stdout.trim();
}

async function checkoutUpstream(directory: string): Promise<void> {
  await git(directory, ["init", "--quiet"]);
  await git(directory, ["fetch", "--quiet", "--depth", "1", UPSTREAM_REPOSITORY, UPSTREAM_SHA]);
  await git(directory, ["checkout", "--quiet", "--detach", "FETCH_HEAD"]);

  const head = await git(directory, ["rev-parse", "HEAD"]);

  if (head !== UPSTREAM_SHA) {
    throw new Error(`the checkout of Warren's calculator is at ${head}, expected ${UPSTREAM_SHA}`);
  }
}

async function serveFile(root: string, pathname: string): Promise<Response> {
  const path = normalize(join(root, decodeURIComponent(pathname)));
  const file = Bun.file(path);

  if (!path.startsWith(`${root}/`) || !(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(file, {
    headers: { "cache-control": "public, max-age=31536000, immutable" },
  });
}

/**
 * Clones Warren's calculator at `UPSTREAM_SHA` into a fresh temporary directory, serves it on
 * 127.0.0.1 for the duration of `run`, then removes the directory.
 */
export async function withOriginalSite<T>(run: (site: OriginalSite) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), "ias-original-"));

  try {
    await checkoutUpstream(root);

    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Bun.serve passes a Request, whose DOM members are mutable
      fetch: (request) => serveFile(root, new URL(request.url).pathname),
    });

    try {
      return await run({ indexUrl: new URL("/index.html", server.url).href });
    } finally {
      await server.stop(true);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/**
 * The calculator a browser test opens: `apps/ias/dist/` served under `/d2-lab/`, the path GitHub
 * Pages serves it under, or the page at `SMOKE_URL` when set.
 *
 * @module
 */
import { join, normalize } from "node:path";

const dist = join(import.meta.dir, "..", "dist");

const basePath = "/d2-lab/";

/** The calculator under test: its page URL, which ends with a slash. */
export interface Site {
  readonly url: string;
  readonly stop: () => Promise<void>;
}

/** Serves `dist/` under `basePath` only, so a URL that escapes the prefix fails as it would on Pages. */
function serveDist(): Site {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Bun.serve passes a Request, whose DOM members are mutable
    async fetch(request) {
      const { pathname } = new URL(request.url);
      const relative = decodeURIComponent(pathname.slice(basePath.length));
      const path = normalize(join(dist, relative === "" ? "index.html" : relative));
      const file = Bun.file(path);

      return pathname.startsWith(basePath) && path.startsWith(`${dist}/`) && (await file.exists())
        ? new Response(file)
        : new Response("Not Found", { status: 404 });
    },
  });

  return { url: new URL(basePath, server.url).href, stop: () => server.stop(true) };
}

export function openSite(): Site {
  const url = process.env["SMOKE_URL"];

  return url === undefined ? serveDist() : { url, stop: () => Promise.resolve() };
}

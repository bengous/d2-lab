import index from "./index.html";
import theme from "./theme.html";

const appDir = import.meta.dir;

const repoRoot = `${appDir}/../..`;

const publicDir = `${appDir}/public`;

const origin = "http://localhost:3000";

const statusPath = "/__dev";

const stopTimeoutMs = 5000;

/**
 * The inputs whose change a running server does not pick up. Bun's dev server resolves a `@/` import
 * of a file created after its start as missing, and its HMR ignores the server script and the config files.
 */
const restartInputs = [
  import.meta.path,
  `${appDir}/package.json`,
  `${appDir}/tsconfig.json`,
  `${repoRoot}/package.json`,
  `${repoRoot}/tsconfig.base.json`,
  `${repoRoot}/bunfig.toml`,
  `${repoRoot}/bun.lock`,
];

interface DevStatus {
  readonly appDir: string;
  readonly pid: number;
  readonly fingerprint: string;
}

async function fingerprint(): Promise<string> {
  const sources = await Array.fromAsync(new Bun.Glob("src/**").scan({ cwd: appDir }));
  const configs = await Promise.all(restartInputs.map((path) => Bun.file(path).text()));

  return Bun.hash([...sources.toSorted(), ...configs].join("\n")).toString(16);
}

function hasCode(error: Readonly<Error>, code: string): boolean {
  return new Map(Object.entries(error)).get("code") === code;
}

function isDevStatus(body: unknown): body is DevStatus {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const fields = new Map(Object.entries(body));

  return (
    typeof fields.get("appDir") === "string" &&
    typeof fields.get("pid") === "number" &&
    typeof fields.get("fingerprint") === "string"
  );
}

async function runningStatus(): Promise<DevStatus | undefined> {
  const response = await fetch(`${origin}${statusPath}`, {
    signal: AbortSignal.timeout(2000),
  }).catch((error: Readonly<Error>) => {
    if (!hasCode(error, "ConnectionRefused")) {
      throw new Error(`${origin} does not answer: stop the process that holds its port`, {
        cause: error,
      });
    }
  });

  if (response === undefined) {
    return undefined;
  }

  const body: unknown = response.ok ? await response.json() : null;

  if (!isDevStatus(body)) {
    throw new Error(`${origin} serves another app: stop it to start the IAS dev server`);
  }

  return body;
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);

    return true;
  } catch (error) {
    if (error instanceof Error && hasCode(error, "ESRCH")) {
      return false;
    }

    throw error;
  }
}

async function stop(pid: number): Promise<void> {
  process.kill(pid, "SIGTERM");

  const deadline = Date.now() + stopTimeoutMs;

  while (isAlive(pid)) {
    if (Date.now() > deadline) {
      throw new Error(`the dev server ${pid} did not stop within ${stopTimeoutMs} ms`);
    }

    // oxlint-disable-next-line no-await-in-loop -- waits between two polls
    await Bun.sleep(100);
  }
}

function serve(currentFingerprint: string): void {
  const status: DevStatus = { appDir, pid: process.pid, fingerprint: currentFingerprint };
  const server = Bun.serve({
    port: new URL(origin).port,
    routes: {
      "/": index,
      "/theme": theme,
      [statusPath]: Response.json(status),
    },
    development: {
      hmr: true,
      console: true,
    },
    // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Bun.serve passes a Request, whose DOM members are mutable
    async fetch(request) {
      const file = Bun.file(`${publicDir}${new URL(request.url).pathname}`);

      return (await file.exists())
        ? new Response(file)
        : new Response("Not Found", { status: 404 });
    },
  });

  console.log(`IAS Calculator dev server: ${server.url.href}`);
}

const [running, current] = await Promise.all([runningStatus(), fingerprint()]);

if (running === undefined) {
  serve(current);
} else if (running.appDir !== appDir) {
  throw new Error(`${origin} serves the IAS dev server of ${running.appDir}: stop it first`);
} else if (running.fingerprint === current) {
  console.log(`IAS Calculator dev server already runs, HMR applies the changes: ${origin}/`);
} else {
  console.log(
    `A source file was added or removed, or a config changed: restarting the dev server ${running.pid}`,
  );

  await stop(running.pid);
  serve(current);
}

import { join } from "node:path";

import type { Browser, Page } from "playwright";

import { type OriginalConstants, readOriginalConstants } from "./original-constants";
import type { Baseline, PathRequest, PathResponse } from "./original-form";

/** Pages of Warren's calculator; each use navigates its page afresh. */
export interface PagePool {
  readonly readBaseline: () => Promise<Baseline>;
  readonly readConstants: () => Promise<OriginalConstants>;
  readonly runPath: (label: string, request: PathRequest) => Promise<PathResponse>;
  /** Throws if any page recorded a console error or warning, a page error or a failed request. */
  readonly checkErrors: () => void;
  readonly close: () => Promise<void>;
}

interface Lease {
  readonly page: Page;
  readonly release: () => void;
}

type LeasePage = (label: string) => Promise<Lease>;

interface Queue<T> {
  readonly take: () => Promise<T>;
  readonly give: (item: T) => void;
}

async function bundleInPageApi(): Promise<string> {
  const build = await Bun.build({
    entrypoints: [join(import.meta.dir, "in-page.ts")],
    target: "browser",
    format: "iife",
  });

  const [bundle] = build.outputs;

  if (!build.success || bundle === undefined) {
    throw new Error(`cannot bundle in-page.ts: ${build.logs.map(String).join("\n")}`);
  }

  return bundle.text();
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Playwright's Page is a mutable class
function watchErrors(page: Page, errors: string[], label: () => string): void {
  page.on("console", (message) => {
    if (["error", "warning", "assert"].includes(message.type())) {
      errors.push(`${label()}: console.${message.type()}: ${message.text()}`);
    }
  });

  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Playwright passes a mutable Error
  page.on("pageerror", (error) => {
    errors.push(`${label()}: page error: ${error.stack ?? error.message}`);
  });

  page.on("requestfailed", (request) => {
    errors.push(`${label()}: request failed: ${request.url()}`);
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`${label()}: HTTP ${response.status()} for ${response.url()}`);
    }
  });
}

function throwOnPageErrors(errors: readonly string[]): void {
  if (errors.length > 0) {
    throw new Error(`Warren's calculator reported ${errors.length} errors:\n${errors.join("\n")}`);
  }
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Playwright's Browser is a mutable class
async function openPage(browser: Browser, inPageApi: string): Promise<Page> {
  const context = await browser.newContext();

  await context.addInitScript(() => {
    console.log = () => {};
  });

  await context.addInitScript({ content: inPageApi });

  return context.newPage();
}

/** Hands out the items; a caller waits while every item is taken. */
function createQueue<T>(items: readonly T[]): Queue<T> {
  const idle = [...items];
  const waiting: ((item: T) => void)[] = [];

  return {
    take: () => {
      const item = idle.pop();

      return item === undefined
        ? new Promise((resolve) => {
            waiting.push(resolve);
          })
        : Promise.resolve(item);
    },
    give: (item) => {
      const next = waiting.pop();

      if (next === undefined) {
        idle.push(item);
      } else {
        next(item);
      }
    },
  };
}

async function readBaselineIn(lease: LeasePage): Promise<Baseline> {
  const { page, release } = await lease("baseline");

  try {
    return await page.evaluate(() => {
      if (window.iasGolden === undefined) {
        throw new Error("the in-page API is not installed");
      }

      return window.iasGolden.readBaseline();
    });
  } finally {
    release();
  }
}

async function readConstantsIn(lease: LeasePage): Promise<OriginalConstants> {
  const { page, release } = await lease("constants");

  try {
    return await readOriginalConstants(page);
  } finally {
    release();
  }
}

async function runPathIn(
  lease: LeasePage,
  errors: readonly string[],
  label: string,
  request: PathRequest,
): Promise<PathResponse> {
  const { page, release } = await lease(label);

  try {
    const response = await page.evaluate((pathRequest: PathRequest) => {
      if (window.iasGolden === undefined) {
        throw new Error("the in-page API is not installed");
      }

      return window.iasGolden.runPath(pathRequest);
    }, request);

    throwOnPageErrors(errors);

    return response;
  } finally {
    release();
  }
}

/**
 * Opens `size` browser contexts with one page each, with the in-page API installed. `console.log`
 * is neutralized because constants.js:2 sets `debug = true` and every render logs.
 */
export async function openPagePool(
  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Playwright's Browser is a mutable class
  browser: Browser,
  indexUrl: string,
  size: number,
): Promise<PagePool> {
  const inPageApi = await bundleInPageApi();
  const pages = await Promise.all(Array.from({ length: size }, () => openPage(browser, inPageApi)));
  const labels = new Map<Page, string>();
  const errors: string[] = [];
  const queue = createQueue(pages);

  for (const page of pages) {
    watchErrors(page, errors, () => labels.get(page) ?? "idle");
  }

  const lease: LeasePage = async (label) => {
    const page = await queue.take();

    labels.set(page, label);
    await page.goto(indexUrl);

    return {
      page,
      release: () => {
        queue.give(page);
      },
    };
  };

  return {
    readBaseline: () => readBaselineIn(lease),
    readConstants: () => readConstantsIn(lease),
    runPath: (label, request) => runPathIn(lease, errors, label, request),
    checkErrors: () => {
      throwOnPageErrors(errors);
    },
    close: async () => {
      const closing: Promise<void>[] = [];

      for (const page of pages) {
        closing.push(page.context().close());
      }

      await Promise.all(closing);
    },
  };
}

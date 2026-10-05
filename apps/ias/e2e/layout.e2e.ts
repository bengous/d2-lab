/**
 * Browser layout and accessibility test of the built calculator. At phone, tablet and desktop
 * widths in Chromium, it opens builds whose content runs widest, then the default build with a
 * panel, a list or a view open, and fails on any problem of `findLayoutProblems` or any axe-core
 * violation. `HEADED=1` shows the browser, slowed down, with each element at fault outlined in red.
 * Run by `bun run e2e` after the build.
 *
 * @module
 */
import AxeBuilder from "@axe-core/playwright";
import { type Browser, chromium, type Page } from "playwright";

import { findLayoutProblems } from "./layout-checks";
import { openSite, type Site } from "./site";

const widths = [390, 768, 1024, 1440] as const;

/** Text closer than this to a border or a line touches it. */
const touchPx = 2;

const headed = process.env["HEADED"] === "1";

/** The part of a Playwright page the test uses, read-only for the linter's sake. */
interface LayoutPage {
  readonly goto: Page["goto"];
  readonly getByRole: Page["getByRole"];
  readonly evaluate: Page["evaluate"];
}

interface View {
  readonly name: string;
  readonly query: string;
  /** Opens what the view checks, once the build shows. */
  readonly open?: (page: LayoutPage) => Promise<void>;
  /** Narrows the axe-core run of a view whose open state hides the page behind it. */
  readonly axe?: {
    /** The only element axe checks. */
    readonly include: string;
    readonly disabledRules: readonly string[];
  };
}

const views: readonly View[] = [
  { name: "the default build", query: "" },
  { name: "Zeal under the Passion floor", query: "?v=1&class=amazon&skill=zeal" },
  {
    name: "a dual-wielding Barbarian",
    query:
      "?v=1&class=barbarian&skill=frenzy&weapon=phase-blade&offhand=phase-blade&table=primary-wias&frenzy=1",
  },
  { name: "an Assassin with claws", query: "?v=1&class=assassin&weapon=suwayyah&offhand=suwayyah" },
  { name: "a Werebear Druid", query: "?v=1&class=druid&form=werebear" },
  {
    name: "the skill names toggled",
    query: "",
    open: async (page) => {
      await page.getByRole("checkbox", { name: "Show names", exact: true }).click();
    },
  },
  {
    name: "the PvP slows open",
    query: "",
    open: async (page) => {
      await page.getByRole("button", { name: "PvP slows" }).click();
    },
  },
  {
    name: "the weapon list open",
    query: "",
    open: async (page) => {
      await page.getByRole("combobox", { name: "Weapon", exact: true }).click();
      await page.getByRole("listbox").waitFor();
    },
    /**
     * Base UI opens the list as a modal: it traps the focus and hides the page from screen readers,
     * so axe checks the list alone, and the list's portal sits outside every landmark.
     */
    axe: { include: '[data-slot="combobox-content"]', disabledRules: ["region"] },
  },
  {
    name: "the attack open",
    query: "?v=1&class=paladin&weapon=phase-blade&current=20",
    open: async (page) => {
      await page.getByRole("button", { name: "Watch the attack", exact: true }).click();
      await page
        .getByRole("img", { name: "Paladin attacking at the current breakpoint" })
        .waitFor();
    },
  },
];

/** Frames the page gets to stop animating before a view's checks run. */
const settleFrames = 120;

/**
 * In the page: resolves once a whole frame passes with no finite animation running. A scroll can
 * start one a frame late, such as the navbar's crossfade between "Tools" and the tool's name.
 */
async function settle(frames: number): Promise<void> {
  await document.fonts.ready;

  for (let frame = 0; frame < frames; frame += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each round waits for the frame after the previous one
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    const running = document.getAnimations().filter(
      // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a DOM Animation, whose members are mutable
      (animation) =>
        animation.playState === "running" &&
        animation.effect?.getComputedTiming().endTime !== Infinity,
    );

    if (running.length === 0) {
      return;
    }

    // oxlint-disable-next-line no-await-in-loop, typescript/prefer-readonly-parameter-types -- waits for this frame's animations before the next frame; a DOM Animation is mutable
    await Promise.all(running.map((animation) => animation.finished));
  }

  throw new Error(`the page still animates after ${String(frames)} frames`);
}

async function openView(page: LayoutPage, site: Site, view: View): Promise<void> {
  await page.goto(`${site.url}${view.query}`);
  await page.getByRole("region", { name: "Breakpoints", exact: true }).waitFor();
  await view.open?.(page);
  await page.evaluate(settle, settleFrames);
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- AxeBuilder takes Playwright's Page, whose members are mutable
async function axeViolations(page: Page, view: View): Promise<readonly string[]> {
  const builder =
    view.axe === undefined
      ? new AxeBuilder({ page })
      : new AxeBuilder({ page })
          .include(view.axe.include)
          .disableRules([...view.axe.disabledRules]);

  const { violations } = await builder.analyze();
  const found: string[] = [];

  for (const violation of violations) {
    const targets: string[] = [];

    for (const node of violation.nodes) {
      targets.push(node.target.join(" "));
    }

    found.push(`axe ${violation.id}: ${violation.help} (${targets.join(", ")})`);
  }

  return found;
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- AxeBuilder takes Playwright's Page, whose members are mutable
async function checkView(page: Page, site: Site, view: View): Promise<readonly string[]> {
  await openView(page, site, view);

  const layout = await page.evaluate(findLayoutProblems, { outline: headed, touchPx });
  const problems = [...layout, ...(await axeViolations(page, view))];

  if (headed) {
    await page.waitForTimeout(problems.length > 0 ? 3000 : 600);
  }

  return problems;
}

async function checkWidth(browser: Browser, site: Site, width: number): Promise<readonly string[]> {
  const problems: string[] = [];
  const context = await browser.newContext({ viewport: { width, height: 900 } });

  try {
    const page = await context.newPage();

    for (const view of views) {
      // oxlint-disable-next-line no-await-in-loop -- the views share one page and open one after the other
      const found = await checkView(page, site, view);

      problems.push(...found.map((problem) => `${String(width)} px, ${view.name}: ${problem}`));
    }
  } finally {
    await context.close();
  }

  return problems;
}

async function checkWidths(site: Site): Promise<readonly string[]> {
  const problems: string[] = [];
  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 150 : 0 });

  try {
    for (const width of widths) {
      // oxlint-disable-next-line no-await-in-loop -- widths share one browser and run one after the other
      problems.push(...(await checkWidth(browser, site, width)));
    }
  } finally {
    await browser.close();
  }

  return problems;
}

const site = openSite();
let problems: readonly string[] = [];

try {
  problems = await checkWidths(site);
} finally {
  await site.stop();
}

if (problems.length > 0) {
  throw new Error(`layout test failed:\n${problems.join("\n")}`);
}

console.log(
  `layout test passed on ${site.url}: ${String(views.length)} views at ${widths.join(", ")} px`,
);

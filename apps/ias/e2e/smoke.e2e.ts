/**
 * Browser smoke test of the built calculator: serves `apps/ias/dist/` under `/d2-lab/`, the path
 * GitHub Pages serves it under, or opens `SMOKE_URL` when set, and, in Chromium, picks the
 * reference Smite build through the UI, opens it from a share link, opens an invalid link, copies the link of a
 * build, and unfolds the attack of a build. Run by `bun run e2e` after the build, and by CI on the
 * deployed site.
 *
 * @module
 */
import { type Browser, chromium, type Locator, type Page } from "playwright";

import { openSite, type Site } from "./site";

const timeoutMs = 10_000;

const expected = {
  now: "Now: 8 frames 3.13 attacks per second at 20 IAS",
  next: "Next breakpoint: 7 frames 3.57 attacks per second at 24 IAS (+4)",
} as const;

const smiteQuery = "?v=1&class=paladin&skill=smite&weapon=phase-blade&current=20";

const attackQuery = "?v=1&class=paladin&weapon=phase-blade&current=20";

function flatText(text: string): string {
  return text.replaceAll(/\s+/gu, " ").trim();
}

/** Polls the text until it matches, because React renders after the input event. */
async function expectText(locator: Locator, text: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let seen = "";

  while (Date.now() < deadline) {
    // oxlint-disable-next-line no-await-in-loop -- each poll must read the page after the previous one
    seen = flatText(await locator.innerText());

    if (seen === text) {
      return;
    }

    // oxlint-disable-next-line no-await-in-loop -- waits between two polls
    await Bun.sleep(50);
  }

  throw new Error(`expected "${text}", the page shows "${seen}"`);
}

/** The part of a Playwright page the scenarios use, read-only for the linter's sake. */
interface ScenarioPage {
  readonly goto: Page["goto"];
  readonly getByRole: Page["getByRole"];
  readonly getByLabel: Page["getByLabel"];
  readonly evaluate: Page["evaluate"];
}

/** Reads the two summary tiles, which show the reference Smite build at 20 IAS. */
async function expectSmiteTiles(page: ScenarioPage): Promise<void> {
  const tiles = page.getByRole("region", { name: "Breakpoints", exact: true });

  await expectText(tiles.getByText("Now:", { exact: true }).locator(".."), expected.now);
  await expectText(
    tiles.getByText("Next breakpoint:", { exact: true }).locator(".."),
    expected.next,
  );
}

/** Picks Paladin, Smite, Phase Blade and 20 IAS, then reads the tiles. */
async function pickSmiteBuild(page: ScenarioPage): Promise<void> {
  await page.getByRole("radio", { name: "Paladin", exact: true }).click();
  await page.getByRole("radio", { name: "Smite", exact: true }).click();
  await page.getByRole("combobox", { name: "Weapon", exact: true }).fill("Phase Blade");
  await page.getByRole("option", { name: "Phase Blade, Elite", exact: true }).click();
  await page.getByLabel("Your IAS", { exact: true }).fill("20");
  await expectSmiteTiles(page);
}

async function openSmiteFromLink(page: ScenarioPage, site: Site): Promise<void> {
  await page.goto(`${site.url}${smiteQuery}`);
  await expectSmiteTiles(page);

  const alerts = await page.getByRole("alert").count();

  if (alerts > 0) {
    throw new Error(`a valid link shows ${String(alerts)} alert(s)`);
  }
}

async function openInvalidLink(page: ScenarioPage, site: Site): Promise<void> {
  await page.goto(`${site.url}?v=1&class=nope`);

  const alert = page.getByRole("alert");

  await expectText(alert, 'Unknown value "nope" for "class" The default build is loaded instead.');

  if (!(await page.getByRole("radio", { name: "Amazon", exact: true }).isChecked())) {
    throw new Error("an invalid link does not load the default build: Amazon is not selected");
  }

  await alert.getByRole("button", { name: "Dismiss", exact: true }).click();
  await alert.waitFor({ state: "detached" });
}

async function copyLinkOfBuild(page: ScenarioPage, site: Site): Promise<void> {
  await page.goto(site.url);
  await pickSmiteBuild(page);
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await page.getByRole("button", { name: "Copied", exact: true }).waitFor();

  const copied = await page.evaluate(() => navigator.clipboard.readText());

  if (copied !== `${site.url}${smiteQuery}`) {
    throw new Error(`the clipboard holds "${copied}", expected "${site.url}${smiteQuery}"`);
  }
}

/** Unfolds the Paladin's attack at 20 IAS: its sentence, then its animation. */
async function watchAttack(page: ScenarioPage, site: Site): Promise<void> {
  await page.goto(`${site.url}${attackQuery}`);
  await page.getByRole("button", { name: "Watch the attack", exact: true }).click();

  const hide = page.getByRole("button", { name: "Hide the attack", exact: true });
  const section = page.getByRole("region", { name: "The attack", exact: true });

  if ((await hide.getAttribute("aria-expanded")) !== "true") {
    throw new Error("the attack button does not say that the section is open");
  }

  await expectText(
    section.getByText("Your attack takes", { exact: false }).locator(".."),
    "Your attack takes 10 frames: 0.40 seconds. The hit lands on frame 6.",
  );

  await section.getByRole("img", { name: "Paladin attacking at the current breakpoint" }).waitFor();

  await hide.click();
  await section.waitFor({ state: "detached" });
}

interface Scenario {
  readonly name: string;
  readonly run: (page: ScenarioPage, site: Site) => Promise<void>;
}

const scenarios: readonly Scenario[] = [
  {
    name: "pick the Smite build in the UI",
    run: async (page, site) => {
      await page.goto(site.url);
      await pickSmiteBuild(page);
    },
  },
  { name: "open the Smite build from its link", run: openSmiteFromLink },
  { name: "open an invalid link", run: openInvalidLink },
  { name: "copy the link of the Smite build", run: copyLinkOfBuild },
  { name: "watch the attack of the Paladin", run: watchAttack },
];

/**
 * Runs a scenario in a fresh page with the clipboard granted; returns every console or page error,
 * and every response of status 400 or more.
 */
async function runScenario(
  browser: Browser,
  site: Site,
  scenario: Scenario,
): Promise<readonly string[]> {
  const problems: string[] = [];
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });

  try {
    const page = await context.newPage();

    page.setDefaultTimeout(timeoutMs);

    page.on("console", (message) => {
      if (message.type() === "error") {
        problems.push(`${scenario.name}: console error: ${message.text()}`);
      }
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        problems.push(`${scenario.name}: ${String(response.status())} ${response.url()}`);
      }
    });

    // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Playwright passes a mutable Error
    page.on("pageerror", (error) => {
      problems.push(`${scenario.name}: page error: ${error.message}`);
    });

    await scenario.run(page, site);
  } finally {
    await context.close();
  }

  return problems;
}

async function runScenarios(site: Site): Promise<readonly string[]> {
  const problems: string[] = [];
  const browser = await chromium.launch();

  try {
    for (const scenario of scenarios) {
      // oxlint-disable-next-line no-await-in-loop -- scenarios share one site and one browser, and run one after the other
      problems.push(...(await runScenario(browser, site, scenario)));
    }
  } finally {
    await browser.close();
  }

  return problems;
}

const site = openSite();
let problems: readonly string[] = [];

try {
  problems = await runScenarios(site);
} finally {
  await site.stop();
}

if (problems.length > 0) {
  throw new Error(`smoke test failed:\n${problems.join("\n")}`);
}

console.log(
  `smoke test passed on ${site.url}: ${String(scenarios.length)} scenarios, "${expected.now}", "${expected.next}"`,
);

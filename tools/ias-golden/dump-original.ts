import { join } from "node:path";

import { chromium } from "playwright";

import { type OriginalConstants, readOriginalConstants } from "./original-constants";
import { formatWithRepoConfig, repoRoot } from "./repo";
import { UPSTREAM_SHA, withOriginalSite } from "./upstream";

interface OriginalConstantsFixture extends OriginalConstants {
  readonly upstreamSha: string;
}

const fixturePath = join(repoRoot, "apps/ias/test/fixtures/original-constants.json");

const constants = await withOriginalSite(async (site) => {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();

    await page.goto(site.indexUrl);

    return await readOriginalConstants(page);
  } finally {
    await browser.close();
  }
});

const fixture: OriginalConstantsFixture = {
  upstreamSha: UPSTREAM_SHA,
  weapons: constants.weapons,
  frames: constants.frames,
};

await Bun.write(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);

await formatWithRepoConfig([fixturePath]);

const frameKeys = Object.values(fixture.frames).reduce(
  (count, characters) => count + Object.keys(characters).length,
  0,
);

console.log(
  `${fixturePath}: ${fixture.weapons.length} weapons, ${Object.keys(fixture.frames).length} weapon types, ${frameKeys} frame entries`,
);

import { expect, test } from "bun:test";

import { walkthroughPath, walkthroughScript } from "../scripts/map-walkthrough";

test("the walkthrough of docs/map matches the engine: run bun run map:walkthrough", async () => {
  expect(await Bun.file(walkthroughPath).text()).toBe(await walkthroughScript());
});

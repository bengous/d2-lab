import { expect, test } from "bun:test";

import { originalInitialState } from "@/data/rules/default-build";
import { defaultBuild } from "@/engine/default-build";
import { normalize } from "@/engine/normalize";

import { buildOf } from "./builds";

test("the default build is Warren's calculator after a fresh load, on the IAS table", () => {
  expect(defaultBuild).toEqual(buildOf());
});

test("the default build is the normalized original initial state", () => {
  expect(defaultBuild).toEqual(normalize(originalInitialState.build));
  expect(originalInitialState.source).toContain("@bcc112d");
});

test("the default build holds no checked box", () => {
  expect([
    defaultBuild.oneHanded,
    defaultBuild.speed.markOfTheBear,
    defaultBuild.slows.decrepify,
    defaultBuild.slows.chilled,
    defaultBuild.slows.lethargy,
  ]).toEqual([false, false, false, false, false]);
});

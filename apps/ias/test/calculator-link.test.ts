import { expect, test } from "bun:test";

import { defaultBuild } from "@/engine/default-build";
import { loadLink } from "@/ui/screens/calculator-state";

import { buildOf } from "./builds";

test("an empty search loads the default build without an error", () => {
  expect(loadLink("")).toEqual({ raw: defaultBuild, linkError: null });
});

test("a valid link loads its build", () => {
  const loaded = loadLink("?v=1&class=paladin&skill=smite&weapon=phase-blade&current=20");

  expect(loaded).toEqual({
    raw: buildOf({ character: "paladin", skill: "smite", primary: "phase-blade", current: 20 }),
    linkError: null,
  });
});

test("an invalid link loads the default build and keeps the error", () => {
  expect(loadLink("?v=1&class=nope")).toEqual({
    raw: defaultBuild,
    linkError: { kind: "unknown-value", param: "class", value: "nope" },
  });
});

test("a link without a version is invalid, not empty", () => {
  expect(loadLink("?class=paladin").linkError).toEqual({
    kind: "unsupported-version",
    version: "",
  });
});

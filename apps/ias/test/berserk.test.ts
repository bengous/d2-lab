import { expect, test } from "bun:test";

import { shieldGraphics } from "@/data/rules/sprites";
import { attackTimeline } from "@/engine/animation";
import { computeTables } from "@/engine/compute-tables";
import { normalize } from "@/engine/normalize";
import { parseShareLink } from "@/share-link/parse";

import { buildOf, type BuildChanges } from "./builds";
import { loaded } from "./share-link";

function tablesOf(changes: BuildChanges): ReturnType<typeof computeTables>["tables"] {
  return computeTables(normalize(buildOf(changes))).tables;
}

test.each([
  ["paladin", "phase-blade"],
  ["amazon", "phase-blade"],
  ["sorceress", "war-pike"],
  ["necromancer", "great-maul"],
] as const)(
  "the %s's Berserk through Passion swings as its Standard attack with a %s",
  (character, primary) => {
    const berserk = tablesOf({ character, skill: "berserk", primary });

    expect(berserk).toEqual(tablesOf({ character, skill: "standard", primary }));
  },
);

test("the attack view plays a Paladin's Berserk", () => {
  const build = normalize(
    buildOf({ character: "paladin", skill: "berserk", primary: "phase-blade" }),
  );

  expect(attackTimeline(build, null, shieldGraphics.start).kind).toBe("timeline");
});

test("a link names a Paladin's Berserk", () => {
  expect(parseShareLink("?v=1&class=paladin&skill=berserk&weapon=phase-blade&current=25")).toEqual(
    loaded({ character: "paladin", skill: "berserk", primary: "phase-blade", current: 25 }),
  );
});

import { expect, test } from "bun:test";

import { calculatorView } from "@/ui/screens/calculator-state";

import { buildOf } from "./builds";

test("locates the reference Smite build at 20 IAS", () => {
  const view = calculatorView(
    buildOf({ character: "paladin", skill: "smite", primary: "phase-blade", current: 20 }),
  );

  expect(view.primary.position).toEqual({
    now: { value: 5, frames: "8", hits: [8], rollback: null },
    next: { value: 24, frames: "7", hits: [7], rollback: null },
  });
});

test("summarizes the merged table of a dual-wielded Whirlwind", () => {
  const view = calculatorView(
    buildOf({
      character: "barbarian",
      skill: "whirlwind",
      primary: "phase-blade",
      secondary: "crystal-sword",
    }),
  );

  expect(view.tables.map(({ table }) => table.role)).toEqual(["main", "off-hand", "merged"]);
  expect(view.primary.table.role).toBe("merged");
});

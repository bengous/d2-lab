import { expect, test } from "bun:test";

import type { Build } from "@/contracts/build";
import { applyEdit, type BuildEdit } from "@/ui/screens/build-edit";
import { calculatorView } from "@/ui/screens/calculator-state";

import { buildOf, weaponId } from "./builds";

/** The raw state after each edit, each made on the view of the state before it. */
function edited(raw: Build, ...edits: readonly BuildEdit[]): Build {
  return edits.reduce((state, edit) => applyEdit(state, calculatorView(state), edit), raw);
}

test("gives the off-hand weapon back when the primary weapon opens the off hand again", () => {
  const dual = buildOf({
    character: "barbarian",
    primary: "phase-blade",
    secondary: "crystal-sword",
  });

  const onStaff = edited(dual, {
    kind: "build",
    field: "primary",
    value: weaponId("ancient-axe"),
  });

  expect(calculatorView(onStaff).inputs.fields.has("secondary")).toBe(false);

  const back = edited(onStaff, { kind: "build", field: "primary", value: weaponId("phase-blade") });

  expect(calculatorView(back).build.secondary).toBe(weaponId("crystal-sword"));
});

test("shows a table variable the class no longer offers as IAS, with the IAS the player typed", () => {
  const assassin = buildOf({
    character: "assassin",
    tableVariable: "burst-of-speed",
    current: 12,
    speed: { ias: 30 },
  });

  const paladin = calculatorView(
    edited(assassin, { kind: "build", field: "character", value: "paladin" }),
  );

  expect([paladin.build.tableVariable, paladin.build.current]).toEqual(["ias", 30]);
  expect(paladin.unraised.speed.burstOfSpeed).toBe(12);
  expect(paladin.build.speed.burstOfSpeed).toBe(1);
});

test("keeps the raw skill when the table variable changes", () => {
  const raw = buildOf({ character: "sorceress", skill: "smite" });

  expect(edited(raw, { kind: "table-variable", variable: "eias" }).skill).toBe(raw.skill);
});

test("shows a werebear Paladin's Fanaticism at the Beast floor, and gives the typed value back", () => {
  const raw = buildOf({ character: "paladin", speed: { fanaticism: 0 } });
  const bear = edited(raw, { kind: "build", field: "wereform", value: "werebear" });
  const shown = calculatorView(bear).build;

  expect([shown.speed.fanaticism, shown.current]).toEqual([9, 40]);

  const back = edited(bear, { kind: "build", field: "wereform", value: "none" });

  expect([back.speed.fanaticism, back.current]).toEqual([0, 0]);
});

test("keeps a value the player sets, even at the floor, once the build leaves it", () => {
  const raw = buildOf({ character: "paladin", wereform: "werebear" });
  const above = edited(raw, { kind: "speed", field: "fanaticism", value: 12 });
  const atFloor = edited(raw, { kind: "speed", field: "fanaticism", value: 9 });
  const leave: BuildEdit = { kind: "build", field: "wereform", value: "none" };

  expect(calculatorView(above).build.speed.fanaticism).toBe(12);
  expect(edited(atFloor, leave).speed.fanaticism).toBe(9);
});

test("switches the table variable without keeping a raised value", () => {
  const raw = buildOf({ character: "paladin", wereform: "werebear" });
  const onFanaticism = edited(raw, { kind: "table-variable", variable: "fanaticism" });

  expect(onFanaticism.speed).toMatchObject({ ias: 0, fanaticism: 0 });
  expect(calculatorView(onFanaticism).build).toMatchObject({ current: 9, speed: { ias: 40 } });
});

test("edits a slow", () => {
  expect(edited(buildOf(), { kind: "slows", field: "chilled", value: true }).slows.chilled).toBe(
    true,
  );
});

import { expect, test } from "bun:test";

import { withTableVariable } from "@/engine/with-table-variable";

import { buildOf } from "./builds";

test("keeps the Fanaticism level when Fanaticism becomes and stops being the table variable", () => {
  const onIas = buildOf({ character: "paladin", current: 20, speed: { fanaticism: 17 } });
  const onFanaticism = withTableVariable(onIas, "fanaticism");

  expect(onFanaticism.tableVariable).toBe("fanaticism");
  expect(onFanaticism.current).toBe(17);
  expect(onFanaticism.speed.ias).toBe(20);

  const back = withTableVariable(onFanaticism, "ias");

  expect(back.tableVariable).toBe("ias");
  expect(back.current).toBe(20);
  expect(back.speed.fanaticism).toBe(17);
});

test("starts EIAS at 0 and gives the IAS back when EIAS stops being the table variable", () => {
  const onIas = buildOf({ current: 35 });
  const onEias = withTableVariable(onIas, "eias");

  expect(onEias.current).toBe(0);
  expect(onEias.speed.ias).toBe(35);
  expect(withTableVariable({ ...onEias, current: -20 }, "ias").current).toBe(35);
});

test("swaps the WIAS of the two weapons", () => {
  const onPrimary = buildOf({
    character: "barbarian",
    tableVariable: "primary-wias",
    current: 15,
    speed: { secondaryWias: 30 },
  });

  const onSecondary = withTableVariable(onPrimary, "secondary-wias");

  expect(onSecondary.current).toBe(30);
  expect(onSecondary.speed.primaryWias).toBe(15);
});

test("returns the build itself for its own table variable", () => {
  const build = buildOf({ current: 12 });

  expect(withTableVariable(build, "ias")).toBe(build);
});

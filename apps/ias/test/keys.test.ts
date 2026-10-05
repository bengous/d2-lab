import { expect, test } from "bun:test";

import { keysOf } from "@/lib/keys";

test("lists the keys of a record in declaration order", () => {
  expect(keysOf({ wias1: 1, ias: 2, fana: 3 })).toEqual(["wias1", "ias", "fana"]);
});

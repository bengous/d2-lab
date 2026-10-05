import { describe, expect, test } from "bun:test";

import { normalize, resolveBuild } from "@/engine/normalize";

import { buildOf, weaponId } from "./builds";

describe("hidden fields", () => {
  test("resets Mark of the Bear for a mercenary", () => {
    const build = buildOf({
      character: "rogue-scout",
      primary: "short-bow",
      speed: { markOfTheBear: true },
    });

    expect(normalize(build).speed.markOfTheBear).toBe(false);
  });

  test("resets Purge outside the Warlock", () => {
    const purge = { speed: { purge: 10 }, primary: "ancient-axe" } as const;

    expect(normalize(buildOf({ character: "paladin", ...purge })).speed.purge).toBe(0);
    expect(normalize(buildOf({ character: "warlock", ...purge })).speed.purge).toBe(10);
  });

  test("resets Purge for an unarmed Warlock: Hex Purge hexes a weapon", () => {
    expect(normalize(buildOf({ character: "warlock", speed: { purge: 10 } })).speed.purge).toBe(0);
  });

  test("resets every speed and slow on the EIAS table but keeps current", () => {
    const build = buildOf({
      tableVariable: "eias",
      current: -20,
      speed: { ias: 40, fanaticism: 10, markOfTheBear: true },
      slows: { holyFreeze: 5, chilled: true },
    });

    expect(normalize(build)).toEqual(buildOf({ tableVariable: "eias", current: -20 }));
  });

  test("resets the one-handed grip once the Barbarian holds a second weapon", () => {
    const build = buildOf({
      character: "barbarian",
      primary: "colossus-blade",
      oneHanded: true,
    });

    expect(normalize(build).oneHanded).toBe(true);
    expect(normalize({ ...build, secondary: weaponId("short-sword") }).oneHanded).toBe(false);
  });

  test("empties the off hand when the primary weapon cannot open it", () => {
    const build = buildOf({
      character: "barbarian",
      primary: "ancient-axe",
      secondary: "short-sword",
    });

    expect(normalize(build).secondary).toBe(weaponId("unarmed"));
  });
});

describe("selects", () => {
  test("falls back to Standard when the class does not offer the skill", () => {
    expect(normalize(buildOf({ character: "sorceress", skill: "smite" })).skill).toBe(
      buildOf().skill,
    );
  });

  test("falls back to the first primary weapon the skill allows", () => {
    expect(normalize(buildOf({ skill: "strafe", primary: "phase-blade" })).primary).toBe(
      weaponId("arbalest"),
    );
  });
});

describe("table variable", () => {
  test("moves current back to its field when the table variable is no longer offered", () => {
    const assassin = buildOf({
      character: "assassin",
      tableVariable: "burst-of-speed",
      current: 12,
      speed: { ias: 30 },
    });

    const paladin = resolveBuild({ ...assassin, character: "paladin" });

    expect(paladin.normalized.tableVariable).toBe("ias");
    expect(paladin.normalized.current).toBe(30);
    expect(paladin.coerced.speed.burstOfSpeed).toBe(12);
    expect(paladin.normalized.speed.burstOfSpeed).toBe(1);
  });

  test("turns the IAS table into the primary WIAS table for a dual-wielded Frenzy", () => {
    const build = normalize(
      buildOf({
        character: "barbarian",
        skill: "frenzy",
        primary: "phase-blade",
        secondary: "short-sword",
        current: 25,
        speed: { primaryWias: 10 },
      }),
    );

    expect(build.tableVariable).toBe("primary-wias");
    expect(build.current).toBe(10);
    expect(build.speed.ias).toBe(25);
  });

  test("forces the Fanaticism table and an empty hand for Dodge", () => {
    const build = normalize(
      buildOf({
        skill: "dodge",
        primary: "javelin",
        current: 20,
        speed: { fanaticism: 5 },
      }),
    );

    expect(build.tableVariable).toBe("fanaticism");
    expect(build.current).toBe(5);
    expect(build.primary).toBe(weaponId("unarmed"));
    expect(build.speed.ias).toBe(0);
  });
});

test.each([
  buildOf({ tableVariable: "eias", speed: { ias: 40 } }),
  buildOf({ character: "sorceress", skill: "smite", primary: "phase-blade" }),
  buildOf({ character: "assassin", tableVariable: "frenzy", current: 7 }),
  buildOf({ character: "barbarian", skill: "frenzy", primary: "colossus-blade", oneHanded: true }),
  buildOf({ character: "frenzy-barbarian", wereform: "werewolf", tableVariable: "werewolf" }),
  buildOf({ skill: "dodge", tableVariable: "burst-of-speed", current: 9 }),
])("is idempotent on a raw build (%#)", (build) => {
  const once = normalize(build);

  expect(normalize(once)).toEqual(once);
});

import { describe, expect, test } from "bun:test";

import { availableInputs } from "@/engine/available-inputs";
import { normalize } from "@/engine/normalize";

import { buildOf, type BuildChanges } from "./builds";

function floorsOf(changes: BuildChanges): ReturnType<typeof availableInputs>["floors"] {
  return availableInputs(buildOf(changes)).floors;
}

const beast = { kind: "item", item: "Beast" } as const;

describe("item floors", () => {
  test("Beast puts its level 9 Fanaticism aura under a werebear Paladin", () => {
    const build = buildOf({ character: "paladin", wereform: "werebear" });

    expect(availableInputs(build).floors.fanaticism).toEqual({ min: 9, origin: beast });
    expect(normalize(build).speed.fanaticism).toBe(9);
  });

  test("Beast puts 40 IAS under the only weapon of a werebear Paladin", () => {
    const build = buildOf({
      character: "paladin",
      wereform: "werebear",
      tableVariable: "fanaticism",
    });

    expect(availableInputs(build).floors.ias).toEqual({ min: 40, origin: beast });
    expect(normalize(build).speed.ias).toBe(40);
  });

  test("Chaos puts 35 IAS under the claw of a Whirlwind Assassin", () => {
    expect(
      floorsOf({
        character: "assassin",
        skill: "whirlwind",
        primary: "claws",
        tableVariable: "fanaticism",
      }).ias,
    ).toEqual({ min: 35, origin: { kind: "item", item: "Chaos" } });
  });

  test("Passion puts 25 IAS under the weapon of an Amazon with Zeal", () => {
    expect(floorsOf({ character: "amazon", skill: "zeal", tableVariable: "fanaticism" })).toEqual({
      ias: { min: 25, origin: { kind: "item", item: "Passion" } },
    });
  });

  test("Wolfhowl puts Werewolf 3 under a werewolf Barbarian", () => {
    const build = buildOf({ character: "barbarian", wereform: "werewolf" });

    expect(availableInputs(build).floors.werewolf).toEqual({
      min: 3,
      origin: { kind: "item", item: "Wolfhowl" },
    });

    expect(normalize(build).speed.werewolf).toBe(3);
  });
});

describe("skill floors", () => {
  test("the Werewolf skill puts Werewolf 1 under a werewolf Druid", () => {
    expect(floorsOf({ character: "druid", wereform: "werewolf" }).werewolf).toEqual({
      min: 1,
      origin: { kind: "skill", skill: "Werewolf" },
    });
  });

  test.each(["barbarian", "frenzy-barbarian"] as const)(
    "the Frenzy skill puts Frenzy 1 under the %s",
    (character) => {
      const build = buildOf({ character, skill: "frenzy", primary: "short-sword" });

      expect(availableInputs(build).floors.frenzy).toEqual({
        min: 1,
        origin: { kind: "skill", skill: "Frenzy" },
      });

      expect(normalize(build).speed.frenzy).toBe(1);
    },
  );
});

describe("fields that count", () => {
  test("raise current when the floored field is the table variable", () => {
    const build = buildOf({
      character: "barbarian",
      wereform: "werewolf",
      tableVariable: "werewolf",
    });

    expect(availableInputs(build).floors.werewolf?.min).toBe(3);
    expect(normalize(build).current).toBe(3);
  });

  test("hold no floor on the EIAS table", () => {
    const build = buildOf({ character: "paladin", wereform: "werebear", tableVariable: "eias" });

    expect(availableInputs(build).floors).toEqual({});
    expect(normalize(build).current).toBe(0);
  });

  test("keep a value above the floor", () => {
    const build = buildOf({
      character: "paladin",
      wereform: "werebear",
      speed: { fanaticism: 12 },
    });

    expect(normalize(build).speed.fanaticism).toBe(12);
  });

  test("put the Chaos IAS on the off-hand claw behind a Katar", () => {
    const build = buildOf({
      character: "assassin",
      skill: "whirlwind",
      primary: "katar",
      secondary: "claws",
    });

    expect(availableInputs(build).floors).toEqual({
      secondaryWias: { min: 35, origin: { kind: "item", item: "Chaos" } },
    });

    expect(normalize(build).speed).toMatchObject({ ias: 0, primaryWias: 0, secondaryWias: 35 });
  });
});

describe("ceilings", () => {
  test.each(["paladin", "barbarian", "rogue-scout"] as const)(
    "Hustle keeps Burst of Speed at level 1 for the %s",
    (character) => {
      const build = buildOf({ character, primary: "short-bow", speed: { burstOfSpeed: 20 } });

      expect(availableInputs(build).ceilings).toEqual({ burstOfSpeed: 1 });
      expect(normalize(build).speed.burstOfSpeed).toBe(1);
    },
  );

  test("leave the Assassin's Burst of Speed open to level 60", () => {
    const build = buildOf({ character: "assassin", speed: { burstOfSpeed: 60 } });

    expect(availableInputs(build).ceilings).toEqual({});
    expect(normalize(build).speed.burstOfSpeed).toBe(60);
  });

  test("hold no ceiling on the EIAS table", () => {
    const build = buildOf({ character: "paladin", tableVariable: "eias" });

    expect(availableInputs(build).ceilings).toEqual({});
  });
});

test("Passion puts 25 IAS under the weapon of a Paladin with Berserk", () => {
  expect(
    floorsOf({
      character: "paladin",
      skill: "berserk",
      primary: "phase-blade",
      tableVariable: "fanaticism",
    }),
  ).toEqual({ ias: { min: 25, origin: { kind: "item", item: "Passion" } } });
});

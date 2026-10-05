import { expect, test } from "bun:test";

import type { Build, CharacterId, WeaponId } from "@/contracts/build";
import { gameData } from "@/data/generated/game-data";
import { parseSkillId } from "@/data/rules/skills";
import { computeTables } from "@/engine/compute-tables";

function weaponId(slug: string): WeaponId {
  const found = gameData.weapons.find((weapon) => weapon.id === slug);

  if (found === undefined) {
    throw new Error(`unknown weapon ${slug}`);
  }

  return found.id;
}

function build(
  character: CharacterId,
  skill: string,
  primary: string,
  secondary = "unarmed",
): Build {
  return {
    character,
    wereform: "none",
    skill: parseSkillId(skill),
    primary: weaponId(primary),
    secondary: weaponId(secondary),
    oneHanded: false,
    tableVariable: "ias",
    current: 0,
    speed: {
      ias: 0,
      primaryWias: 0,
      secondaryWias: 0,
      fanaticism: 0,
      burstOfSpeed: 0,
      werewolf: 0,
      maul: 0,
      frenzy: 0,
      purge: 0,
      cleave: 1,
      mirroredBlades: 1,
      markOfTheBear: false,
    },
    slows: { holyFreeze: 0, slowedBy: 0, decrepify: false, chilled: false, lethargy: false },
  };
}

function roles(from: Build): readonly string[] {
  return computeTables(from).tables.map(({ role }) => role);
}

test("a single table is the main table", () => {
  expect(roles(build("paladin", "smite", "phase-blade"))).toEqual(["main"]);
});

test("a dual-wielded Standard attack adds the off-hand table", () => {
  expect(roles(build("barbarian", "standard", "phase-blade", "phase-blade"))).toEqual([
    "main",
    "off-hand",
  ]);
});

test("a dual-wielded Whirlwind adds the off-hand and merged tables", () => {
  expect(roles(build("barbarian", "whirlwind", "phase-blade", "phase-blade"))).toEqual([
    "main",
    "off-hand",
    "merged",
  ]);
});

test("Strafe with a crossbow shows the main and odd-hits tables", () => {
  expect(roles(build("amazon", "strafe", "crossbow"))).toEqual(["main", "odd-hits"]);
});

test("Strafe with a bow shows only the odd-hits table", () => {
  expect(roles(build("amazon", "strafe", "long-bow"))).toEqual(["odd-hits"]);
});

test("Fend shows the main and odd-hits tables", () => {
  expect(roles(build("amazon", "fend", "war-pike"))).toEqual(["main", "odd-hits"]);
});

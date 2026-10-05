import { expect, test } from "bun:test";

import type { CharacterId, WeaponId } from "@/contracts/build";
import type { FieldId } from "@/contracts/inputs";
import { gameData } from "@/data/generated/game-data";
import { isRunewordBase, type RunewordId, runewordBases } from "@/data/rules/equipment";
import { parseSkillId } from "@/data/rules/skills";
import { availableInputs } from "@/engine/available-inputs";
import { weaponById } from "@/engine/context";

import { buildOf, type BuildChanges, weaponId } from "./builds";

const zeal = parseSkillId("zeal");
const berserk = parseSkillId("berserk");
const standard = parseSkillId("standard");
const feralRage = parseSkillId("feral-rage");

function skillsOf(changes: BuildChanges): readonly string[] {
  return availableInputs(buildOf(changes)).skills;
}

function basesOf(runeword: RunewordId): readonly WeaponId[] {
  return gameData.weapons.flatMap((weapon) =>
    isRunewordBase(weapon, runewordBases[runeword]) ? [weapon.id] : [],
  );
}

function notBases(weapons: readonly WeaponId[], runeword: RunewordId): readonly WeaponId[] {
  const bases = basesOf(runeword);

  return weapons.filter((weapon) => !bases.includes(weapon));
}

test("lists Zeal once for the Paladin, and Berserk from Passion after the divider", () => {
  const { skills } = availableInputs(buildOf({ character: "paladin" }));

  expect(skills.filter((skill) => skill === zeal)).toHaveLength(1);
  expect(skills.slice(skills.indexOf("divider"))).toEqual(["divider", berserk]);
});

test("lists Berserk once for the Barbarian, and Zeal from Passion after the divider", () => {
  const { skills } = availableInputs(buildOf({ character: "barbarian" }));

  expect(skills.filter((skill) => skill === berserk)).toHaveLength(1);
  expect(skills.slice(skills.indexOf("divider"))).toEqual(["divider", zeal]);
});

test("keeps the Whirlwind, Zeal and Berserk oskills of the Assassin after the divider", () => {
  const { skills } = availableInputs(buildOf({ character: "assassin" }));

  expect(skills.slice(skills.indexOf("divider"))).toEqual([
    "divider",
    parseSkillId("whirlwind"),
    zeal,
    berserk,
  ]);
});

test("offers no Berserk in a beast form, where Passion grants nothing the form can use", () => {
  expect(skillsOf({ character: "paladin", wereform: "werebear" })).not.toContain(berserk);
  expect(skillsOf({ character: "druid", wereform: "werewolf" })).not.toContain(berserk);
});

test("wereforms give the Druid every wereform and its shape-shifting skills", () => {
  expect(availableInputs(buildOf({ character: "druid" })).wereforms).toEqual([
    "none",
    "werebear",
    "werewolf",
  ]);

  expect(skillsOf({ character: "druid", wereform: "werebear" })).toEqual([
    standard,
    parseSkillId("hunger"),
  ]);

  expect(skillsOf({ character: "druid", wereform: "werewolf" })).toEqual(
    ["standard", "fury", "rabies", "feral-rage", "hunger"].map((slug) => parseSkillId(slug)),
  );
});

test("wereforms give the Barbarian Werebear through Beast and Werewolf through Wolfhowl", () => {
  expect(availableInputs(buildOf({ character: "barbarian" })).wereforms).toEqual([
    "none",
    "werebear",
    "werewolf",
  ]);

  expect(skillsOf({ character: "barbarian", wereform: "werebear" })).toEqual([standard]);
  expect(skillsOf({ character: "barbarian", wereform: "werewolf" })).toEqual([
    standard,
    "divider",
    feralRage,
  ]);
});

test.each<CharacterId>(["amazon", "assassin", "necromancer", "paladin", "sorceress", "warlock"])(
  "wereforms give the %s Werebear only, with Standard alone",
  (character) => {
    expect(availableInputs(buildOf({ character })).wereforms).toEqual(["none", "werebear"]);
    expect(skillsOf({ character, wereform: "werebear" })).toEqual([standard]);
  },
);

test.each<CharacterId>(["rogue-scout", "desert-mercenary", "bash-barbarian", "frenzy-barbarian"])(
  "wereforms keep the %s human",
  (character) => {
    const { wereforms, fields } = availableInputs(buildOf({ character, wereform: "werebear" }));

    expect(wereforms).toEqual(["none"]);
    expect(fields.has("wereform")).toBe(false);
  },
);

test("wereforms drop Kick in a beast form", () => {
  expect(skillsOf({ character: "amazon" })).toContain(parseSkillId("kick"));
  expect(skillsOf({ character: "druid", wereform: "werebear" })).not.toContain(
    parseSkillId("kick"),
  );
});

test("runeword bases hold Beast in the Paladin's only hand", () => {
  const { primaryWeapons } = availableInputs(
    buildOf({ character: "paladin", wereform: "werebear" }),
  );

  expect(primaryWeapons).toEqual(basesOf("beast"));
  expect(primaryWeapons).toHaveLength(30);
});

test("runeword bases hold Beast in the Barbarian's main hand and leave the off hand free", () => {
  const build = { character: "barbarian", wereform: "werebear" } as const;
  const { primaryWeapons } = availableInputs(buildOf(build));
  const behindBase = availableInputs(buildOf({ ...build, primary: "war-axe" }));

  expect(primaryWeapons).toEqual(basesOf("beast"));
  expect(behindBase.secondaryWeapons).toContain(weaponId("unarmed"));
  expect(notBases(behindBase.secondaryWeapons, "beast")).toContain(weaponId("short-sword"));
});

test("runeword bases hold Chaos in either hand of the Assassin", () => {
  const { primaryWeapons, secondaryWeapons } = availableInputs(
    buildOf({ character: "assassin", skill: "whirlwind", primary: "claws" }),
  );

  expect(primaryWeapons).toContain(weaponId("katar"));
  expect(primaryWeapons).not.toContain(weaponId("unarmed"));
  expect(secondaryWeapons).toContain(weaponId("unarmed"));
  expect(secondaryWeapons).toContain(weaponId("katar"));
});

test("runeword bases leave only the Chaos claws to the off hand behind a Katar", () => {
  const { secondaryWeapons } = availableInputs(
    buildOf({ character: "assassin", skill: "whirlwind", primary: "katar" }),
  );

  expect(secondaryWeapons).toEqual(basesOf("chaos"));
  expect(secondaryWeapons).toHaveLength(12);
});

test("runeword bases hold Passion for the Berserk of a class other than the Barbarian", () => {
  const paladin = availableInputs(buildOf({ character: "paladin", skill: "berserk" }));
  const barbarian = availableInputs(buildOf({ character: "barbarian", skill: "berserk" }));
  const ranged = paladin.primaryWeapons.filter((id) => weaponById(id).itemClass === "missile");

  expect(paladin.primaryWeapons.length).toBeGreaterThan(0);
  expect(notBases(paladin.primaryWeapons, "passion")).toEqual([]);
  expect(ranged).toEqual([]);
  expect(basesOf("passion").filter((id) => weaponById(id).itemClass === "missile")).not.toEqual([]);
  expect(notBases(barbarian.primaryWeapons, "passion").length).toBeGreaterThan(0);
});

test("runeword bases hold Passion for the Zeal of a class other than the Paladin", () => {
  const amazon = availableInputs(buildOf({ character: "amazon", skill: "zeal" }));
  const paladin = availableInputs(buildOf({ character: "paladin", skill: "zeal" }));

  expect(amazon.primaryWeapons.length).toBeGreaterThan(0);
  expect(notBases(amazon.primaryWeapons, "passion")).toEqual([]);
  expect(notBases(paladin.primaryWeapons, "passion").length).toBeGreaterThan(0);
});

function shownOf(
  fields: ReadonlySet<FieldId>,
  wanted: readonly FieldId[],
): readonly (readonly [FieldId, boolean])[] {
  return wanted.map((field) => [field, fields.has(field)] as const);
}

test("always shows current and hides the speed field of the table variable", () => {
  const wanted = ["current", "ias", "fanaticism"] as const;
  const onIas = availableInputs(buildOf({ character: "paladin" })).fields;
  const onFanaticism = availableInputs(
    buildOf({ character: "paladin", tableVariable: "fanaticism" }),
  ).fields;

  expect(shownOf(onIas, wanted)).toEqual([
    ["current", true],
    ["ias", false],
    ["fanaticism", true],
  ]);

  expect(shownOf(onFanaticism, wanted)).toEqual([
    ["current", true],
    ["ias", true],
    ["fanaticism", false],
  ]);
});

test("shows only the secondary WIAS for the Frenzy mercenary's Frenzy without a second weapon", () => {
  const { fields } = availableInputs(
    buildOf({ character: "frenzy-barbarian", skill: "frenzy", tableVariable: "fanaticism" }),
  );

  expect(shownOf(fields, ["secondary", "primaryWias", "secondaryWias"])).toEqual([
    ["secondary", false],
    ["primaryWias", false],
    ["secondaryWias", true],
  ]);
});

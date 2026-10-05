import { expect, test } from "bun:test";

import type { CharacterId } from "@/contracts/build";
import type { ItemClass, WeaponClass, WeaponData } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { isRunewordBase, type RunewordId, runewordBases } from "@/data/rules/equipment";

import original from "./fixtures/original-constants.json";

type OriginalFrameData = number | readonly number[];

interface OriginalWeapon {
  readonly name: string;
  readonly wsm: number;
  readonly type: string;
  readonly itemClass: string;
}

interface OriginalFrameEntry {
  readonly weaponClass: WeaponClass;
  readonly character: CharacterId;
  readonly value: OriginalFrameData;
}

interface ExpectedFrames {
  readonly framesPerDirection: number | undefined;
  readonly alternate: number | null | undefined;
  /** `undefined` when the original entry is a bare number: `getActionFrame` then reads nothing. */
  readonly actionFrame: number | undefined;
}

/** `wt` keys of `constants.js@bcc112d`. */
const weaponClasses: ReadonlyMap<string, WeaponClass> = new Map([
  ["UNARMED", "hth"],
  ["CLAW", "ht"],
  ["ONE_HANDED_SWINGING", "1hs"],
  ["ONE_HANDED_THRUSTING", "1ht"],
  ["TWO_HANDED_SWORD", "2hs"],
  ["TWO_HANDED_THRUSTING", "2ht"],
  ["TWO_HANDED", "stf"],
  ["BOW", "bow"],
  ["CROSSBOW", "xbw"],
  ["THROWING", "th"],
]);

/** `char` of `constants.js:63-77@bcc112d`. */
const characters: ReadonlyMap<string, CharacterId> = new Map([
  ["0", "amazon"],
  ["1", "assassin"],
  ["2", "barbarian"],
  ["3", "druid"],
  ["4", "necromancer"],
  ["5", "paladin"],
  ["6", "sorceress"],
  ["7", "rogue-scout"],
  ["8", "desert-mercenary"],
  ["9", "bash-barbarian"],
  ["10", "frenzy-barbarian"],
  ["11", "warlock"],
]);

/** Mercenary frames are not all in `animdata.d2`: the engine rules hold them. */
const mercenaries: ReadonlySet<CharacterId> = new Set([
  "rogue-scout",
  "desert-mercenary",
  "bash-barbarian",
  "frenzy-barbarian",
]);

/** Amazon-only bases that `canBeEquipped` names one by one, `calculator.js:1312-1316@bcc112d`. */
const amazonWeapons: ReadonlySet<string> = new Set([
  "Stag Bow",
  "Reflex Bow",
  "Ashwood Bow",
  "Ceremonial Bow",
  "Matriarchal Bow",
  "Grand Matron Bow",
  "Maiden Javelin",
  "Ceremonial Javelin",
  "Matriarchal Javelin",
  "Maiden Spear",
  "Maiden Pike",
  "Ceremonial Spear",
  "Ceremonial Pike",
  "Matriarchal Spear",
  "Matriarchal Pike",
]);

const originalWeapons: readonly OriginalWeapon[] = original.weapons;

const weaponsByName = new Map(gameData.weapons.map((weapon) => [weapon.name, weapon]));

function originalRestriction(name: string, itemClass: ItemClass): CharacterId | null {
  if (amazonWeapons.has(name)) {
    return "amazon";
  }

  if (itemClass === "orb") {
    return "sorceress";
  }

  return itemClass === "claw" ? "assassin" : null;
}

/** `WeaponType` of `constants.js:184-212@bcc112d`: `fpd`, `[fpd, action]` or `[fpd, alternate, action]`. */
function expectedFrames(value: OriginalFrameData): ExpectedFrames {
  const [framesPerDirection, ...rest] = [value].flat();

  return {
    framesPerDirection,
    alternate: rest.length === 2 ? rest[0] : null,
    actionFrame: rest.at(-1),
  };
}

function originalFrameEntries(): readonly OriginalFrameEntry[] {
  const frames: Readonly<Record<string, Readonly<Record<string, OriginalFrameData>>>> =
    original.frames;

  const entries: OriginalFrameEntry[] = [];

  for (const [type, row] of Object.entries(frames)) {
    for (const [id, value] of Object.entries(row)) {
      const weaponClass = weaponClasses.get(type);
      const character = characters.get(id);

      if (weaponClass === undefined || character === undefined) {
        throw new Error(`fixture frames ${type}/${id}: unknown key`);
      }

      if (!mercenaries.has(character)) {
        entries.push({ weaponClass, character, value });
      }
    }
  }

  return entries;
}

test("holds the 291 original weapon bases plus unarmed", () => {
  const names = gameData.weapons.map((weapon) => weapon.name).toSorted();
  const ids = new Set(gameData.weapons.map((weapon) => weapon.id));
  const unarmed = gameData.weapons.filter((weapon) => weapon.id === "unarmed");

  expect(gameData.weapons).toHaveLength(292);
  expect(unarmed.map((weapon) => weapon.name)).toEqual(["None"]);
  expect(names).toEqual(originalWeapons.map((weapon) => weapon.name).toSorted());
  expect(ids.size).toBe(gameData.weapons.length);
});

test("matches the original WSM, weapon type and item class of every weapon", () => {
  const differences = originalWeapons.flatMap((expected) => {
    const weapon = weaponsByName.get(expected.name);
    const actual = weapon && {
      wsm: weapon.wsm,
      weaponClass: weapon.weaponClass,
      itemClass: weapon.itemClass,
    };

    const wanted = {
      wsm: expected.wsm,
      weaponClass: weaponClasses.get(expected.type),
      itemClass: expected.itemClass.toLowerCase(),
    };

    return Bun.deepEquals(actual, wanted) ? [] : [{ name: expected.name, actual, wanted }];
  });

  expect(differences).toEqual([]);
});

test("restricts the weapons that Warren's calculator restricts to one class", () => {
  const differences = gameData.weapons.filter(
    (weapon) => weapon.restrictedTo !== originalRestriction(weapon.name, weapon.itemClass),
  );

  expect(differences.map((weapon) => weapon.name)).toEqual([]);
});

function basesOf(runeword: RunewordId): readonly WeaponData[] {
  return gameData.weapons.filter((weapon) => isRunewordBase(weapon, runewordBases[runeword]));
}

test("finds the bases of Beast, Chaos and Passion", () => {
  const chaos = basesOf("chaos");

  expect(basesOf("beast")).toHaveLength(30);
  expect(chaos).toHaveLength(12);
  expect(chaos.filter((weapon) => weapon.itemClass !== "claw")).toEqual([]);
  expect(basesOf("passion").length).toBeGreaterThan(0);
});

test("matches the original frames of the playable classes", () => {
  const entries = originalFrameEntries();
  const differences = entries.filter(({ weaponClass, character, value }) => {
    const actual = gameData.frames[weaponClass][character];
    const wanted = expectedFrames(value);

    return (
      actual === undefined ||
      actual.framesPerDirection !== wanted.framesPerDirection ||
      actual.alternate !== wanted.alternate ||
      (wanted.actionFrame !== undefined && actual.actionFrame !== wanted.actionFrame)
    );
  });

  const generated = Object.values(gameData.frames).reduce(
    (count, row) => count + Object.keys(row).length,
    0,
  );

  expect(differences).toEqual([]);
  expect(generated).toBe(entries.length);
});

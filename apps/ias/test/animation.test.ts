import { expect, test } from "bun:test";

import { shieldGraphics, spriteOutfit } from "@/data/rules/sprites";
import { attackTimeline } from "@/engine/animation";

import { buildOf } from "./builds";

const shield = shieldGraphics.start;

const paladin = { character: "paladin", skill: "standard", primary: "phase-blade" } as const;

test("a Paladin attacks with a Phase Blade, drawn as a crystal sword, in 11 game frames at 0 IAS", () => {
  const timeline = attackTimeline(buildOf(paladin), null, shield);

  expect(timeline.kind === "timeline" && timeline.clip).toEqual({
    token: "pa",
    folder: "chars",
    weaponClass: "1hs",
    weapons: { right: "crs", left: null },
    outfit: spriteOutfit.components,
  });

  expect(timeline.kind === "timeline" && timeline.hits).toEqual([11]);
});

test("its hit lands on the seventh game frame, when the swing reaches sprite frame 7", () => {
  const timeline = attackTimeline(buildOf(paladin), null, shield);
  const ticks = timeline.kind === "timeline" ? timeline.ticks : [];

  expect(ticks.findIndex(({ hit }) => hit === 1)).toBe(6);
  expect(ticks.map(({ position }) => Math.floor(position))).toEqual([
    0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 12,
  ]);
});

test("24 IAS takes 9 game frames", () => {
  const timeline = attackTimeline(
    buildOf({ ...paladin, current: 24, speed: { ias: 24 } }),
    null,
    shield,
  );

  expect(timeline.kind === "timeline" ? timeline.hits : []).toEqual([9]);
});

const zeal = { ...paladin, skill: "zeal", current: 20, speed: { ias: 20 } } as const;

function swings(build: Parameters<typeof attackTimeline>[0], hitCount: number): string {
  const timeline = attackTimeline(build, hitCount, shield);
  const ticks = timeline.kind === "timeline" ? timeline.ticks : [];

  return ticks
    .map(({ position, hit }) => `${Math.floor(position)}${hit === null ? "" : `!${hit}`}`)
    .join(" ");
}

test("five Zeal hits with a Phase Blade at 20 IAS take 5 game frames each, the last 10", () => {
  const timeline = attackTimeline(buildOf(zeal), 5, shield);

  expect(timeline.kind === "timeline" && timeline.hits).toEqual([5, 5, 5, 5, 10]);
});

test("a rolled-back Zeal hit lands on its last game frame, then the swing starts again", () => {
  expect(swings(buildOf(zeal), 2)).toBe("0 1 2 4 5!1 0 1 2 4 5 7!2 8 10 11 13");
});

test("Strafe goes back half of the way after each hit but the last", () => {
  expect(swings(buildOf({ skill: "strafe", primary: "arbalest" }), 3)).toBe(
    "0 1 2 3 4 5 6 7 8!1 4 5 6 7 8!2 4 5 6 7 8 9!3 10 11 12 13 14 16 17 18",
  );
});

test("without a hit count, a rollback skill makes the hits of its main table", () => {
  const timeline = attackTimeline(buildOf(zeal), null, shield);

  expect(timeline.kind === "timeline" && timeline.hits).toEqual([5, 5, 10]);
});

test("a rollback skill makes 2 hits or more", () => {
  expect(() => attackTimeline(buildOf(zeal), 1, shield)).toThrow("2 hits or more");
});

function steps(build: Parameters<typeof attackTimeline>[0]): string {
  const timeline = attackTimeline(build, null, shield);
  const ticks = timeline.kind === "timeline" ? timeline.ticks : [];

  return ticks
    .map(({ mode, position, hit }) => `${mode} ${position}${hit === null ? "" : `!${hit}`}`)
    .join(", ");
}

test("a Jab with a javelin goes from one thrust to the other and lands 3 hits in 23 game frames", () => {
  expect(steps(buildOf({ character: "amazon", skill: "jab", primary: "javelin" }))).toBe(
    "a1 5, a1 5, a1 6, a1 8, a1 9!1, a1 9, a1 10, a1 11, a1 13, a2 6, a2 6, a2 8, a2 9!2, a1 10, a1 11, a1 11, a1 13, a2 6, a2 8, a2 9!3, a2 9, a2 10, a2 13",
  );
});

test("a Frenzy swings the right sword in a1, then the left one in s3", () => {
  const build = buildOf({
    character: "barbarian",
    skill: "frenzy",
    primary: "phase-blade",
    secondary: "phase-blade",
  });

  expect(steps(build)).toBe(
    "a1 1, a1 2, a1 4, a1 6, a1 7!1, a1 9, a1 11, a1 13, a1 14, s3 2!2, s3 4, s3 5, s3 6, s3 8, s3 9, s3 10, s3 11",
  );
});

test("a hardcoded sequence lasts one use, as its table counts it", () => {
  const timeline = attackTimeline(
    buildOf({ character: "assassin", skill: "dragon-claw", primary: "katar", secondary: "katar" }),
    null,
    shield,
  );

  expect(timeline.kind === "timeline" && timeline.hits).toEqual([21]);
});

test("a werewolf's Fury plays the werewolf's own attack, without a weapon", () => {
  const timeline = attackTimeline(
    buildOf({ character: "druid", wereform: "werewolf", skill: "fury" }),
    null,
    shield,
  );

  expect(timeline.kind === "timeline" && timeline.clip).toEqual({
    token: "40",
    folder: "monsters",
    weaponClass: "hth",
    weapons: { right: null, left: null },
    outfit: { tr: "lit", s1: "lit" },
  });

  expect(timeline.kind === "timeline" && timeline.hits).toEqual([8, 8, 7, 7, 13]);
});

test("the Act 2 mercenary jabs with its own spear in the 14 steps of monseq.txt, 2 hits", () => {
  const timeline = attackTimeline(
    buildOf({ character: "desert-mercenary", skill: "jab", primary: "war-scythe" }),
    null,
    shield,
  );

  expect(timeline.kind === "timeline" && timeline.clip.weapons).toEqual({
    right: "spr",
    left: null,
  });

  expect(steps(buildOf({ character: "desert-mercenary", skill: "jab" }))).toBe(
    "a1 2, a1 4, a1 6, a1 8, a1 10, a1 11!1, a1 10, a1 9, a1 10, a1 11!2, a1 12, a1 13, a1 14, a1 15",
  );
});

test.each([
  { character: "barbarian", skill: "whirlwind", primary: "phase-blade" },
  { character: "warlock", skill: "cleave", primary: "phase-blade" },
] as const)("$character $skill is unavailable", (changes) => {
  expect(attackTimeline(buildOf(changes), null, shield)).toEqual({
    kind: "unavailable",
    reason: "not-modeled",
  });
});

test("the game has no Smite animation with a two-handed weapon", () => {
  expect(
    attackTimeline(
      buildOf({ character: "paladin", skill: "smite", primary: "war-pike" }),
      null,
      shield,
    ),
  ).toEqual({ kind: "unavailable", reason: "no-animation" });
});

const smite = { character: "paladin", skill: "smite", primary: "phase-blade" } as const;

test("a Smite draws the chosen shield, or Holy Shield's own in its place", () => {
  const outfits = [shield, { graphic: "buc", holy: false }, { graphic: "buc", holy: true }].map(
    (chosen) => {
      const timeline = attackTimeline(buildOf(smite), null, chosen);

      return timeline.kind === "timeline" ? timeline.clip.outfit.sh : null;
    },
  );

  expect(outfits).toEqual(["pa3", "buc", "hsh"]);
});

test("an attack without a shield skill draws no shield, whatever the shield chosen", () => {
  const timeline = attackTimeline(buildOf(paladin), null, { graphic: "buc", holy: true });

  expect(timeline.kind === "timeline" && timeline.clip.outfit).toEqual(spriteOutfit.components);
});

test("a dodge lasts 8 game frames at 0 Fanaticism, as its row, and lands no hit", () => {
  const timeline = attackTimeline(buildOf({ character: "amazon", skill: "dodge" }), null, shield);

  expect(timeline.kind === "timeline" && timeline.hits).toEqual([8]);
  expect(timeline.kind === "timeline" && timeline.ticks.some(({ hit }) => hit !== null)).toBe(
    false,
  );
});

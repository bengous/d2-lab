import { expect, test } from "bun:test";

import { normalize } from "@/engine/normalize";
import { parseShareLink } from "@/share-link/parse";
import { serializeShareLink } from "@/share-link/serialize";

import { type BuildChanges, buildOf } from "./builds";
import { dualBarbarian } from "./share-link";

const builds: readonly (readonly [string, BuildChanges])[] = [
  ["the default build", {}],
  [
    "a Paladin with Smite",
    { character: "paladin", skill: "smite", primary: "phase-blade", current: 20 },
  ],
  [
    "Dodge, which fixes the table variable",
    { skill: "dodge", tableVariable: "fanaticism", current: 15 },
  ],
  [
    "a Warlock with every slow",
    {
      character: "warlock",
      primary: "ancient-axe",
      speed: { purge: 10, fanaticism: 3, markOfTheBear: true },
      slows: { holyFreeze: 5, slowedBy: 7, decrepify: true, chilled: true, lethargy: true },
    },
  ],
  [
    "a werewolf Druid on the EIAS table",
    {
      character: "druid",
      wereform: "werewolf",
      skill: "fury",
      tableVariable: "eias",
      current: -30,
    },
  ],
  [
    "a dual wielding Barbarian",
    {
      ...dualBarbarian,
      tableVariable: "primary-wias",
      current: 40,
      speed: { secondaryWias: 10, frenzy: 3 },
    },
  ],
  [
    "a Barbarian with a two-handed sword in one hand",
    { character: "barbarian", primary: "colossus-blade", oneHanded: true },
  ],
  [
    "a werebear Paladin, whose Beast floors Fanaticism and IAS",
    { character: "paladin", wereform: "werebear", tableVariable: "fanaticism", current: 3 },
  ],
  ["a mercenary", { character: "rogue-scout", primary: "short-bow", current: 25 }],
  [
    "a build whose fields hold values the form hides",
    {
      character: "sorceress",
      skill: "smite",
      wereform: "werebear",
      primary: "phase-blade",
      oneHanded: true,
      speed: { ias: 50, werewolf: 9, maul: 9, frenzy: 9, purge: 9, cleave: 9, mirroredBlades: 9 },
      slows: { holyFreeze: 9 },
    },
  ],
];

test.each(builds)("parse gives back normalize of what serialize wrote for %s", (_name, changes) => {
  const build = buildOf(changes);

  expect(parseShareLink(serializeShareLink(build))).toEqual({ ok: true, build: normalize(build) });
});

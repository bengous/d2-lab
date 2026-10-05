import { describe, expect, test } from "bun:test";

import { defaultBuild } from "@/engine/default-build";
import { shareParams } from "@/share-link/params";
import { parseShareLink } from "@/share-link/parse";
import { serializeShareLink } from "@/share-link/serialize";

import { type BuildChanges, buildOf } from "./builds";
import { dualBarbarian, dualBarbarianQuery, loaded } from "./share-link";

const ruleOrder = [
  "class",
  "form",
  "skill",
  "weapon",
  "offhand",
  "onehand",
  "table",
  "current",
  "ias",
  "wias1",
  "wias2",
  "fana",
  "bos",
  "wolf",
  "maul",
  "frenzy",
  "purge",
  "cleave",
  "mblades",
  "motb",
  "hf",
  "slow",
  "decrep",
  "chill",
  "lethargy",
];

const everyParameter = buildOf({
  character: "warlock",
  skill: "mirrored-blades",
  primary: "ancient-axe",
  tableVariable: "fanaticism",
  current: 12,
  speed: { ias: 30, burstOfSpeed: 1, purge: 10, mirroredBlades: 7, markOfTheBear: true },
  slows: { holyFreeze: 5, slowedBy: 7, decrepify: true, chilled: true, lethargy: true },
});

const smite = {
  character: "paladin",
  skill: "smite",
  primary: "phase-blade",
  current: 20,
} as const satisfies BuildChanges;

describe("default build", () => {
  test("serializes to the version alone", () => {
    expect(serializeShareLink(defaultBuild)).toBe("?v=1");
  });

  test("is what a link with the version alone loads", () => {
    expect(parseShareLink("?v=1")).toEqual({ ok: true, build: defaultBuild });
  });
});

describe("the link of the reference Smite build", () => {
  const link = "?v=1&class=paladin&skill=smite&weapon=phase-blade&current=20";

  test("parses to a Paladin with Smite and a Phase Blade at 20 IAS", () => {
    expect(parseShareLink(link)).toEqual(loaded(smite));
  });

  test("is what that build serializes to", () => {
    expect(serializeShareLink(buildOf(smite))).toBe(link);
  });
});

describe("parameter order", () => {
  test("is the pinned order", () => {
    expect(shareParams.map((param) => param.name)).toEqual(ruleOrder);
  });

  test("is kept when a build sets a parameter of each kind", () => {
    expect(serializeShareLink(everyParameter)).toBe(
      "?v=1&class=warlock&skill=mirrored-blades&weapon=ancient-axe&table=fanaticism&current=12&ias=30&bos=1&purge=10&mblades=7&motb=1&hf=5&slow=7&decrep=1&chill=1&lethargy=1",
    );
  });

  test("does not matter when a link is read, the version included", () => {
    expect(parseShareLink("?current=20&weapon=phase-blade&skill=smite&class=paladin&v=1")).toEqual(
      loaded(smite),
    );
  });
});

describe("omitted parameters", () => {
  test("are those that hold the default build's value", () => {
    const build = buildOf({ character: "paladin", skill: "smite", speed: { ias: 0, cleave: 1 } });

    expect(serializeShareLink(build)).toBe("?v=1&class=paladin&skill=smite");
    expect(serializeShareLink(buildOf({ character: "amazon", wereform: "none" }))).toBe("?v=1");
  });
});

const oneParameter: readonly (readonly [string, BuildChanges])[] = [
  ["?v=1&class=paladin", { character: "paladin" }],
  ["?v=1&class=druid&form=werebear", { character: "druid", wereform: "werebear" }],
  ["?v=1&class=paladin&skill=smite", { character: "paladin", skill: "smite" }],
  ["?v=1&weapon=phase-blade", { primary: "phase-blade" }],
  [
    `?v=1&${dualBarbarianQuery}&table=secondary-wias&wias1=10&frenzy=1`,
    { ...dualBarbarian, tableVariable: "secondary-wias", speed: { primaryWias: 10, frenzy: 1 } },
  ],
  [
    `?v=1&${dualBarbarianQuery}&table=primary-wias&wias2=10&frenzy=3`,
    { ...dualBarbarian, tableVariable: "primary-wias", speed: { secondaryWias: 10, frenzy: 3 } },
  ],
  [
    "?v=1&class=barbarian&weapon=colossus-blade&onehand=1",
    { character: "barbarian", primary: "colossus-blade", oneHanded: true },
  ],
  ["?v=1&table=eias&current=-20", { tableVariable: "eias", current: -20 }],
  [
    "?v=1&table=fanaticism&current=15&ias=30",
    { tableVariable: "fanaticism", current: 15, speed: { ias: 30 } },
  ],
  [
    "?v=1&class=assassin&table=fanaticism&bos=4",
    { character: "assassin", tableVariable: "fanaticism", speed: { burstOfSpeed: 4 } },
  ],
  [
    "?v=1&class=druid&form=werewolf&table=fanaticism&wolf=4",
    {
      character: "druid",
      wereform: "werewolf",
      tableVariable: "fanaticism",
      speed: { werewolf: 4 },
    },
  ],
  [
    "?v=1&class=druid&form=werebear&table=fanaticism&maul=4",
    { character: "druid", wereform: "werebear", tableVariable: "fanaticism", speed: { maul: 4 } },
  ],
  [
    "?v=1&class=warlock&weapon=ancient-axe&purge=10",
    { character: "warlock", primary: "ancient-axe", speed: { purge: 10 } },
  ],
  [
    "?v=1&class=warlock&skill=cleave&weapon=ancient-axe&cleave=3",
    { character: "warlock", skill: "cleave", primary: "ancient-axe", speed: { cleave: 3 } },
  ],
  [
    "?v=1&class=warlock&skill=mirrored-blades&weapon=ancient-axe&mblades=7",
    {
      character: "warlock",
      skill: "mirrored-blades",
      primary: "ancient-axe",
      speed: { mirroredBlades: 7 },
    },
  ],
  ["?v=1&motb=1", { speed: { markOfTheBear: true } }],
  ["?v=1&hf=5&slow=7", { slows: { holyFreeze: 5, slowedBy: 7 } }],
  [
    "?v=1&decrep=1&chill=1&lethargy=1",
    { slows: { decrepify: true, chilled: true, lethargy: true } },
  ],
];

describe.each(oneParameter)("%s", (link, changes) => {
  test("parses to the build it names", () => {
    expect(parseShareLink(link)).toEqual(loaded(changes));
  });

  test("is what that build serializes to", () => {
    expect(serializeShareLink(buildOf(changes))).toBe(link);
  });
});

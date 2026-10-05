import { describe, expect, test } from "bun:test";

import { parseShareLink } from "@/share-link/parse";

import { dualBarbarianQuery, loaded, outOfRange } from "./share-link";

const beastBear = "class=paladin&form=werebear";

const underFloor: readonly (readonly [string, number, string])[] = [
  ["fana", 0, `${beastBear}&fana=0`],
  ["fana", 8, `${beastBear}&fana=8`],
  ["ias", 39, `${beastBear}&table=fanaticism&ias=39`],
  ["current", 8, `${beastBear}&table=fanaticism&current=8`],
  ["wias2", 34, "class=assassin&skill=whirlwind&weapon=katar&offhand=claws&wias2=34"],
  ["ias", 24, "class=amazon&skill=zeal&table=fanaticism&ias=24"],
  ["wolf", 2, "class=barbarian&form=werewolf&wolf=2"],
  ["wolf", 0, "class=druid&form=werewolf&wolf=0"],
  ["frenzy", 0, `${dualBarbarianQuery}&table=primary-wias&frenzy=0`],
];

describe("a floor of the build", () => {
  test.each(underFloor)("puts %s at %d out of range", (param, value, query) => {
    expect(parseShareLink(`?v=1&${query}`)).toEqual(outOfRange(param, value));
  });

  test("accepts a value above it", () => {
    expect(parseShareLink(`?v=1&${beastBear}&fana=12`)).toEqual(
      loaded({ character: "paladin", wereform: "werebear", speed: { fanaticism: 12 } }),
    );
  });

  test("raises an absent value to it", () => {
    const parsed = parseShareLink(`?v=1&${beastBear}`);

    expect(parsed.ok && parsed.build.speed.fanaticism).toBe(9);
  });
});

describe("a ceiling of the build", () => {
  test("puts Burst of Speed over level 1 out of range outside the Assassin", () => {
    expect(parseShareLink("?v=1&class=paladin&bos=2")).toEqual(outOfRange("bos", 2));
  });

  test("accepts level 1 outside the Assassin, and level 60 for the Assassin", () => {
    expect(parseShareLink("?v=1&class=paladin&bos=1")).toEqual(
      loaded({ character: "paladin", speed: { burstOfSpeed: 1 } }),
    );

    expect(parseShareLink("?v=1&class=assassin&bos=60")).toEqual(
      loaded({ character: "assassin", speed: { burstOfSpeed: 60 } }),
    );
  });
});

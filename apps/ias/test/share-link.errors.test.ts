import { describe, expect, test } from "bun:test";

import { parseShareLink } from "@/share-link/parse";

import {
  dualBarbarianQuery,
  loaded,
  outOfRange,
  unknownValue,
  unsupportedVersion,
} from "./share-link";

const versions: readonly (readonly [string, string, string])[] = [
  ["no version", "?class=paladin", ""],
  ["no query", "", ""],
  ["an empty version", "?v=", ""],
  ["a later version", "?v=2", "2"],
  ["version 0", "?v=0", "0"],
  ["a version that is not a number", "?v=one", "one"],
  ["a version with a leading zero", "?v=01", "01"],
];

const bounds: readonly (readonly [string, number, string])[] = [
  ["ias", 401, "table=fanaticism&ias=401"],
  ["ias", -1, "table=fanaticism&ias=-1"],
  ["ias", 99_999_999_999, "table=fanaticism&ias=99999999999"],
  ["wias1", 121, `${dualBarbarianQuery}&table=secondary-wias&wias1=121`],
  ["wias2", 121, `${dualBarbarianQuery}&table=primary-wias&wias2=121`],
  ["fana", 61, "fana=61"],
  ["bos", 61, "class=assassin&bos=61"],
  ["wolf", 61, "class=druid&form=werewolf&wolf=61"],
  ["maul", 61, "class=druid&form=werebear&maul=61"],
  ["frenzy", 61, "class=barbarian&frenzy=61"],
  ["purge", 61, "class=warlock&weapon=ancient-axe&purge=61"],
  ["cleave", 0, "class=warlock&skill=cleave&cleave=0"],
  ["cleave", 61, "class=warlock&skill=cleave&cleave=61"],
  ["mblades", 0, "class=warlock&skill=mirrored-blades&mblades=0"],
  ["mblades", 61, "class=warlock&skill=mirrored-blades&mblades=61"],
  ["hf", 61, "hf=61"],
  ["slow", 51, "slow=51"],
  ["current", 401, "current=401"],
  ["current", -1, "current=-1"],
  ["current", 61, "table=fanaticism&current=61"],
  ["current", 121, `${dualBarbarianQuery}&table=primary-wias&current=121`],
  ["current", 151, "table=eias&current=151"],
  ["current", -86, "table=eias&current=-86"],
];

describe("unsupported-version", () => {
  test.each(versions)("%s", (_name, link, version) => {
    expect(parseShareLink(link)).toEqual(unsupportedVersion(version));
  });

  test("outranks every other error", () => {
    expect(parseShareLink("?v=2&class=nope&ias=999&foo=1")).toEqual(unsupportedVersion("2"));
  });
});

describe("unknown-value for a slug", () => {
  test("names one that does not exist", () => {
    expect(parseShareLink("?v=1&class=nope")).toEqual(unknownValue("class", "nope"));
    expect(parseShareLink("?v=1&form=bat")).toEqual(unknownValue("form", "bat"));
    expect(parseShareLink("?v=1&skill=nope")).toEqual(unknownValue("skill", "nope"));
    expect(parseShareLink("?v=1&weapon=nope")).toEqual(unknownValue("weapon", "nope"));
    expect(parseShareLink("?v=1&table=nope")).toEqual(unknownValue("table", "nope"));
  });

  test("keeps the case it was written in", () => {
    expect(parseShareLink("?v=1&class=Paladin")).toEqual(unknownValue("class", "Paladin"));
  });

  test("names a skill of another class", () => {
    expect(parseShareLink("?v=1&class=sorceress&skill=smite")).toEqual(
      unknownValue("skill", "smite"),
    );

    expect(parseShareLink("?v=1&skill=smite")).toEqual(unknownValue("skill", "smite"));
  });

  test("names a skill the wereform does not offer", () => {
    expect(parseShareLink("?v=1&class=paladin&form=werebear&skill=smite")).toEqual(
      unknownValue("skill", "smite"),
    );
  });

  test("names a wereform the class cannot take", () => {
    expect(parseShareLink("?v=1&class=rogue-scout&form=werebear")).toEqual(
      unknownValue("form", "werebear"),
    );

    expect(parseShareLink("?v=1&class=paladin&form=werewolf")).toEqual(
      unknownValue("form", "werewolf"),
    );
  });
});

describe("unknown-value for a weapon or a table variable that exists", () => {
  test("names a weapon reserved for another class", () => {
    expect(parseShareLink("?v=1&class=paladin&weapon=ashwood-bow")).toEqual(
      unknownValue("weapon", "ashwood-bow"),
    );

    expect(parseShareLink("?v=1&weapon=ashwood-bow")).toEqual(loaded({ primary: "ashwood-bow" }));
  });

  test("names an off-hand weapon the form does not show", () => {
    expect(parseShareLink("?v=1&offhand=short-sword")).toEqual(
      unknownValue("offhand", "short-sword"),
    );

    expect(parseShareLink("?v=1&class=barbarian&weapon=ancient-axe&offhand=short-sword")).toEqual(
      unknownValue("offhand", "short-sword"),
    );
  });

  test("names a table variable the build does not offer", () => {
    expect(parseShareLink("?v=1&table=primary-wias")).toEqual(
      unknownValue("table", "primary-wias"),
    );

    expect(parseShareLink("?v=1&class=paladin&table=frenzy")).toEqual(
      unknownValue("table", "frenzy"),
    );

    expect(parseShareLink("?v=1&skill=dodge&table=ias")).toEqual(unknownValue("table", "ias"));
  });
});

describe("unknown-value for a checkbox or a number", () => {
  test("names a checkbox value other than 1", () => {
    for (const value of ["0", "true", "on", "", "2", "01"]) {
      expect(parseShareLink(`?v=1&class=barbarian&weapon=colossus-blade&onehand=${value}`)).toEqual(
        unknownValue("onehand", value),
      );
    }

    expect(parseShareLink("?v=1&motb=yes")).toEqual(unknownValue("motb", "yes"));
    expect(parseShareLink("?v=1&decrep=0")).toEqual(unknownValue("decrep", "0"));
    expect(parseShareLink("?v=1&chill=")).toEqual(unknownValue("chill", ""));
    expect(parseShareLink("?v=1&lethargy=true")).toEqual(unknownValue("lethargy", "true"));
  });

  test("names a number that is not an integer in its canonical spelling", () => {
    for (const value of ["abc", "", "1.5", "1e2", "+5", "05", "-0", "0x10", " 5", "5 ", "NaN"]) {
      expect(parseShareLink(`?v=1&table=fanaticism&ias=${encodeURIComponent(value)}`)).toEqual(
        unknownValue("ias", value),
      );
    }

    expect(parseShareLink("?v=1&current=twenty")).toEqual(unknownValue("current", "twenty"));
    expect(parseShareLink("?v=1&slow=1.5")).toEqual(unknownValue("slow", "1.5"));
  });
});

describe("unknown-value for a parameter", () => {
  test("names one the link format does not define", () => {
    expect(parseShareLink("?v=1&foo=1")).toEqual(unknownValue("foo", "1"));
    expect(parseShareLink("?v=1&data=0-0-Phase_Blade")).toEqual(
      unknownValue("data", "0-0-Phase_Blade"),
    );

    expect(parseShareLink("?v=1&Class=paladin")).toEqual(unknownValue("Class", "paladin"));
    expect(parseShareLink("?v=1&=1")).toEqual(unknownValue("", "1"));
  });

  test("names the second occurrence of a repeated one", () => {
    expect(parseShareLink("?v=1&class=paladin&class=amazon")).toEqual(
      unknownValue("class", "amazon"),
    );

    expect(parseShareLink("?v=1&v=1")).toEqual(unknownValue("v", "1"));
    expect(parseShareLink("?v=1&fana=1&fana=1")).toEqual(unknownValue("fana", "1"));
  });
});

describe("unknown-value for a field the form hides", () => {
  test("names a number", () => {
    expect(parseShareLink("?v=1&ias=30")).toEqual(unknownValue("ias", "30"));
    expect(parseShareLink("?v=1&purge=5")).toEqual(unknownValue("purge", "5"));
    expect(parseShareLink("?v=1&class=warlock&purge=5")).toEqual(unknownValue("purge", "5"));
    expect(parseShareLink("?v=1&cleave=2")).toEqual(unknownValue("cleave", "2"));
    expect(parseShareLink("?v=1&wias1=10")).toEqual(unknownValue("wias1", "10"));
    expect(parseShareLink("?v=1&table=eias&fana=5")).toEqual(unknownValue("fana", "5"));
    expect(parseShareLink("?v=1&table=eias&hf=5")).toEqual(unknownValue("hf", "5"));
  });

  test("names a checkbox", () => {
    expect(parseShareLink("?v=1&onehand=1")).toEqual(unknownValue("onehand", "1"));
    expect(parseShareLink("?v=1&table=eias&motb=1")).toEqual(unknownValue("motb", "1"));
    expect(parseShareLink("?v=1&table=eias&decrep=1")).toEqual(unknownValue("decrep", "1"));
  });

  test("names the field of the table variable, which current holds", () => {
    expect(parseShareLink("?v=1&table=fanaticism&fana=5")).toEqual(unknownValue("fana", "5"));
    expect(parseShareLink("?v=1&class=barbarian&table=frenzy&frenzy=5")).toEqual(
      unknownValue("frenzy", "5"),
    );
  });

  test("outranks the bounds of the field", () => {
    expect(parseShareLink("?v=1&ias=999")).toEqual(unknownValue("ias", "999"));
  });

  test("judges a field with the whole link, not with the order of the link", () => {
    expect(parseShareLink("?v=1&ias=30&table=fanaticism")).toEqual(
      loaded({ tableVariable: "fanaticism", speed: { ias: 30 } }),
    );
  });

  test("never hides current", () => {
    expect(parseShareLink("?v=1&table=eias&current=5")).toEqual(
      loaded({ tableVariable: "eias", current: 5 }),
    );
  });
});

describe("out-of-range", () => {
  test.each(bounds)("%s at %d", (param, value, query) => {
    expect(parseShareLink(`?v=1&${query}`)).toEqual(outOfRange(param, value));
  });

  test("bounds current with the field of the table variable", () => {
    expect(parseShareLink("?v=1&current=400")).toEqual(loaded({ current: 400 }));
    expect(parseShareLink("?v=1&table=fanaticism&current=60")).toEqual(
      loaded({ tableVariable: "fanaticism", current: 60 }),
    );

    expect(parseShareLink("?v=1&table=eias&current=-85")).toEqual(
      loaded({ tableVariable: "eias", current: -85 }),
    );

    expect(parseShareLink("?v=1&table=eias&current=150")).toEqual(
      loaded({ tableVariable: "eias", current: 150 }),
    );
  });

  test("accepts every field at its bounds", () => {
    const link = "?v=1&class=warlock&skill=cleave&cleave=1&purge=0&slow=50&hf=60";

    expect(parseShareLink(link)).toEqual(
      loaded({
        character: "warlock",
        skill: "cleave",
        primary: "ancient-axe",
        speed: { cleave: 1 },
        slows: { slowedBy: 50, holyFreeze: 60 },
      }),
    );
  });
});

describe("the first error", () => {
  test("follows the order of the parameters, not of the link", () => {
    expect(parseShareLink("?v=1&class=nope&ias=999")).toEqual(unknownValue("class", "nope"));
    expect(parseShareLink("?v=1&ias=999&class=nope")).toEqual(unknownValue("class", "nope"));
    expect(parseShareLink("?v=1&table=fanaticism&slow=99&ias=999")).toEqual(outOfRange("ias", 999));
    expect(parseShareLink("?v=1&ias=abc&class=paladin&skill=nope")).toEqual(
      unknownValue("skill", "nope"),
    );
  });

  test("puts a parameter the format does not define after every defined one", () => {
    expect(parseShareLink("?v=1&foo=1&fana=999")).toEqual(outOfRange("fana", 999));
    expect(parseShareLink("?v=1&foo=1&bar=2")).toEqual(unknownValue("foo", "1"));
  });

  test("checks each slug against the parameters before it", () => {
    expect(parseShareLink("?v=1&skill=smite&class=paladin")).toEqual(
      loaded({ character: "paladin", skill: "smite" }),
    );

    expect(parseShareLink("?v=1&class=paladin&form=werebear&skill=smite")).toEqual(
      unknownValue("skill", "smite"),
    );
  });
});

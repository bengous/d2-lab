import { describe, expect, test } from "bun:test";

import type { Build } from "@/contracts/build";
import { currentField } from "@/data/rules/field-values";
import { normalize } from "@/engine/normalize";
import { parseShareLink } from "@/share-link/parse";
import { serializeShareLink } from "@/share-link/serialize";

import { families, goldenFiles } from "./golden-suite";
import { fromOriginalInput } from "./original";

/** The build with `current` in the middle of its table variable's range. */
function withMiddleCurrent(build: Build): Build {
  const normalized = normalize(build);
  const { min, max } = currentField(normalized.tableVariable);

  return { ...normalized, current: Math.trunc((min + max) / 2) };
}

function expectRoundTrip(build: Build): void {
  expect(parseShareLink(serializeShareLink(build))).toEqual({ ok: true, build: normalize(build) });
}

for (const family of families) {
  for (const file of goldenFiles(family)) {
    describe(`${family}/${file.name}`, () => {
      for (const golden of file.cases) {
        test(golden.id, () => {
          const build = fromOriginalInput(golden.input);

          expectRoundTrip(build);
          expectRoundTrip(withMiddleCurrent(build));
        });
      }
    });
  }
}

import { expect, test } from "bun:test";

import { shareLinkErrorText } from "@/share-link/error-text";
import { parseShareLink } from "@/share-link/parse";

function textOf(search: string): string {
  const parsed = parseShareLink(search);

  if (parsed.ok) {
    throw new Error(`${search} is a valid link`);
  }

  return shareLinkErrorText(parsed.error);
}

test("a link without a version has no version", () => {
  expect(textOf("?class=paladin")).toBe("This link has no version");
});

test("a link of another version names it", () => {
  expect(textOf("?v=2")).toBe('Unsupported link version "2"');
});

test("an unknown value names the parameter and the value", () => {
  expect(textOf("?v=1&class=nope")).toBe('Unknown value "nope" for "class"');
});

test("an unknown parameter reads like an unknown value", () => {
  expect(textOf("?v=1&data=0-0")).toBe('Unknown value "0-0" for "data"');
});

test("an out-of-range number names the parameter and the number", () => {
  expect(textOf("?v=1&table=eias&current=151")).toBe('"current" is out of range: 151');
});

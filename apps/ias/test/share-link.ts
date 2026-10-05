import type { ParseShareLink } from "@/contracts/share-link";
import { normalize } from "@/engine/normalize";

import { type BuildChanges, buildOf } from "./builds";

export type ParsedLink = ReturnType<ParseShareLink>;

/** A Barbarian dual wielding two short swords with Frenzy, which offers the WIAS tables. */
export const dualBarbarianQuery =
  "class=barbarian&skill=frenzy&weapon=short-sword&offhand=short-sword";

export const dualBarbarian = {
  character: "barbarian",
  skill: "frenzy",
  primary: "short-sword",
  secondary: "short-sword",
} as const satisfies BuildChanges;

export function unsupportedVersion(version: string): ParsedLink {
  return { ok: false, error: { kind: "unsupported-version", version } };
}

export function unknownValue(param: string, value: string): ParsedLink {
  return { ok: false, error: { kind: "unknown-value", param, value } };
}

export function outOfRange(param: string, value: number): ParsedLink {
  return { ok: false, error: { kind: "out-of-range", param, value } };
}

/** What a link that names `changes` loads. */
export function loaded(changes: BuildChanges): ParsedLink {
  return { ok: true, build: normalize(buildOf(changes)) };
}

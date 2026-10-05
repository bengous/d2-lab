import type { Build } from "@/contracts/build";

export type ShareLinkError =
  | { readonly kind: "unsupported-version"; readonly version: string }
  | { readonly kind: "unknown-value"; readonly param: string; readonly value: string }
  | { readonly kind: "out-of-range"; readonly param: string; readonly value: number };

export type ParseShareLink = (
  search: string,
) =>
  | { readonly ok: true; readonly build: Build }
  | { readonly ok: false; readonly error: ShareLinkError };

/** Serializes `normalize(build)`. */
export type SerializeShareLink = (build: Build) => string;

import type { CharacterId } from "@/contracts/build";

/** Every other character is a mercenary. Source: calculator.js:1137-1141@bcc112d. */
export const playerCharacters: ReadonlySet<CharacterId> = new Set<CharacterId>([
  "amazon",
  "assassin",
  "barbarian",
  "druid",
  "necromancer",
  "paladin",
  "sorceress",
  "warlock",
]);

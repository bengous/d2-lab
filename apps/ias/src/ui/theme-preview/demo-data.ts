import type { Wereform } from "@/contracts/build";
import type { BreakpointRow } from "@/contracts/result";
import type { SegmentOption } from "@/ui/components/segmented-toggle";

export interface DemoChoice {
  readonly value: string;
  readonly name: string;
}

export const classes: readonly DemoChoice[] = [
  { value: "amazon", name: "Amazon" },
  { value: "assassin", name: "Assassin" },
  { value: "barbarian", name: "Barbarian" },
  { value: "druid", name: "Druid" },
  { value: "necromancer", name: "Necromancer" },
  { value: "paladin", name: "Paladin" },
  { value: "sorceress", name: "Sorceress" },
  { value: "warlock", name: "Warlock" },
];

export const mercenaries: readonly DemoChoice[] = [
  { value: "rogue-scout", name: "Rogue Scout" },
  { value: "desert-mercenary", name: "Desert Merc" },
  { value: "bash-barbarian", name: "Bash Barb" },
  { value: "frenzy-barbarian", name: "Frenzy Barb" },
];

export const skills: readonly DemoChoice[] = [
  { value: "standard", name: "Attack" },
  { value: "zeal", name: "Zeal" },
  { value: "smite", name: "Smite" },
  { value: "sacrifice", name: "Sacrifice" },
  { value: "vengeance", name: "Vengeance" },
  { value: "conversion", name: "Conversion" },
];

export const wereforms: readonly SegmentOption<Wereform>[] = [
  { value: "none", label: "None" },
  { value: "werebear", label: "Werebear" },
  { value: "werewolf", label: "Werewolf" },
];

export const disabledWereforms: readonly SegmentOption<Wereform>[] = [
  { value: "none", label: "None", disabled: true },
  { value: "werebear", label: "Werebear", disabled: true },
  { value: "werewolf", label: "Werewolf", disabled: true },
];

export const weapons: readonly string[] = [
  "Phase Blade",
  "Crystal Sword",
  "Colossus Blade",
  "Berserker Axe",
  "Cryptic Sword",
  "Mighty Scepter",
];

export const nowRow: BreakpointRow = { value: 5, frames: "8", hits: [8], rollback: null };

export const nextRow: BreakpointRow = { value: 24, frames: "7", hits: [7], rollback: null };

export const rows: readonly BreakpointRow[] = [
  { value: 0, frames: "9", hits: [9], rollback: null },
  nowRow,
  nextRow,
  { value: 65, frames: "6", hits: [6], rollback: null },
];

export function portraitSrc(character: string): string {
  return `game/portraits/${character}.webp`;
}

export function skillIconSrc(skill: string): string {
  return `game/skills/${skill}.webp`;
}

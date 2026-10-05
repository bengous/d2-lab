import { join } from "node:path";

import type { HandItemTypes, SkillItemTypes } from "@/contracts/game-data";
import { parseSkillId } from "@/data/rules/skills";

import { cell, readTable, required, type GameCache, type Row } from "./game-files";
import { skillRows } from "./skill-animations";

type Hand = "a" | "b";

const handColumns: Readonly<
  Record<Hand, { readonly itypes: readonly string[]; readonly etypes: readonly string[] }>
> = {
  a: { itypes: ["itypea1", "itypea2", "itypea3"], etypes: ["etypea1", "etypea2"] },
  b: { itypes: ["itypeb1", "itypeb2", "itypeb3"], etypes: ["etypeb1", "etypeb2"] },
};

function filledCells(row: Row, columns: readonly string[]): readonly string[] {
  return columns.flatMap((column) => {
    const value = cell(row, column);

    return value === "" ? [] : [value];
  });
}

function handItemTypes(row: Row, hand: Hand): HandItemTypes {
  return {
    itypes: filledCells(row, handColumns[hand].itypes),
    etypes: filledCells(row, handColumns[hand].etypes),
  };
}

export type SkillItemTypesById = Readonly<Record<string, SkillItemTypes>>;

/** The item types each hand needs, by skill id, through the skill-to-row table of `skillModes`. */
export async function extractSkillItemTypes(cache: GameCache): Promise<SkillItemTypesById> {
  const rows = await readTable(join(cache.dir, "files/data/data/global/excel/skills.txt"), [
    "skill",
    ...Object.values(handColumns).flatMap(({ itypes, etypes }) => itypes.concat(etypes)),
  ]);

  const byName = new Map(rows.map((row) => [cell(row, "skill"), row]));

  return Object.fromEntries(
    Object.entries(skillRows).map(([skill, name]: readonly [string, string]) => {
      const row = required(byName.get(name), `skills.txt has no ${name}`);

      return [
        parseSkillId(skill),
        { row: name, a: handItemTypes(row, "a"), b: handItemTypes(row, "b") },
      ];
    }),
  );
}

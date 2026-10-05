import type { Build } from "@/contracts/build";
import { gameData } from "@/data/generated/game-data";
import { oneHandedField, slowFields, speedFields } from "@/data/rules/field-values";
import { parseSkillId } from "@/data/rules/skills";

const unarmed = gameData.weapons.find((weapon) => weapon.id === "unarmed");

if (unarmed === undefined) {
  throw new Error("the game data has no unarmed weapon");
}

/**
 * Warren's calculator right after a fresh load: Amazon, human, Standard, no weapon, table
 * variable IAS. Every number and checkbox holds its HTML default; `current` has no original field
 * and starts at 0.
 */
export const originalInitialState: { readonly build: Build; readonly source: string } = {
  build: {
    character: "amazon",
    wereform: "none",
    skill: parseSkillId("standard"),
    primary: unarmed.id,
    secondary: unarmed.id,
    oneHanded: oneHandedField.default,
    tableVariable: "ias",
    current: 0,
    speed: {
      ias: speedFields.ias.default,
      primaryWias: speedFields.primaryWias.default,
      secondaryWias: speedFields.secondaryWias.default,
      fanaticism: speedFields.fanaticism.default,
      burstOfSpeed: speedFields.burstOfSpeed.default,
      werewolf: speedFields.werewolf.default,
      maul: speedFields.maul.default,
      frenzy: speedFields.frenzy.default,
      purge: speedFields.purge.default,
      cleave: speedFields.cleave.default,
      mirroredBlades: speedFields.mirroredBlades.default,
      markOfTheBear: speedFields.markOfTheBear.default,
    },
    slows: {
      holyFreeze: slowFields.holyFreeze.default,
      slowedBy: slowFields.slowedBy.default,
      decrepify: slowFields.decrepify.default,
      chilled: slowFields.chilled.default,
      lethargy: slowFields.lethargy.default,
    },
  },
  source:
    "calculator.js:8-13 constants.js:502 index.html:26,44,58@bcc112d for the selects, field-values.ts for the numbers and checkboxes",
};

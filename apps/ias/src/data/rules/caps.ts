import type { CharacterId } from "@/contracts/build";

export const eiasLimits = {
  min: -85,
  max: 75,
  wereformMax: 150,
  source: "constants.js:137-139 calculator.js:1226-1228@bcc112d",
} as const;

export interface IasAccelerationCaps {
  readonly oneHanded: number;
  readonly twoHanded: number;
  readonly mercenary: number;
  /** Player characters that keep the one-handed cap with a two-handed primary weapon. */
  readonly twoHandedExempt: readonly CharacterId[];
  readonly source: string;
  readonly differenceFromGame: string;
}

export const iasAccelerationCaps: IasAccelerationCaps = {
  oneHanded: 88,
  twoHanded: 83,
  mercenary: 78,
  twoHandedExempt: [],
  source: "constants.js:141-143 calculator.js:50-54@bcc112d",
  differenceFromGame:
    "The Barbarian should keep 88 with a two-handed weapon (calculator.js:136, :262), but the table variable handler at calculator.js:51 runs last and ignores that exemption.",
};

export const weaponIasCaps = {
  acceleration: 60,
  displayMax: 120,
  source: "constants.js:140,144 calculator.js:56-63,760@bcc112d",
} as const;

export const firstRowFloor = {
  value: 0,
  source: "calculator.js:759@bcc112d",
  differenceFromGame: "A negative first row shows 0, so EIAS tables read 0, -84, -83…",
} as const;

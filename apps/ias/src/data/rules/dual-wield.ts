import type { CharacterId } from "@/contracts/build";

export interface WeaponSpeedAveraging {
  /** Characters that average both weapons with a dual-wield-only sequence skill. */
  readonly dualWieldSequenceCharacters: readonly CharacterId[];
  /** Characters that average both weapons whenever they hold a second weapon. */
  readonly dualWieldCharacters: readonly CharacterId[];
  readonly source: string;
}

export const weaponSpeedAveraging: WeaponSpeedAveraging = {
  dualWieldSequenceCharacters: ["barbarian", "assassin"],
  dualWieldCharacters: ["frenzy-barbarian"],
  source: "calculator.js:1106-1120@bcc112d",
};

import type { CharacterId } from "@/contracts/build";
import type { WeaponClass } from "@/contracts/game-data";

export interface MercenaryFrames {
  /** Frames per direction by weapon class; mercenaries have no action frame. */
  readonly frames: Partial<Readonly<Record<WeaponClass, number>>>;
  readonly source: string;
}

/** The generated game data covers the 8 player classes only. */
export const mercenaryFrames: Readonly<Partial<Record<CharacterId, MercenaryFrames>>> = {
  "rogue-scout": {
    frames: { hth: 15, bow: 15 },
    source: "constants.js:380,458@bcc112d",
  },
  "desert-mercenary": {
    frames: { hth: 16, "1ht": 16, "2ht": 16, stf: 16 },
    source: "constants.js:381,410,435,447@bcc112d",
  },
  "bash-barbarian": {
    frames: { hth: 16, "1hs": 16, "2hs": 16 },
    source: "constants.js:382,397,422@bcc112d",
  },
  "frenzy-barbarian": {
    frames: { hth: 16, "1hs": 16, "2hs": 16 },
    source: "constants.js:383,398,423@bcc112d",
  },
};

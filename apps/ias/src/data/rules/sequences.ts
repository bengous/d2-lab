import type { CharacterId } from "@/contracts/build";
import type { WeaponClass } from "@/contracts/game-data";

/** Frames per direction of a sequence skill, which replace the weapon animation. */
export type SequenceFrames =
  | {
      readonly kind: "constant";
      readonly frames: number;
      readonly dualWieldFrames?: number;
      readonly source: string;
    }
  | {
      readonly kind: "by-weapon-class";
      readonly frames: Partial<Readonly<Record<WeaponClass, number>>>;
      readonly byCharacter?: Partial<Readonly<Record<CharacterId, number>>>;
      readonly source: string;
    };

const clawSequence = {
  kind: "constant",
  frames: 12,
  dualWieldFrames: 16,
  source: "calculator.js:1254-1262@bcc112d, RuffnecKk dump",
} as const;

export const sequenceFrames = {
  jab: {
    kind: "by-weapon-class",
    frames: { "1ht": 18, "2ht": 21, hth: 13 },
    byCharacter: { "desert-mercenary": 14 },
    source: "calculator.js:1231-1241@bcc112d, RuffnecKk dump",
  },
  impale: {
    kind: "by-weapon-class",
    frames: { "1ht": 21, "2ht": 24, hth: 13 },
    source: "calculator.js:1242-1251@bcc112d, RuffnecKk dump",
  },
  doubleSwing: { kind: "constant", frames: 17, source: "calculator.js:1252@bcc112d" },
  frenzy: { kind: "constant", frames: 17, source: "calculator.js:1252@bcc112d" },
  doubleThrow: { kind: "constant", frames: 12, source: "calculator.js:1253@bcc112d" },
  claw: clawSequence,
  cleave: {
    kind: "by-weapon-class",
    frames: { "1hs": 16, "1ht": 16, "2hs": 18, "2ht": 20, stf: 22 },
    source: "calculator.js:1263-1271@bcc112d, RuffnecKk dump",
  },
  mirroredBlades: {
    kind: "by-weapon-class",
    frames: { hth: 17, "1hs": 16, "1ht": 16, "2hs": 19, "2ht": 21, bow: 18, xbw: 18, stf: 17 },
    source: "calculator.js:1272-1282@bcc112d, RuffnecKk dump",
  },
} as const satisfies Readonly<Record<string, SequenceFrames>>;

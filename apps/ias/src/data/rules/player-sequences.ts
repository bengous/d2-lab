import type {
  AnimationWeaponClass,
  Mode,
  SequenceStep,
  SequenceSteps,
} from "@/contracts/animation";

/** A sequence the game code holds, by the weapon class the player holds its weapons with. */
export interface PlayerSequence {
  readonly byWeaponClass: Partial<Readonly<Record<AnimationWeaponClass, SequenceSteps>>>;
  readonly source: string;
}

function play(mode: Mode, frames: readonly number[]): readonly SequenceStep[] {
  return frames.map((frame) => ({ mode, frame }));
}

function framesFrom(first: number, last: number): readonly number[] {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

/** `gPlayerSequenceHandToHand1`: one swing of `a1`. */
const handToHand: SequenceSteps = { steps: play("a1", framesFrom(0, 12)), hits: [8] };

/** The steps a Barbarian plays with two weapons; the game gives every weapon class the same. */
function barbarianDualWield(sequence: SequenceSteps): PlayerSequence["byWeaponClass"] {
  return { "1ss": sequence, "1js": sequence, "1jt": sequence, "1st": sequence };
}

const clawSequence: PlayerSequence = {
  byWeaponClass: {
    hth: { steps: play("a2", framesFrom(0, 11)), hits: [6] },
    ht1: { steps: play("a2", framesFrom(0, 11)), hits: [6] },
    ht2: {
      steps: [...play("a2", framesFrom(0, 6)), ...play("s4", framesFrom(3, 11))],
      hits: [6, 10],
    },
  },
  source: "D2MOO SequenceTbls.cpp:gPlayerWeaponsSequenceDragonClaw@5596f5c",
};

const doubleSwing: PlayerSequence = {
  byWeaponClass: barbarianDualWield({
    steps: [
      ...play("a1", [1, 2, 4, 6, 7, 9, 11, 13, 14]),
      ...play("s3", [2, 4, 5, 6, 8, 9, 10, 11]),
    ],
    hits: [4, 9],
  }),
  source: "D2MOO SequenceTbls.cpp:gPlayerWeaponsSequenceDoubleSwing@5596f5c",
};

/**
 * The hardcoded sequences the engine plays, by skill. Whirlwind's sequence hits every 4 steps
 * whatever the weapon, unlike the engine's table: it is left out. Cleave and Mirrored Blades have
 * no source.
 */
export const playerSequences: Partial<Readonly<Record<string, PlayerSequence>>> = {
  jab: {
    byWeaponClass: {
      hth: handToHand,
      "1ht": {
        steps: [
          ...play("a1", [5, 6, 8, 9, 10, 11, 13]),
          ...play("a2", [6, 8, 9]),
          ...play("a1", [10, 11, 13]),
          ...play("a2", [6, 8, 9, 10, 13]),
        ],
        hits: [3, 9, 15],
      },
      "2ht": {
        steps: [
          ...play("a1", [2, 7, 9, 10, 12, 13, 15]),
          ...play("a2", [4, 6, 9, 10]),
          ...play("a1", [12, 13, 15]),
          ...play("a2", [4, 6, 9, 10, 11, 13, 15]),
        ],
        hits: [3, 10, 17],
      },
    },
    source: "D2MOO SequenceTbls.cpp:gPlayerWeaponsSequenceJab@5596f5c",
  },
  impale: {
    byWeaponClass: {
      hth: handToHand,
      "1ht": {
        steps: play("a1", [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, ...framesFrom(5, 14)]),
        hits: [13],
      },
      "2ht": {
        steps: play("a1", [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, ...framesFrom(5, 17)]),
        hits: [15],
      },
    },
    source: "D2MOO SequenceTbls.cpp:gPlayerWeaponsSequenceImpale@5596f5c",
  },
  "fists-of-fire": clawSequence,
  "claws-of-thunder": clawSequence,
  "blades-of-ice": clawSequence,
  "dragon-claw": clawSequence,
  "double-swing": doubleSwing,
  frenzy: doubleSwing,
  "double-throw": {
    byWeaponClass: barbarianDualWield({
      steps: [...play("th", [2, 3, 4, 6, 7, 8]), ...play("s3", [2, 4, 5, 7, 8, 10])],
      hits: [5, 9],
    }),
    source: "D2MOO SequenceTbls.cpp:gPlayerWeaponsSequenceDoubleThrow@5596f5c",
  },
};

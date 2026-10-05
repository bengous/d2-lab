import { expect, test } from "bun:test";

import type { AnimationWeaponClass, SequenceSteps } from "@/contracts/animation";
import type { CharacterId } from "@/contracts/build";
import { gameData } from "@/data/generated/game-data";
import { playerSequences } from "@/data/rules/player-sequences";
import type { SequenceFrames } from "@/data/rules/sequences";
import { parseSkillId, skillRule } from "@/data/rules/skills";

const players: Readonly<Record<string, CharacterId>> = {
  jab: "amazon",
  impale: "amazon",
  "fists-of-fire": "assassin",
  "claws-of-thunder": "assassin",
  "blades-of-ice": "assassin",
  "dragon-claw": "assassin",
  "double-swing": "barbarian",
  frenzy: "barbarian",
  "double-throw": "barbarian",
};

const oneWeapon: readonly AnimationWeaponClass[] = ["hth", "1ht", "2ht", "ht1"];

const twoWeapons: readonly AnimationWeaponClass[] = ["1ss", "1js", "1jt", "1st", "ht2"];

interface Sequence {
  readonly skill: string;
  readonly weaponClass: AnimationWeaponClass;
  readonly steps: SequenceSteps;
}

const sequences: readonly Sequence[] = Object.keys(players).flatMap((skill) =>
  [...oneWeapon, ...twoWeapons].flatMap((weaponClass) => {
    const steps = playerSequences[skill]?.byWeaponClass[weaponClass];

    return steps === undefined ? [] : [{ skill, weaponClass, steps }];
  }),
);

function tableFrames(frames: SequenceFrames, weaponClass: AnimationWeaponClass): number | null {
  if (frames.kind === "by-weapon-class") {
    return (
      Object.entries(frames.frames).find(
        ([held]: readonly [string, number]) => held === weaponClass,
      )?.[1] ?? null
    );
  }

  return twoWeapons.includes(weaponClass)
    ? (frames.dualWieldFrames ?? frames.frames)
    : frames.frames;
}

test("the engine plays the hardcoded sequences of 9 skills, Whirlwind excepted", () => {
  expect(Object.keys(playerSequences).toSorted()).toEqual(Object.keys(players).toSorted());
});

test("each sequence has the length the tables count for its skill and weapon class", () => {
  expect(
    sequences.flatMap(({ skill, weaponClass, steps }) => {
      const rule = skillRule(parseSkillId(skill));
      const frames = rule.family === "sequence" ? tableFrames(rule.sequence, weaponClass) : null;

      return frames === steps.steps.length
        ? []
        : [`${skill} ${weaponClass}: ${steps.steps.length} steps, ${frames} frames`];
    }),
  ).toEqual([]);
});

test("each step shows a sprite frame of the game's animation in its mode", () => {
  expect(
    sequences.flatMap(({ skill, weaponClass, steps }) =>
      steps.steps.flatMap(({ mode, frame }) => {
        const character = players[skill];
        const animation =
          character === undefined
            ? undefined
            : gameData.animations[character]?.[`${mode}${weaponClass}`];

        return animation !== undefined && frame < animation.framesPerDirection
          ? []
          : [`${skill} ${mode}${weaponClass} ${frame}`];
      }),
    ),
  ).toEqual([]);
});

test("each hit lands on a step of its sequence, in order", () => {
  expect(
    sequences.filter(({ steps }) =>
      steps.hits.some(
        (step, index) => step >= steps.steps.length || step <= (steps.hits[index - 1] ?? -1),
      ),
    ),
  ).toEqual([]);
});

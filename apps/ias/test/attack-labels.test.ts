import { describe, expect, test } from "bun:test";

import { parseSkillId } from "@/data/rules/skills";
import {
  attackSentence,
  type AttackSentence,
  comparisonText,
  counterText,
  hitGroupText,
  moveOf,
  sceneLabel,
  sequenceSentence,
  unavailableText,
} from "@/ui/screens/attack-labels";

const attack = moveOf(parseSkillId("standard"));

const dodge = moveOf(parseSkillId("dodge"));

function read({ lead, detail }: AttackSentence): string {
  return `${lead.map(({ text }) => text).join("")} ${detail}`;
}

describe("a rollback skill reads its total, then each hit", () => {
  test("five Zeal hits", () => {
    expect(
      read(
        sequenceSentence({
          skill: "Zeal",
          character: "Paladin",
          hits: [5, 5, 5, 5, 10],
          fullRollback: true,
        }),
      ),
    ).toBe(
      "One Zeal makes 5 hits in 30 frames: 1.20 seconds. Hits 1 to 4 take 5 frames each: the Paladin strikes, then snaps back without finishing the swing. Hit 5 takes 10 frames: it finishes the swing.",
    );
  });

  test.each([
    { hits: [5, 10], before: "Hit 1 takes 5 frames" },
    { hits: [9, 5, 15], before: "Hits 1 and 2 take 9 and 5 frames" },
    {
      hits: [9, 5, 5, 5, 5, 14],
      before: "Hit 1 takes 9 frames, then hits 2 to 5 take 5 frames each",
    },
    {
      hits: [9, 4, 5, 5, 5, 14],
      before: "Hits 1 and 2 take 9 and 4 frames, then hits 3 to 5 take 5 frames each",
    },
    {
      hits: [6, 4, 3, 4, 3, 9],
      before: "Hit 1 takes 6 frames, then hits 2 to 5 take 4 and 3 frames in turn",
    },
    {
      hits: [8, 5, 4, 5, 13],
      before: "Hit 1 takes 8 frames, then hits 2 to 4 take 5 and 4 frames in turn",
    },
    { hits: [9, 4, 5, 14], before: "Hits 1 to 3 take 9, 4 and 5 frames" },
  ])("$hits", ({ hits, before }) => {
    expect(
      sequenceSentence({ skill: "Strafe", character: "Amazon", hits, fullRollback: false }).detail,
    ).toStartWith(
      `${before}: the Amazon strikes, then snaps back part of the way without finishing the swing.`,
    );
  });
});

test("an attack names the frame of each hit it lands", () => {
  expect([
    read(attackSentence(attack, 10, [6])),
    read(attackSentence(attack, 23, [5, 13, 20])),
  ]).toEqual([
    "Your attack takes 10 frames: 0.40 seconds. The hit lands on frame 6. The game runs at 25 frames per second, so you attack 2.50 times per second.",
    "Your attack takes 23 frames: 0.92 seconds. The hits land on frames 5, 13 and 20. The game runs at 25 frames per second, so you attack 1.09 times per second.",
  ]);
});

test("a dodge reads its length alone: it lands no hit", () => {
  expect([read(attackSentence(dodge, 9, [])), sceneLabel("Amazon", dodge)]).toEqual([
    "Your dodge takes 9 frames: 0.36 seconds. The game runs at 25 frames per second. A dodge lands no hit.",
    "Amazon dodging at the current breakpoint",
  ]);
});

test("an animation the engine lacks may come later; one the game lacks never will", () => {
  expect([
    unavailableText("Cleave", "not-modeled"),
    unavailableText("Smite", "no-animation"),
  ]).toEqual([
    "Animation not available for Cleave yet",
    "The game has no Smite animation with this weapon.",
  ]);
});

test("the film strip names each hit, and the last one", () => {
  expect([hitGroupText(1, 5, 5), hitGroupText(5, 5, 10)]).toEqual([
    "Hit 1 · 5 frames (0.20 s)",
    "Hit 5, the last · 10 frames (0.40 s)",
  ]);
});

test("the counter names the hit when the attack makes several", () => {
  expect([counterText(3, 10, 1, 1), counterText(3, 5, 2, 5)]).toEqual([
    "frame 3 of 10",
    "hit 2 of 5 · frame 3 of 5",
  ]);
});

describe("the next breakpoint compares one use of the skill", () => {
  const comparison = { move: attack, variable: "ias", current: 20 } as const;

  test.each([
    {
      hits: 1,
      frames: 10,
      next: 9,
      summary: "With 4 more IAS (24): 9 frames instead of 10, 0.04 s faster per attack.",
    },
    {
      hits: 5,
      frames: 30,
      next: 29,
      summary: "With 4 more IAS (24): 29 frames instead of 30, 0.04 s faster for the 5 hits.",
    },
    {
      hits: 6,
      frames: 42,
      next: 42,
      summary: "With 4 more IAS (24): still 42 frames for the 6 hits.",
    },
    {
      hits: 5,
      frames: 18,
      next: 19,
      summary: "With 4 more IAS (24): 19 frames instead of 18, 0.04 s slower for the 5 hits.",
    },
  ])("$hits hits, $frames then $next frames", ({ hits, frames, next, summary }) => {
    expect(
      comparisonText({ ...comparison, hits, frames, next: { value: 24, frames: next } }).summary,
    ).toBe(summary);
  });

  test("one dodge", () => {
    expect(
      comparisonText({
        ...comparison,
        move: dodge,
        hits: 1,
        frames: 9,
        next: { value: 24, frames: 8 },
      }).summary,
    ).toBe("With 4 more IAS (24): 8 frames instead of 9, 0.04 s faster per dodge.");
  });
});

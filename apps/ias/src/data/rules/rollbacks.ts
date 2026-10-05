/** Hits of a rollback skill: each hit rolls the animation back by `factor` percent. */
export interface RollbackRule {
  readonly factor: number;
  readonly hits: number;
  /** Frames removed from the first hit; Fury keeps the 1 of simple skills (constants.js:351). */
  readonly firstHitOffset: 0 | 1;
  /** Frames per direction of the last hit; `null` uses the skill's frames per direction. */
  readonly lastHitFrames: number | null;
  /** Strafe and Fend also show the table of an odd number of hits. */
  readonly oddHitsTable: boolean;
  readonly source: string;
}

export const rollbacks = {
  fury: {
    factor: 70,
    hits: 3,
    firstHitOffset: 1,
    lastHitFrames: 13,
    oddHitsTable: false,
    source: "calculator.js:806,1065,1083,1091@bcc112d",
  },
  strafe: {
    factor: 50,
    hits: 4,
    firstHitOffset: 0,
    lastHitFrames: null,
    oddHitsTable: true,
    source: "calculator.js:874,1084,1092@bcc112d",
  },
  fend: {
    factor: 30,
    hits: 4,
    firstHitOffset: 0,
    lastHitFrames: null,
    oddHitsTable: true,
    source: "calculator.js:874,1085,1092@bcc112d",
  },
  zeal: {
    factor: 100,
    hits: 1,
    firstHitOffset: 0,
    lastHitFrames: null,
    oddHitsTable: false,
    source: "calculator.js:1086,1090@bcc112d",
  },
  dragonTalon: {
    factor: 100,
    hits: 1,
    firstHitOffset: 0,
    lastHitFrames: null,
    oddHitsTable: false,
    source: "calculator.js:1086,1090@bcc112d",
  },
} as const satisfies Readonly<Record<string, RollbackRule>>;

/** The hit counts the attack view offers for one use of a rollback skill. */
export interface HitCountChoice {
  readonly min: number;
  readonly max: number;
  /** `null` starts at the hits of the breakpoint table. */
  readonly start: number | null;
  readonly source: string;
}

export const hitCountChoices: {
  readonly bySkill: Partial<Readonly<Record<string, HitCountChoice>>>;
  readonly other: HitCountChoice;
} = {
  bySkill: {
    zeal: {
      min: 2,
      max: 5,
      start: 5,
      source:
        "skilldesc.txt:zeal desccalca3 min(par5 + lvl - 1, par6), skills.txt:Zeal Param5,Param6@3.3.93847",
    },
  },
  other: {
    min: 2,
    max: 10,
    start: null,
    source: "decision: the other sequences start at the hit count the engine models",
  },
};

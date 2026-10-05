import type { SkillId } from "@/contracts/build";
import { amazonSorceressStartingFrames } from "@/data/rules/animation";
import { rollbacks } from "@/data/rules/rollbacks";
import { sequenceFrames } from "@/data/rules/sequences";
import type { SkillRule } from "@/data/rules/skill-rule";

/** Sequence skills lose 30 SIAS on player characters, Whirlwind excepted. */
export const sequenceSiasPenalty = {
  sias: -30,
  source: "calculator.js:1207-1208@bcc112d",
} as const;

const weaponFrames = { kind: "weapon" } as const;

const animationFrames = { kind: "animation" } as const;

const actionFrame = { kind: "action" } as const;

const traits = {
  canDualWield: false,
  dualWieldOnly: false,
  firstHitFrames: animationFrames,
  animationSpeed: "weapon",
  siasModifier: 0,
  siasOnly: false,
  oneHandedGrip: false,
  offHandTable: false,
} as const;

const simple = { ...traits, family: "simple", frames: weaponFrames } as const;

const clawSequence = {
  ...traits,
  family: "sequence",
  sequence: sequenceFrames.claw,
  canDualWield: true,
  animationSpeed: 256,
} as const;

const skillRules = {
  standard: {
    ...simple,
    name: "Standard",
    canDualWield: true,
    startingFrames: amazonSorceressStartingFrames,
    offHandTable: true,
    source: "constants.js:317 calculator.js:700-713@bcc112d",
  },
  throw: {
    ...simple,
    name: "Throw",
    frames: { kind: "weapon-class", weaponClass: "th" },
    source: "constants.js:318 calculator.js:1157-1158@bcc112d",
  },
  kick: {
    ...simple,
    name: "Kick",
    frames: { kind: "fixed", frames: 12, byCharacter: { assassin: 13 } },
    characterAnimationSpeed: { character: "druid", weaponClasses: ["1hs", "2hs"], speed: 224 },
    source: "constants.js:319 calculator.js:1078,1149@bcc112d",
  },
  dodge: {
    ...simple,
    name: "Dodge",
    frames: { kind: "fixed", frames: 9 },
    siasOnly: true,
    skillLevelLabel: "Fanaticism",
    source: "constants.js:321 calculator.js:784,1102,1151,1203@bcc112d",
  },
  impale: {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.impale,
    name: "Impale",
    siasModifier: 30,
    source: "constants.js:322 calculator.js:1214-1215@bcc112d",
  },
  jab: {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.jab,
    name: "Jab",
    source: "constants.js:323@bcc112d",
  },
  strafe: {
    ...traits,
    family: "rollback",
    frames: weaponFrames,
    rollback: rollbacks.strafe,
    name: "Strafe",
    firstHitFrames: actionFrame,
    mainTableWeaponClass: "xbw",
    source: "constants.js:324 calculator.js:725,1057@bcc112d",
  },
  fend: {
    ...traits,
    family: "rollback",
    frames: weaponFrames,
    rollback: rollbacks.fend,
    name: "Fend",
    firstHitFrames: actionFrame,
    startingFrames: amazonSorceressStartingFrames,
    source: "constants.js:325 calculator.js:1057@bcc112d",
  },
  "tiger-strike": { ...simple, name: "Tiger Strike", source: "constants.js:327@bcc112d" },
  "cobra-strike": { ...simple, name: "Cobra Strike", source: "constants.js:328@bcc112d" },
  "phoenix-strike": { ...simple, name: "Phoenix Strike", source: "constants.js:329@bcc112d" },
  "fists-of-fire": {
    ...clawSequence,
    name: "Fists of Fire",
    source: "constants.js:330 calculator.js:1176-1177@bcc112d",
  },
  "claws-of-thunder": {
    ...clawSequence,
    name: "Claws of Thunder",
    source: "constants.js:331 calculator.js:1176-1177@bcc112d",
  },
  "blades-of-ice": {
    ...clawSequence,
    name: "Blades of Ice",
    source: "constants.js:332 calculator.js:1176-1177@bcc112d",
  },
  "dragon-claw": {
    ...clawSequence,
    name: "Dragon Claw",
    dualWieldOnly: true,
    source: "constants.js:333 calculator.js:1176-1177@bcc112d",
  },
  "dragon-tail": {
    ...simple,
    name: "Dragon Tail",
    frames: { kind: "fixed", frames: 13 },
    animationSpeed: 256,
    siasModifier: -40,
    source: "constants.js:334 calculator.js:1159,1177,1212-1213@bcc112d",
  },
  "dragon-talon": {
    ...traits,
    family: "rollback",
    frames: { kind: "fixed", frames: 13 },
    rollback: rollbacks.dragonTalon,
    name: "Dragon Talon",
    firstHitFrames: { kind: "action", frame: 4 },
    animationSpeed: 256,
    source: "constants.js:335 calculator.js:1057,1159,1177,1297@bcc112d",
  },
  "laying-traps": {
    ...simple,
    name: "Laying Traps",
    frames: { kind: "fixed", frames: 8 },
    animationSpeed: 128,
    source: "constants.js:336 calculator.js:1163,1174@bcc112d",
  },
  "double-swing": {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.doubleSwing,
    name: "Double Swing",
    canDualWield: true,
    dualWieldOnly: true,
    siasModifier: 50,
    source: "constants.js:338 calculator.js:1210-1211@bcc112d",
  },
  frenzy: {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.frenzy,
    name: "Frenzy",
    canDualWield: true,
    dualWieldOnly: true,
    source: "constants.js:339@bcc112d",
  },
  taunt: { ...simple, name: "Taunt", canDualWield: true, source: "constants.js:340@bcc112d" },
  "double-throw": {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.doubleThrow,
    name: "Double Throw",
    canDualWield: true,
    dualWieldOnly: true,
    source: "constants.js:341@bcc112d",
  },
  whirlwind: {
    ...traits,
    family: "whirlwind",
    frames: weaponFrames,
    name: "Whirlwind",
    canDualWield: true,
    firstHitFrames: actionFrame,
    oneHandedGrip: true,
    source: "constants.js:342 calculator.js:714-723,853,1057,1298@bcc112d",
  },
  concentrate: { ...simple, name: "Concentrate", source: "constants.js:343@bcc112d" },
  berserk: {
    ...simple,
    name: "Berserk",
    startingFrames: amazonSorceressStartingFrames,
    source:
      "constants.js:344@bcc112d skills.txt:Berserk@3.3.93847 D2MOO Units.cpp:UNITS_GetFrameBonus@5596f5c",
  },
  bash: { ...simple, name: "Bash", source: "constants.js:345@bcc112d" },
  stun: { ...simple, name: "Stun", source: "constants.js:346@bcc112d" },
  "feral-rage": { ...simple, name: "Feral Rage", source: "constants.js:348@bcc112d" },
  hunger: {
    ...simple,
    name: "Hunger",
    firstHitFrames: { kind: "fixed", frames: 10 },
    source: "constants.js:349 calculator.js:1054@bcc112d",
  },
  rabies: {
    ...simple,
    name: "Rabies",
    firstHitFrames: { kind: "fixed", frames: 10 },
    source: "constants.js:350 calculator.js:1054@bcc112d",
  },
  fury: {
    ...traits,
    family: "rollback",
    frames: weaponFrames,
    rollback: rollbacks.fury,
    name: "Fury",
    firstHitFrames: { kind: "fixed", frames: 7 },
    source: "constants.js:351 calculator.js:1053@bcc112d",
  },
  zeal: {
    ...traits,
    family: "rollback",
    frames: weaponFrames,
    rollback: rollbacks.zeal,
    name: "Zeal",
    firstHitFrames: actionFrame,
    startingFrames: amazonSorceressStartingFrames,
    source: "constants.js:353 calculator.js:1057@bcc112d",
  },
  smite: {
    ...simple,
    name: "Smite",
    frames: { kind: "fixed", frames: 12 },
    source: "constants.js:354 calculator.js:1161@bcc112d",
  },
  sacrifice: { ...simple, name: "Sacrifice", source: "constants.js:355@bcc112d" },
  vengeance: { ...simple, name: "Vengeance", source: "constants.js:356@bcc112d" },
  conversion: { ...simple, name: "Conversion", source: "constants.js:357@bcc112d" },
  cleave: {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.cleave,
    name: "Cleave",
    source: "constants.js:359@bcc112d",
  },
  "mirrored-blades": {
    ...traits,
    family: "sequence",
    sequence: sequenceFrames.mirroredBlades,
    name: "Mirrored Blades",
    source: "constants.js:360@bcc112d",
  },
} as const satisfies Readonly<Record<string, SkillRule>>;

const rulesBySlug: ReadonlyMap<string, SkillRule> = new Map(Object.entries(skillRules));

export function isSkillId(value: string): value is SkillId {
  return rulesBySlug.has(value);
}

export function parseSkillId(value: string): SkillId {
  if (!isSkillId(value)) {
    throw new Error(`unknown skill id: ${value}`);
  }

  return value;
}

export function skillRule(id: SkillId): SkillRule {
  const rule = rulesBySlug.get(id);

  if (rule === undefined) {
    throw new Error(`unknown skill id: ${id}`);
  }

  return rule;
}

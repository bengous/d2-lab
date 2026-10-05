import type { FrameData, WeaponClass } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { oneHandedGrip, weaponAnimationSpeeds, wereformFrames } from "@/data/rules/animation";
import { mercenaryFrames } from "@/data/rules/mercenary-frames";
import type { SequenceFrames } from "@/data/rules/sequences";
import type { Context } from "@/engine/context";

function frameData(context: Context, weaponClass: WeaponClass): FrameData {
  const { character } = context.build;
  const player = gameData.frames[weaponClass][character];

  if (player !== undefined) {
    return player;
  }

  const mercenary = mercenaryFrames[character]?.frames[weaponClass];

  if (mercenary === undefined) {
    throw new Error(`no ${weaponClass} animation for ${character}`);
  }

  return { framesPerDirection: mercenary, alternate: null, actionFrame: null };
}

/** Source: calculator.js:1153,1298@bcc112d. */
export function gripClass(
  context: Context,
  weaponClass: WeaponClass,
  forActionFrame: boolean,
): WeaponClass {
  const { build } = context;
  const heldInOneHand =
    build.oneHanded || context.dualWielding || (forActionFrame && context.skill.oneHandedGrip);

  return build.character === oneHandedGrip.character &&
    weaponClass === oneHandedGrip.from &&
    heldInOneHand
    ? oneHandedGrip.to
    : weaponClass;
}

/** Source: calculator.js:1230-1285@bcc112d. */
function sequenceFrames(
  context: Context,
  sequence: SequenceFrames,
  weaponClass: WeaponClass,
): number {
  if (sequence.kind === "constant") {
    return context.dualWielding && sequence.dualWieldFrames !== undefined
      ? sequence.dualWieldFrames
      : sequence.frames;
  }

  const frames = sequence.byCharacter?.[context.build.character] ?? sequence.frames[weaponClass];

  if (frames === undefined) {
    throw new Error(`no sequence frames for ${context.build.skill} with ${weaponClass}`);
  }

  return frames;
}

/** Frames per direction of the skill with a weapon class. Source: calculator.js:1147-1170@bcc112d. */
export function framesPerDirection(context: Context, weaponClass: WeaponClass): number {
  const { skill } = context;

  if (skill.family === "sequence") {
    return sequenceFrames(context, skill.sequence, gripClass(context, weaponClass, false));
  }

  if (skill.frames.kind === "fixed") {
    return skill.frames.byCharacter?.[context.build.character] ?? skill.frames.frames;
  }

  if (skill.frames.kind === "weapon-class") {
    return frameData(context, skill.frames.weaponClass).framesPerDirection;
  }

  return frameData(context, gripClass(context, weaponClass, false)).framesPerDirection;
}

/** Source: calculator.js:1296-1300@bcc112d. */
export function actionFrame(context: Context, weaponClass: WeaponClass): number {
  const frame = frameData(context, gripClass(context, weaponClass, true)).actionFrame;

  if (frame === null) {
    throw new Error(`no ${weaponClass} action frame for ${context.build.character}`);
  }

  return frame;
}

/** Frames per direction of the first hit. Source: calculator.js:1050-1059@bcc112d. */
export function firstHitFrames(context: Context, weaponClass: WeaponClass): number {
  const { build, skill } = context;
  const first = skill.firstHitFrames;

  if (first.kind === "fixed") {
    return first.frames;
  }

  if (build.wereform !== "none") {
    return wereformFrames[build.wereform].firstHitFrames;
  }

  if (first.kind === "action") {
    return first.frame ?? actionFrame(context, weaponClass);
  }

  return framesPerDirection(context, weaponClass);
}

/** Source: calculator.js:1077-1080,1172-1183@bcc112d. */
export function animationSpeed(
  context: Context,
  weaponClass: WeaponClass,
  firstHit: number,
): number {
  const { skill } = context;
  const byCharacter = skill.characterAnimationSpeed;

  if (
    byCharacter !== undefined &&
    byCharacter.character === context.build.character &&
    byCharacter.weaponClasses.includes(context.primary.weaponClass)
  ) {
    return byCharacter.speed;
  }

  if (skill.animationSpeed !== "weapon") {
    return skill.animationSpeed;
  }

  const { claw } = weaponAnimationSpeeds;

  if (weaponClass === claw.weaponClass) {
    return firstHit === claw.alternateFrames ? claw.alternateSpeed : claw.speed;
  }

  return weaponAnimationSpeeds.base;
}

/** Source: calculator.js:1287-1294@bcc112d. */
export function startingFrame(context: Context, weaponClass: WeaponClass): number {
  const starting = context.skill.startingFrames;

  if (starting === undefined || !starting.characters.includes(context.build.character)) {
    return 0;
  }

  return starting.byWeaponClass[weaponClass] ?? 0;
}

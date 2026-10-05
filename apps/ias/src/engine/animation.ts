import type {
  AnimationFrames,
  AnimationName,
  AnimationWeaponClass,
  Clip,
  Mode,
  SequenceSteps,
  Shield,
  Tick,
  Timeline,
  Unavailable,
} from "@/contracts/animation";
import type { Build } from "@/contracts/build";
import type { MonsterLook } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { playerSequences } from "@/data/rules/player-sequences";
import type { RollbackRule } from "@/data/rules/rollbacks";
import {
  animationWeaponClasses,
  characterTokens,
  dualWieldWeaponClasses,
  holyShield,
  leftHandWeaponClasses,
  shieldSkills,
  skillsWithoutHit,
  spriteOutfit,
} from "@/data/rules/sprites";
import { currentAttack, currentRollback } from "@/engine/acceleration";
import { type Context, resolveContext } from "@/engine/context";
import { firstHitFrames, gripClass } from "@/engine/frames";

/**
 * What a build plays: the clip, then one mode and the sprite frame where the hit lands, `null` for
 * a skill that lands none, or the steps of a hardcoded sequence.
 */
type Played =
  | {
      readonly kind: "swing";
      readonly clip: Clip;
      readonly mode: Mode;
      readonly actionFrame: number | null;
    }
  | { readonly kind: "sequence"; readonly clip: Clip; readonly sequence: SequenceSteps };

type Swing = Extract<Played, { readonly kind: "swing" }>;

/** One position per game frame, from sprite frame `start` at `speed`. */
function positions(start: number, speed: number, frames: number): readonly number[] {
  return Array.from({ length: frames }, (_, tick) => start + (tick * speed) / 256);
}

function ticksOf(
  mode: Mode,
  swing: readonly number[],
  landsOn: number,
  hit: number,
): readonly Tick[] {
  return swing.map((position, tick) => ({ mode, position, hit: tick === landsOn ? hit : null }));
}

/**
 * The first position that reaches the action frame. The tables can end an attack before it, at
 * extreme speeds (Hunger with 400 IAS): the hit then lands on the attack's last game frame.
 */
function reaching(swing: readonly number[], actionFrame: number): number {
  const index = swing.findIndex((position) => position >= actionFrame);

  return index === -1 ? swing.length - 1 : index;
}

/** The attack of the primary weapon; the hit lands on the action frame. */
function attackTicks(context: Context, { mode, actionFrame }: Swing): readonly Tick[] {
  const { weaponClass } = context.primary;
  const { speed, start, frames } = currentAttack(context, firstHitFrames(context, weaponClass));
  const swing = positions(start, speed, frames);

  return actionFrame === null
    ? swing.map((position) => ({ mode, position, hit: null }))
    : ticksOf(mode, swing, reaching(swing, actionFrame), 1);
}

/**
 * The steps of a hardcoded sequence, at the speed its table counts; each hit lands on the first
 * game frame that reaches its step.
 */
function sequenceTicks(context: Context, { steps, hits }: SequenceSteps): readonly Tick[] {
  const { weaponClass } = context.primary;
  const { speed, start, frames } = currentAttack(context, firstHitFrames(context, weaponClass));
  const swing = positions(start, speed, frames);
  const landings = hits.map((step) => reaching(swing, step));

  return swing.map((position, tick) => {
    const step = steps[Math.floor(position)];

    if (step === undefined) {
      throw new Error(`no step ${Math.floor(position)} in the ${context.build.skill} sequence`);
    }

    const hit = landings.indexOf(tick);

    return { mode: step.mode, position: step.frame, hit: hit === -1 ? null : hit + 1 };
  });
}

/**
 * The hits of one use, each as the tables count it. A rolled-back hit lands on its last game frame,
 * as the animation reaches the action frame and goes back; the last hit lands on the action frame.
 */
function rollbackTicks(
  context: Context,
  rollback: RollbackRule,
  mode: Mode,
  count: number,
): readonly (readonly Tick[])[] {
  const firstHit = firstHitFrames(context, context.primary.weaponClass);
  const { speed, hits } = currentRollback(context, rollback, firstHit, count);

  return hits.map(({ start, frames }, index) => {
    const swing = positions(start, speed, frames);
    const landsOn = index === hits.length - 1 ? reaching(swing, firstHit) : frames - 1;

    return ticksOf(mode, swing, landsOn, index + 1);
  });
}

/** Dodge avoids a blow instead of striking: its animation lands no hit. */
function landsHit(context: Context): boolean {
  return !skillsWithoutHit.skills.some((skill) => skill === context.build.skill);
}

/** How the build holds its weapons: the primary's class, or the class of the two together. */
function heldClass(context: Context): AnimationWeaponClass | null {
  const { build, primary, secondary } = context;
  const primaryClass = gripClass(context, primary.weaponClass, false);

  if (!context.dualWielding) {
    return animationWeaponClasses[primaryClass];
  }

  const dualWield = dualWieldWeaponClasses.byCharacter[build.character];
  const secondaryClass = gripClass(context, secondary.weaponClass, false);
  const pair = dualWield?.pairs.find(
    (candidate) => candidate.primary === primaryClass && candidate.secondary === secondaryClass,
  );

  return pair?.weaponClass ?? dualWield?.other ?? null;
}

function heldWeapons(context: Context, weaponClass: AnimationWeaponClass): Clip["weapons"] {
  const { primary, secondary } = context;

  if (context.dualWielding) {
    return { right: primary.graphic, left: secondary.graphic };
  }

  return leftHandWeaponClasses.weaponClasses.some((held) => held === weaponClass)
    ? { right: null, left: primary.graphic }
    : { right: primary.graphic, left: null };
}

/** Who plays the attack: its clip, its mode for the skill, its animations, its sequence steps. */
interface Actor {
  readonly clip: Clip;
  readonly mode: Mode | undefined;
  readonly animations: Partial<Readonly<Record<AnimationName, AnimationFrames>>> | undefined;
  /** For the mode `sq`; `null` when the engine has no steps for it. */
  readonly sequence: SequenceSteps | null;
}

/** A wereform or a mercenary: its own weapon and outfit, whatever the build's. */
function monsterClip({ token, weaponClass, components }: MonsterLook): Clip {
  const { rh = null, lh = null, ...outfit } = components;

  return { token, folder: "monsters", weaponClass, weapons: { right: rh, left: lh }, outfit };
}

/** The shield layer draws the chosen shield for a skill that needs one, Holy Shield's own if on. */
function playerOutfit(context: Context, shield: Shield): Clip["outfit"] {
  if (!shieldSkills.skills.some((skill) => skill === context.build.skill)) {
    return spriteOutfit.components;
  }

  return { ...spriteOutfit.components, sh: shield.holy ? holyShield.component : shield.graphic };
}

function playerActor(context: Context, shield: Shield): Actor | null {
  const { build } = context;
  const token = characterTokens[build.character];
  const weaponClass = heldClass(context);

  if (token === undefined || weaponClass === null) {
    return null;
  }

  return {
    clip: {
      token,
      folder: "chars",
      weaponClass,
      weapons: heldWeapons(context, weaponClass),
      outfit: playerOutfit(context, shield),
    },
    mode: gameData.skillModes[build.skill],
    animations: gameData.animations[build.character],
    sequence: playerSequences[build.skill]?.byWeaponClass[weaponClass] ?? null,
  };
}

/** A wereform plays the player's mode; a mercenary the mode `hireling.txt` gives, else the player's. */
function actorOf(context: Context, shield: Shield): Actor | null {
  const { build } = context;
  const mercenary = gameData.mercenaries[build.character];

  if (build.wereform !== "none") {
    const look = gameData.wereforms[build.wereform];

    return {
      clip: monsterClip(look),
      mode: gameData.skillModes[build.skill],
      animations: gameData.monsterAnimations[look.token],
      sequence: null,
    };
  }

  if (mercenary !== undefined) {
    return {
      clip: monsterClip(mercenary),
      mode: mercenary.skillModes[build.skill] ?? gameData.skillModes[build.skill],
      animations: gameData.monsterAnimations[mercenary.token],
      sequence: mercenary.sequence,
    };
  }

  return playerActor(context, shield);
}

const notModeled: Unavailable = { kind: "unavailable", reason: "not-modeled" };

function played(context: Context, shield: Shield): Played | Unavailable {
  const actor = actorOf(context, shield);

  if (actor === null || actor.mode === undefined) {
    return notModeled;
  }

  const { clip, mode } = actor;

  if (mode === "sq") {
    return actor.sequence === null
      ? notModeled
      : { kind: "sequence", clip, sequence: actor.sequence };
  }

  const name = `${mode}${clip.weaponClass}` as const;
  const animation = actor.animations?.[name];

  if (animation === undefined) {
    return { kind: "unavailable", reason: "no-animation" };
  }

  if (!landsHit(context)) {
    return { kind: "swing", clip, mode, actionFrame: null };
  }

  if (animation.actionFrame === null) {
    throw new Error(`animdata flags no action frame for ${clip.token}${name}`);
  }

  return { kind: "swing", clip, mode, actionFrame: animation.actionFrame };
}

/** The ticks of each hit the tables count: a hardcoded sequence counts one use. */
function playedTicks(
  context: Context,
  attack: Played,
  hitCount: number | null,
): readonly (readonly Tick[])[] {
  const { skill } = context;

  if (attack.kind === "sequence") {
    return [sequenceTicks(context, attack.sequence)];
  }

  return skill.family === "rollback"
    ? rollbackTicks(context, skill.rollback, attack.mode, hitCount ?? skill.rollback.hits + 2)
    : [attackTicks(context, attack)];
}

/**
 * `hitCount`: the hits of one use of a rollback skill, from 2; `null` makes the hits of its main
 * table. Every other skill plays the hits of its animation. `shield`: what a skill that needs a
 * shield draws; every other skill draws none.
 */
export function attackTimeline(
  build: Build,
  hitCount: number | null,
  shield: Shield,
): Timeline | Unavailable {
  const context = resolveContext(build);
  const attack = played(context, shield);

  if (attack.kind === "unavailable") {
    return attack;
  }

  const hits = playedTicks(context, attack, hitCount);

  return {
    kind: "timeline",
    clip: attack.clip,
    ticks: hits.flat(),
    hits: hits.map((ticks) => ticks.length),
  };
}

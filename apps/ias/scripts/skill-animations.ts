import { join } from "node:path";

import type {
  AnimationFrames,
  AnimationName,
  AnimationWeaponClass,
  Mode,
} from "@/contracts/animation";
import type { CharacterId } from "@/contracts/build";
import { playerSequences } from "@/data/rules/player-sequences";
import { parseSkillId } from "@/data/rules/skills";
import {
  animationWeaponClasses,
  characterTokens,
  dualWieldWeaponClasses,
} from "@/data/rules/sprites";

import { readAnimations } from "./animations";
import { cell, readTable, type GameCache } from "./game-files";

/**
 * The `skills.txt` row of each skill a player plays. Laying Traps stands for the trap skills, which
 * all play `S2`. Taunt is the Act 5 mercenary's: `hireling.txt` gives its mode.
 */
export const skillRows: Readonly<Record<string, string>> = {
  standard: "Attack",
  throw: "Throw",
  kick: "Kick",
  dodge: "Dodge",
  impale: "Impale",
  jab: "Jab",
  strafe: "Strafe",
  fend: "Fend",
  "tiger-strike": "Tiger Strike",
  "cobra-strike": "Cobra Strike",
  "phoenix-strike": "Royal Strike",
  "fists-of-fire": "Fists of Fire",
  "claws-of-thunder": "Claws of Thunder",
  "blades-of-ice": "Blades of Ice",
  "dragon-claw": "Dragon Claw",
  "dragon-tail": "Dragon Tail",
  "dragon-talon": "Dragon Talon",
  "laying-traps": "Lightning Sentry",
  "double-swing": "Double Swing",
  frenzy: "Frenzy",
  "double-throw": "Double Throw",
  whirlwind: "Whirlwind",
  concentrate: "Concentrate",
  berserk: "Berserk",
  bash: "Bash",
  stun: "Stun",
  "feral-rage": "Feral Rage",
  hunger: "Hunger",
  rabies: "Rabies",
  fury: "Fury",
  zeal: "Zeal",
  smite: "Smite",
  sacrifice: "Sacrifice",
  vengeance: "Vengeance",
  conversion: "Conversion",
  cleave: "Cleave",
  "mirrored-blades": "Mirrored Blades",
};

const modes: ReadonlySet<string> = new Set<Mode>([
  "a1",
  "a2",
  "th",
  "kk",
  "s1",
  "s2",
  "s3",
  "s4",
  "sq",
]);

export function isMode(value: string): value is Mode {
  return modes.has(value);
}

export type SkillModes = Readonly<Record<string, Mode>>;

/** `anim` of `skills.txt`, lowercase, by skill id. */
export async function extractSkillModes(cache: GameCache): Promise<SkillModes> {
  const rows = await readTable(join(cache.dir, "files/data/data/global/excel/skills.txt"), [
    "skill",
    "anim",
  ]);

  const anims = new Map(rows.map((row) => [cell(row, "skill"), cell(row, "anim").toLowerCase()]));

  return Object.fromEntries(
    Object.entries(skillRows).map(([skill, row]: readonly [string, string]) => {
      const anim = anims.get(row);

      if (anim === undefined || !isMode(anim)) {
        throw new Error(`skills.txt: ${row} plays "${anim ?? "no row"}", not a player mode`);
      }

      return [parseSkillId(skill), anim];
    }),
  );
}

export type PlayerAnimations = Partial<
  Readonly<Record<CharacterId, Partial<Readonly<Record<AnimationName, AnimationFrames>>>>>
>;

const weaponClasses = new Set([
  ...Object.values(animationWeaponClasses).filter(
    (weaponClass): weaponClass is AnimationWeaponClass =>
      weaponClass !== null && weaponClass !== animationWeaponClasses.source,
  ),
  ...Object.values(dualWieldWeaponClasses.byCharacter).flatMap(({ pairs, other }) =>
    pairs.map(({ weaponClass }) => weaponClass).concat(other),
  ),
]);

const sequenceModes = Object.values(playerSequences).flatMap((sequence) =>
  Object.values(sequence?.byWeaponClass ?? {}).flatMap(({ steps }) =>
    steps.map(({ mode }) => mode),
  ),
);

export function isAnimationWeaponClass(value: string): value is AnimationWeaponClass {
  return [...weaponClasses].some((weaponClass) => weaponClass === value);
}

/** Every animdata record of a player in `a1`, a skill's mode or a mode a sequence steps through. */
export async function extractPlayerAnimations(
  cache: GameCache,
  skillModes: SkillModes,
): Promise<PlayerAnimations> {
  const animations = await readAnimations(cache);
  const played = [...new Set<Mode>(["a1", ...Object.values(skillModes), ...sequenceModes])].filter(
    (mode) => mode !== "sq",
  );

  const names = played.flatMap((mode) =>
    [...weaponClasses].map((weaponClass): AnimationName => `${mode}${weaponClass}`),
  );

  return Object.fromEntries(
    Object.entries(characterTokens).flatMap(([character, token]: readonly [string, string]) =>
      character === "source"
        ? []
        : [
            [
              character,
              Object.fromEntries(
                names.flatMap((name) => {
                  const found = animations.get(`${token}${name}`.toUpperCase());

                  return found === undefined ? [] : [[name, found]];
                }),
              ),
            ],
          ],
    ),
  );
}

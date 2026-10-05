import type { AnimationWeaponClass, Clip, Mode, Shield, Timeline } from "@/contracts/animation";
import type { Build, CharacterId, WeaponId } from "@/contracts/build";
import { shieldGraphics, shieldSkills } from "@/data/rules/sprites";
import { attackTimeline } from "@/engine/animation";
import { weaponById } from "@/engine/context";
import { defaultBuild } from "@/engine/default-build";
import { resolveBuild } from "@/engine/normalize";
import { keysOf } from "@/lib/keys";

/** An animation the attack view plays, with every component it draws in each layer. */
export interface OfferedAnimation {
  readonly token: string;
  readonly folder: Clip["folder"];
  readonly mode: Mode;
  readonly weaponClass: AnimationWeaponClass;
  /** By layer code. */
  readonly components: ReadonlyMap<string, ReadonlySet<string>>;
}

interface Collected extends OfferedAnimation {
  readonly components: Map<string, Set<string>>;
}

const characters: Readonly<Record<CharacterId, true>> = {
  amazon: true,
  assassin: true,
  barbarian: true,
  druid: true,
  necromancer: true,
  paladin: true,
  sorceress: true,
  warlock: true,
  "rogue-scout": true,
  "desert-mercenary": true,
  "bash-barbarian": true,
  "frenzy-barbarian": true,
};

/** One weapon of each class and weapon graphic: the others draw the same clip. */
function distinctLooks(weapons: readonly WeaponId[]): readonly WeaponId[] {
  const looks = new Map(
    weapons.map((id) => {
      const { weaponClass, graphic } = weaponById(id);

      return [`${weaponClass}|${graphic}`, id] as const;
    }),
  );

  return [...looks.values()];
}

/**
 * Each primary weapon the form offers with the build's class and skill, held in one or two hands,
 * then each secondary weapon the form offers with it.
 */
function weaponBuilds(withSkill: Build): readonly Build[] {
  const { spec, normalized } = resolveBuild(withSkill);
  const grips = spec.fields.has("oneHanded") ? [false, true] : [false];

  return spec.primaryWeapons.flatMap((primary) =>
    grips.flatMap((oneHanded) => {
      const held = resolveBuild({ ...normalized, primary, oneHanded });

      return distinctLooks(held.spec.secondaryWeapons).map(
        (secondary) => resolveBuild({ ...held.normalized, secondary }).normalized,
      );
    }),
  );
}

/** Every build the form offers to each character, in each of its forms. */
function offeredBuilds(): readonly Build[] {
  return keysOf(characters).flatMap((character) => {
    const { spec, normalized } = resolveBuild({ ...defaultBuild, character });

    return spec.wereforms.flatMap((wereform) => {
      const formed = resolveBuild({ ...normalized, wereform });

      return formed.spec.skills.flatMap((skill) =>
        skill === "divider" ? [] : weaponBuilds({ ...formed.normalized, skill }),
      );
    });
  });
}

/** The component of each layer: the outfit, then the weapon graphic of each hand. */
function drawn({ outfit, weapons }: Clip): readonly (readonly [string, string])[] {
  return [
    ...Object.entries(outfit),
    ...(weapons.right === null ? [] : [["rh", weapons.right] as const]),
    ...(weapons.left === null ? [] : [["lh", weapons.left] as const]),
  ];
}

/** Every shield the attack view offers, Holy Shield's own included. */
const everyShield: readonly Shield[] = [
  ...shieldGraphics.graphics.map(({ graphic }) => ({ graphic, holy: false })),
  { ...shieldGraphics.start, holy: true },
];

function shieldsOf(build: Build): readonly Shield[] {
  return shieldSkills.skills.some((skill) => skill === build.skill)
    ? everyShield
    : [shieldGraphics.start];
}

function timelines(): readonly Timeline[] {
  return offeredBuilds().flatMap((build) =>
    shieldsOf(build).flatMap((shield) => {
      const timeline = attackTimeline(build, null, shield);

      return timeline.kind === "timeline" ? [timeline] : [];
    }),
  );
}

/** The animations of every build the form offers that the engine plays. */
export function offeredAnimations(): readonly OfferedAnimation[] {
  const offered = new Map<string, Collected>();

  for (const { clip, ticks } of timelines()) {
    for (const mode of new Set(ticks.map((tick) => tick.mode))) {
      const name = `${clip.token}${mode}${clip.weaponClass}`;
      const entry = offered.get(name) ?? {
        token: clip.token,
        folder: clip.folder,
        mode,
        weaponClass: clip.weaponClass,
        components: new Map<string, Set<string>>(),
      };

      for (const [code, component] of drawn(clip)) {
        entry.components.set(code, (entry.components.get(code) ?? new Set()).add(component));
      }

      offered.set(name, entry);
    }
  }

  return [...offered.values()];
}

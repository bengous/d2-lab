import type { CharacterId } from "@/contracts/build";
import type { WeaponClass } from "@/contracts/game-data";
import type { StartingFrames } from "@/data/rules/animation";
import type { RollbackRule } from "@/data/rules/rollbacks";
import type { SequenceFrames } from "@/data/rules/sequences";

/** Frames per direction of a skill that is not a sequence. */
export type FramesSource =
  | { readonly kind: "weapon" }
  | { readonly kind: "weapon-class"; readonly weaponClass: WeaponClass }
  | {
      readonly kind: "fixed";
      readonly frames: number;
      readonly byCharacter?: Partial<Readonly<Record<CharacterId, number>>>;
    };

/** Frames per direction of the first hit, before any wereform override except `fixed`. */
export type FirstHitFrames =
  | { readonly kind: "animation" }
  | { readonly kind: "action"; readonly frame?: number }
  | { readonly kind: "fixed"; readonly frames: number };

export interface CharacterAnimationSpeed {
  readonly character: CharacterId;
  readonly weaponClasses: readonly WeaponClass[];
  readonly speed: number;
}

export interface SkillTraits {
  /** Original display name. */
  readonly name: string;
  readonly canDualWield: boolean;
  readonly dualWieldOnly: boolean;
  readonly firstHitFrames: FirstHitFrames;
  readonly animationSpeed: number | "weapon";
  readonly characterAnimationSpeed?: CharacterAnimationSpeed;
  readonly startingFrames?: StartingFrames;
  /** SIAS added for player characters only. */
  readonly siasModifier: number;
  /** Only SIAS speeds the skill: no weapon speed, no IAS, no Decrepify. */
  readonly siasOnly: boolean;
  /** Treats a Barbarian two-handed sword as held in one hand for the action frame. */
  readonly oneHandedGrip: boolean;
  /** The first table shows only with this primary weapon class. */
  readonly mainTableWeaponClass?: WeaponClass;
  /** A human player dual wielding also sees the off-hand table. */
  readonly offHandTable: boolean;
  /** Header of the skill-level column when it is not "Skill Level". */
  readonly skillLevelLabel?: string;
  readonly source: string;
}

export type SkillRule = SkillTraits &
  (
    | { readonly family: "simple" | "whirlwind"; readonly frames: FramesSource }
    | { readonly family: "sequence"; readonly sequence: SequenceFrames }
    | {
        readonly family: "rollback";
        readonly frames: FramesSource;
        readonly rollback: RollbackRule;
      }
  );

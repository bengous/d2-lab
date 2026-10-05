import type {
  AnimationFrames,
  AnimationName,
  AnimationWeaponClass,
  LayerCode,
  Mode,
  SequenceSteps,
} from "@/contracts/animation";
import type { CharacterId, WeaponId, Wereform } from "@/contracts/build";

export type WeaponClass =
  | "hth"
  | "ht"
  | "1hs"
  | "1ht"
  | "2hs"
  | "2ht"
  | "stf"
  | "bow"
  | "xbw"
  | "th";

export type ItemClass =
  | "none"
  | "axe"
  | "dagger"
  | "polearm"
  | "javelin"
  | "spear"
  | "sword"
  | "mace"
  | "missile"
  | "staff"
  | "orb"
  | "claw"
  | "throwing";

export type WeaponTier = "normal" | "exceptional" | "elite";

/** The weapons.txt row of a weapon base. */
export interface WeaponItem {
  /** The row's `code` equals its `normcode`, `ubercode` or `ultracode`. */
  readonly tier: WeaponTier;
  /** `normcode`: the code of the normal base, shared by the three tiers. */
  readonly family: string;
  /** Position of the row in weapons.txt, from 1. */
  readonly row: number;
  /** Basename of the HD sprite that `hd/items/items.json` names for the code, like `hand_axe`. */
  readonly icon: string;
}

export interface WeaponData {
  readonly id: WeaponId;
  readonly code: string;
  readonly name: string;
  readonly wsm: number;
  readonly weaponClass: WeaponClass;
  readonly itemClass: ItemClass;
  readonly twoHanded: boolean;
  readonly oneOrTwoHanded: boolean;
  readonly restrictedTo: CharacterId | null;
  /** The `type` of `weapons.txt`, then its `Equiv1` and `Equiv2` ancestors in `itemtypes.txt`. */
  readonly itemTypes: readonly string[];
  /** `gemsockets` of `weapons.txt`. */
  readonly maxSockets: number;
  /** `null` for `unarmed` only. */
  readonly item: WeaponItem | null;
  /**
   * `alternategfx` of `weapons.txt`: the component the weapon draws in a hand layer, `crs` for a
   * Phase Blade; `null` for `unarmed`.
   */
  readonly graphic: string | null;
}

/** The item types one hand must count as (`itype` of `skills.txt`) and must not (`etype`). */
export interface HandItemTypes {
  readonly itypes: readonly string[];
  readonly etypes: readonly string[];
}

/** One hand holds an item that matches `a`, the other an item that matches `b`. */
export interface SkillItemTypes {
  /** The `skills.txt` row: `Royal Strike` for Phoenix Strike. */
  readonly row: string;
  readonly a: HandItemTypes;
  readonly b: HandItemTypes;
}

export interface FrameData {
  readonly framesPerDirection: number;
  readonly alternate: number | null;
  readonly actionFrame: number | null;
}

/** Shape of the generated file `src/data/generated/game-data.ts`. */
export interface GameData {
  /** Read from `.build.info`, for example `3.3.93847`. */
  readonly version: string;
  /** 291 bases plus `unarmed`. */
  readonly weapons: readonly WeaponData[];
  readonly frames: Readonly<Record<WeaponClass, Partial<Readonly<Record<CharacterId, FrameData>>>>>;
  /** `anim` of `skills.txt` by skill id: the mode a player plays for each skill. */
  readonly skillModes: Readonly<Record<string, Mode>>;
  /** `itypea1-3`, `etypea1-2`, `itypeb1-3` and `etypeb1-2` of `skills.txt` by skill id. */
  readonly skillItemTypes: Readonly<Record<string, SkillItemTypes>>;
  /** animdata of every player animation in mode `a1`, a skill's mode or a sequence's mode. */
  readonly animations: Partial<
    Readonly<Record<CharacterId, Partial<Readonly<Record<AnimationName, AnimationFrames>>>>>
  >;
  /** animdata of the wereforms and mercenaries, by token. */
  readonly monsterAnimations: Readonly<
    Record<string, Partial<Readonly<Record<AnimationName, AnimationFrames>>>>
  >;
  readonly wereforms: Readonly<Record<Exclude<Wereform, "none">, MonsterLook>>;
  readonly mercenaries: Partial<Readonly<Record<CharacterId, MercenaryLook>>>;
}

/** A monster as the game draws it: `monstats.txt` `Code`, then `monstats2.txt`. */
export interface MonsterLook {
  readonly token: string;
  /** `BaseW`: a monster holds its own weapon, whatever the build's. */
  readonly weaponClass: AnimationWeaponClass;
  /** The first component `monstats2.txt` lists for each layer it draws, the hands included. */
  readonly components: Partial<Readonly<Record<LayerCode, string>>>;
}

export interface MercenaryLook extends MonsterLook {
  /** `hireling.txt` mode of each of its skills; `sq` plays `sequence`. */
  readonly skillModes: Readonly<Record<string, Mode>>;
  /** `monseq.txt` steps of its sequence skill. */
  readonly sequence: SequenceSteps | null;
}

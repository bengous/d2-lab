import type { WeaponClass } from "@/contracts/game-data";

/** A layer of a legacy character: head, torso, legs, arms, hands, shield, then the specials. */
export type LayerCode =
  | "hd"
  | "tr"
  | "lg"
  | "ra"
  | "la"
  | "rh"
  | "lh"
  | "sh"
  | "s1"
  | "s2"
  | "s3"
  | "s4"
  | "s5"
  | "s6"
  | "s7"
  | "s8";

export interface SpriteBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface SpriteLayer {
  readonly code: LayerCode;
  /** The weapon class its files carry, for example `1hs`, or `hth` for a bare layer. */
  readonly weaponClass: string;
  /** Each has the sheet `<code>-<component>.png`. */
  readonly components: readonly string[];
}

/** `manifest.json` of one animation, in `public/game/sprites/<token>/<mode><weapon class>/`. */
export interface SpriteManifest {
  /** Of the game's 64 directions. */
  readonly direction: number;
  /**
   * The box every sheet repeats once per sprite frame, from left to right, in pixels from the
   * sprite origin.
   */
  readonly box: SpriteBox;
  readonly frames: number;
  readonly layers: readonly SpriteLayer[];
  /** Per sprite frame, the layers from back to front. */
  readonly order: readonly (readonly LayerCode[])[];
}

/** Which animation a character plays: attacks, throw, kick, skills, a hardcoded sequence. */
export type Mode = "a1" | "a2" | "th" | "kk" | "s1" | "s2" | "s3" | "s4" | "sq";

/**
 * A `WeaponClass` as the animation files name it: one claw is `ht1`, two claws `ht2`, and a
 * Barbarian's two weapons `1ss`, `1js`, `1jt` or `1st`.
 */
export type AnimationWeaponClass =
  | Exclude<WeaponClass, "ht" | "th">
  | "ht1"
  | "ht2"
  | "1ss"
  | "1js"
  | "1jt"
  | "1st";

/** `<mode><weapon class>`, the end of an animdata name: `kk1hs` in `PAKK1HS`. */
export type AnimationName = `${Mode}${AnimationWeaponClass}`;

/** An animdata record. */
export interface AnimationFrames {
  readonly framesPerDirection: number;
  /** The first flagged sprite frame, where the hit lands; `null` when none is flagged. */
  readonly actionFrame: number | null;
}

/** The component each layer but the hands draws: `lit` for light armor, `fhm` for a helm. */
export type Outfit = Partial<Readonly<Record<LayerCode, string>>>;

/** The shield a skill that needs one draws: a shield graphic, unless Holy Shield draws its own. */
export interface Shield {
  /** `pa3` for a Heraldic Shield. */
  readonly graphic: string;
  readonly holy: boolean;
}

/** What the animation engine plays: the files of a character holding its weapons. */
export interface Clip {
  /** `pa` for the Paladin, `40` for the werewolf. */
  readonly token: string;
  readonly folder: "chars" | "monsters";
  readonly weaponClass: AnimationWeaponClass;
  /** The weapon graphic of each hand, `crs` for a Phase Blade. */
  readonly weapons: { readonly right: string | null; readonly left: string | null };
  /** A layer it lacks draws nothing. */
  readonly outfit: Outfit;
}

/** One step of a sequence: the mode it shows and its sprite frame. */
export interface SequenceStep {
  readonly mode: Mode;
  readonly frame: number;
}

/** The steps of one use, and the steps where a hit lands, from 0. */
export interface SequenceSteps {
  readonly steps: readonly SequenceStep[];
  readonly hits: readonly number[];
}

/** One game frame of the attack. */
export interface Tick {
  readonly mode: Mode;
  /** Sprite frame position; a sprite renderer floors it. */
  readonly position: number;
  /** The hit that lands on this game frame, from 1, or `null`. */
  readonly hit: number | null;
}

export interface Timeline {
  readonly kind: "timeline";
  readonly clip: Clip;
  /** One per game frame. */
  readonly ticks: readonly Tick[];
  /** Game frames of each hit, as `BreakpointRow.hits`. */
  readonly hits: readonly number[];
}

/**
 * `not-modeled`: the engine plays only some skills yet. `no-animation`: the game holds no
 * animation of the skill with the weapon.
 */
export interface Unavailable {
  readonly kind: "unavailable";
  readonly reason: "not-modeled" | "no-animation";
}

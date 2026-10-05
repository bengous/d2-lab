import type { AnimationWeaponClass, Outfit, Shield } from "@/contracts/animation";
import type { CharacterId } from "@/contracts/build";
import type { WeaponClass } from "@/contracts/game-data";

/** The folder of a player class under `global/chars/`, lowercase. */
export const characterTokens: Readonly<Partial<Record<CharacterId, string>>> & {
  readonly source: string;
} = {
  amazon: "am",
  sorceress: "so",
  necromancer: "ne",
  paladin: "pa",
  barbarian: "ba",
  druid: "dz",
  assassin: "ai",
  warlock: "wk",
  source: "plrtype.txt:Token@3.3.93847",
};

/**
 * The fixed outfit of a player: every body layer draws `lit`, light armor and a bare head, and the
 * shield layer draws nothing but for a skill in `shieldSkills`. The hand layers draw the build's
 * weapons.
 */
export const spriteOutfit: { readonly components: Outfit; readonly source: string } = {
  components: {
    hd: "lit",
    tr: "lit",
    lg: "lit",
    ra: "lit",
    la: "lit",
    s1: "lit",
    s2: "lit",
    s3: "lit",
    s4: "lit",
    s5: "lit",
    s6: "lit",
    s7: "lit",
    s8: "lit",
  },
  source: "decision: one fixed outfit, light armor and a bare head; the weapons follow the build",
};

/** The weapon class the animation files name; `th` names the frames of Throw, never a weapon. */
export const animationWeaponClasses: Readonly<Record<WeaponClass, AnimationWeaponClass | null>> & {
  readonly source: string;
} = {
  hth: "hth",
  ht: "ht1",
  "1hs": "1hs",
  "1ht": "1ht",
  "2hs": "2hs",
  "2ht": "2ht",
  stf: "stf",
  bow: "bow",
  xbw: "xbw",
  th: null,
  source: "animdata.d2:AIA1HT1@3.3.93847",
};

/** The class a player holds two weapons with, by their classes when each is held in one hand. */
interface DualWield {
  readonly pairs: readonly {
    readonly primary: WeaponClass;
    readonly secondary: WeaponClass;
    readonly weaponClass: AnimationWeaponClass;
  }[];
  readonly other: AnimationWeaponClass;
}

/**
 * Two swords `1ss`, a sword then a thrusting weapon `1js`, two thrusting weapons `1jt`, a thrusting
 * weapon then a sword `1st`; two claws `ht2`. Only these two classes hold a weapon in each hand.
 */
export const dualWieldWeaponClasses: {
  readonly byCharacter: Readonly<Partial<Record<CharacterId, DualWield>>>;
  readonly source: string;
} = {
  byCharacter: {
    barbarian: {
      pairs: [
        { primary: "1hs", secondary: "1hs", weaponClass: "1ss" },
        { primary: "1hs", secondary: "1ht", weaponClass: "1js" },
        { primary: "1ht", secondary: "1ht", weaponClass: "1jt" },
        { primary: "1ht", secondary: "1hs", weaponClass: "1st" },
      ],
      other: "1ss",
    },
    assassin: { pairs: [], other: "ht2" },
  },
  source: "D2MOO D2Composit.cpp:COMPOSIT_GetWeaponClassCode@5596f5c",
};

/** A bow draws in the left hand layer; every other weapon in the right hand layer. */
export const leftHandWeaponClasses = {
  weaponClasses: ["bow"],
  source: "weapons.txt:component@3.3.93847",
} as const;

/**
 * Skills whose animation lands no hit: Dodge flags no frame with one-handed weapons and frame 2
 * with the others, and avoids a blow instead of striking.
 */
export const skillsWithoutHit = {
  skills: ["dodge"],
  source: "animdata.d2:AMS11HS,AMS12HS@3.3.93847",
} as const;

/** Skills that need a shield (`itypea1` `shld`): the player draws one in the shield layer. */
export const shieldSkills = {
  skills: ["smite"],
  source: "skills.txt:Smite@3.3.93847",
} as const;

/** A shield graphic, named by the first base of `armor.txt` that draws it. */
interface ShieldGraphic {
  readonly graphic: string;
  readonly name: string;
}

/**
 * The shield graphics of `armor.txt` `alternategfx`, in file order; the attack view starts on a
 * Heraldic Shield without Holy Shield.
 */
export const shieldGraphics: {
  readonly graphics: readonly ShieldGraphic[];
  readonly start: Shield;
  readonly source: string;
} = {
  graphics: [
    { graphic: "buc", name: "Buckler" },
    { graphic: "lrg", name: "Large Shield" },
    { graphic: "kit", name: "Kite Shield" },
    { graphic: "tow", name: "Tower Shield" },
    { graphic: "bsh", name: "Bone Shield" },
    { graphic: "spk", name: "Spiked Shield" },
    { graphic: "pa1", name: "Targe" },
    { graphic: "pa3", name: "Heraldic Shield" },
    { graphic: "pa5", name: "Crown Shield" },
  ],
  start: { graphic: "pa3", holy: false },
  source:
    "armor.txt:alternategfx@3.3.93847 decision: Heraldic Shield at the start, outside the Build and the share link",
};

/** Under Holy Shield the game draws its own shield in place of the one held, opaque. */
export const holyShield = {
  component: "hsh",
  source:
    "states.txt:holyshield@3.3.93847 d2mods.info/forum/viewtopic.php?t=25318: the client draws hsh in the shield layer",
} as const;

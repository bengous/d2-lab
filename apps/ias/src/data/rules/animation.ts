import type { CharacterId, Wereform } from "@/contracts/build";
import type { WeaponClass } from "@/contracts/game-data";

export interface WeaponClassTraits {
  readonly melee: boolean;
  readonly oneHanded: boolean;
}

/** Source: constants.js:369-482@bcc112d (`new WeaponType(isMelee, isOneHand, …)`). */
export const weaponClassTraits: Readonly<Record<WeaponClass, WeaponClassTraits>> = {
  hth: { melee: true, oneHanded: true },
  ht: { melee: true, oneHanded: true },
  "1hs": { melee: true, oneHanded: true },
  "1ht": { melee: true, oneHanded: true },
  "2hs": { melee: true, oneHanded: false },
  "2ht": { melee: true, oneHanded: false },
  stf: { melee: true, oneHanded: false },
  bow: { melee: false, oneHanded: false },
  xbw: { melee: false, oneHanded: false },
  th: { melee: true, oneHanded: true },
};

/** Animation speed of a weapon when the skill does not set its own. */
export const weaponAnimationSpeeds = {
  base: 256,
  claw: { weaponClass: "ht", speed: 208, alternateFrames: 12, alternateSpeed: 227 },
  source: "calculator.js:1172-1183@bcc112d",
} as const;

export interface WereformFrames {
  /** Frames per direction of the first hit. */
  readonly firstHitFrames: number;
  /** Frames per direction that scale the human animation speed. */
  readonly framesPerDirection: number;
}

export const wereformFrames: Readonly<Record<Exclude<Wereform, "none">, WereformFrames>> & {
  readonly source: string;
} = {
  werewolf: { firstHitFrames: 13, framesPerDirection: 13 },
  werebear: { firstHitFrames: 12, framesPerDirection: 12 },
  source: "calculator.js:1055-1056,1071-1074@bcc112d",
};

/** A Barbarian holding a two-handed sword in one hand animates as a one-handed swing. */
export const oneHandedGrip = {
  character: "barbarian",
  from: "2hs",
  to: "1hs",
  source: "calculator.js:1153,1298@bcc112d",
} as const satisfies {
  readonly character: CharacterId;
  readonly from: WeaponClass;
  readonly to: WeaponClass;
  readonly source: string;
};

export interface StartingFrames {
  readonly characters: readonly CharacterId[];
  readonly byWeaponClass: Partial<Readonly<Record<WeaponClass, number>>>;
  readonly source: string;
}

export const amazonSorceressStartingFrames: StartingFrames = {
  characters: ["amazon", "sorceress"],
  byWeaponClass: { hth: 1, "1hs": 2, "2hs": 2, "1ht": 2, "2ht": 2, stf: 2 },
  source: "calculator.js:1287-1294@bcc112d",
};

/** An off-hand swing of a normal attack while dual wielding. */
export const offHandFirstHitFrames = { frames: 12, source: "calculator.js:1061@bcc112d" } as const;

export const gameFramesPerSecond = {
  frames: 25,
  source: "PureDiablo wiki, pages Breakpoints and FPS: the game logic runs at 25 frames per second",
} as const;

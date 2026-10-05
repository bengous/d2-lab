export type CharacterId =
  | "amazon"
  | "assassin"
  | "barbarian"
  | "druid"
  | "necromancer"
  | "paladin"
  | "sorceress"
  | "warlock"
  | "rogue-scout"
  | "desert-mercenary"
  | "bash-barbarian"
  | "frenzy-barbarian";

export type Wereform = "none" | "werebear" | "werewolf";

export type TableVariable =
  | "eias"
  | "ias"
  | "primary-wias"
  | "secondary-wias"
  | "fanaticism"
  | "burst-of-speed"
  | "werewolf"
  | "frenzy"
  | "maul";

/** Slug from the game data, for example `smite`. */
export type SkillId = string & { readonly __brand: "SkillId" };

/** Slug from the enUS item name, for example `phase-blade`. The original "None" is `unarmed`. */
export type WeaponId = string & { readonly __brand: "WeaponId" };

/** The keys of `Shape` whose value is a `Value`. */
type KeysOfType<Shape, Value> = {
  readonly [Key in keyof Shape]-?: Shape[Key] extends Value ? Key : never;
}[keyof Shape];

export interface SpeedSources {
  readonly ias: number;
  readonly primaryWias: number;
  readonly secondaryWias: number;
  readonly fanaticism: number;
  readonly burstOfSpeed: number;
  readonly werewolf: number;
  readonly maul: number;
  readonly frenzy: number;
  readonly purge: number;
  readonly cleave: number;
  readonly mirroredBlades: number;
  readonly markOfTheBear: boolean;
}

/** A speed source the form sets with a number field. */
export type SpeedNumberField = KeysOfType<SpeedSources, number>;

/** A speed source the form sets with a checkbox. */
export type SpeedFlag = KeysOfType<SpeedSources, boolean>;

export interface Slows {
  readonly holyFreeze: number;
  readonly slowedBy: number;
  readonly decrepify: boolean;
  readonly chilled: boolean;
  readonly lethargy: boolean;
}

export type SlowNumberField = KeysOfType<Slows, number>;

export type SlowFlag = KeysOfType<Slows, boolean>;

export interface Build {
  readonly character: CharacterId;
  readonly wereform: Wereform;
  readonly skill: SkillId;
  readonly primary: WeaponId;
  /** `unarmed` when the off hand is empty. */
  readonly secondary: WeaponId;
  /** Barbarian wielding a two-handed sword in one hand. */
  readonly oneHanded: boolean;
  readonly tableVariable: TableVariable;
  /** The player's value of the table variable: IAS, WIAS, skill level or EIAS. */
  readonly current: number;
  readonly speed: SpeedSources;
  readonly slows: Slows;
}

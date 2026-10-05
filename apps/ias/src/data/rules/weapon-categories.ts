export type WeaponCategory =
  | "axes"
  | "wands"
  | "clubs"
  | "scepters"
  | "maces"
  | "hammers"
  | "swords"
  | "daggers"
  | "throwingKnives"
  | "throwingAxes"
  | "javelins"
  | "spears"
  | "polearms"
  | "staves"
  | "bows"
  | "crossbows"
  | "claws"
  | "orbs";

export interface WeaponCategoryRule {
  /** The `type` codes of `weapons.txt` the category groups. */
  readonly types: readonly string[];
  readonly source: string;
}

const gameType = "weapons.txt:type@3.3.93847";
const merged = "decision: the Amazon types join their generic category, h2h and h2h2 form Claws";

/**
 * The categories of the weapon list, declared in the order weapons.txt first lists them. The
 * Amazon types join their generic category and the two claw types form one.
 */
export const weaponCategories: Readonly<Record<WeaponCategory, WeaponCategoryRule>> = {
  axes: { types: ["axe"], source: gameType },
  wands: { types: ["wand"], source: gameType },
  clubs: { types: ["club"], source: gameType },
  scepters: { types: ["scep"], source: gameType },
  maces: { types: ["mace"], source: gameType },
  hammers: { types: ["hamm"], source: gameType },
  swords: { types: ["swor"], source: gameType },
  daggers: { types: ["knif"], source: gameType },
  throwingKnives: { types: ["tkni"], source: gameType },
  throwingAxes: { types: ["taxe"], source: gameType },
  javelins: { types: ["jave", "ajav"], source: merged },
  spears: { types: ["spea", "aspe"], source: merged },
  polearms: { types: ["pole"], source: gameType },
  staves: { types: ["staf"], source: gameType },
  bows: { types: ["bow", "abow"], source: merged },
  crossbows: { types: ["xbow"], source: gameType },
  claws: { types: ["h2h", "h2h2"], source: merged },
  orbs: { types: ["orb"], source: gameType },
};

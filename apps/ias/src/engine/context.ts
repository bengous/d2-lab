import type { Build, WeaponId } from "@/contracts/build";
import type { WeaponData } from "@/contracts/game-data";
import { gameData } from "@/data/generated/game-data";
import { playerCharacters } from "@/data/rules/characters";
import type { SkillRule } from "@/data/rules/skill-rule";
import { skillRule } from "@/data/rules/skills";

export type Hand = "primary" | "secondary";

/** A build with its rules and weapons resolved. */
export interface Context {
  readonly build: Build;
  readonly skill: SkillRule;
  readonly player: boolean;
  readonly primary: WeaponData;
  readonly secondary: WeaponData;
  readonly dualWielding: boolean;
}

const weaponsById: ReadonlyMap<string, WeaponData> = new Map(
  gameData.weapons.map((weapon) => [weapon.id, weapon]),
);

export function weaponById(id: WeaponId): WeaponData {
  const found = weaponsById.get(id);

  if (found === undefined) {
    throw new Error(`unknown weapon id: ${id}`);
  }

  return found;
}

export function resolveContext(build: Build): Context {
  const secondary = weaponById(build.secondary);

  return {
    build,
    skill: skillRule(build.skill),
    player: playerCharacters.has(build.character),
    primary: weaponById(build.primary),
    secondary,
    dualWielding: secondary.weaponClass !== "hth",
  };
}

export function handWeapon(context: Context, hand: Hand): WeaponData {
  return hand === "primary" ? context.primary : context.secondary;
}

export function otherHand(hand: Hand): Hand {
  return hand === "primary" ? "secondary" : "primary";
}

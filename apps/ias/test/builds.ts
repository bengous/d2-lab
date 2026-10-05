import type { Build, Slows, SpeedSources, WeaponId } from "@/contracts/build";
import { gameData } from "@/data/generated/game-data";
import { parseSkillId } from "@/data/rules/skills";

export interface BuildChanges extends Partial<
  Omit<Build, "skill" | "primary" | "secondary" | "speed" | "slows">
> {
  readonly skill?: string;
  readonly primary?: string;
  readonly secondary?: string;
  readonly speed?: Partial<SpeedSources>;
  readonly slows?: Partial<Slows>;
}

export function weaponId(slug: string): WeaponId {
  const found = gameData.weapons.find((weapon) => weapon.id === slug);

  if (found === undefined) {
    throw new Error(`unknown weapon ${slug}`);
  }

  return found.id;
}

/** A human Amazon with Standard, unarmed, on the IAS table, every field at its original default. */
export function buildOf({
  skill = "standard",
  primary = "unarmed",
  secondary = "unarmed",
  speed = {},
  slows = {},
  ...changes
}: BuildChanges = {}): Build {
  return {
    character: "amazon",
    wereform: "none",
    oneHanded: false,
    tableVariable: "ias",
    current: 0,
    ...changes,
    skill: parseSkillId(skill),
    primary: weaponId(primary),
    secondary: weaponId(secondary),
    speed: {
      ias: 0,
      primaryWias: 0,
      secondaryWias: 0,
      fanaticism: 0,
      burstOfSpeed: 0,
      werewolf: 0,
      maul: 0,
      frenzy: 0,
      purge: 0,
      cleave: 1,
      mirroredBlades: 1,
      markOfTheBear: false,
      ...speed,
    },
    slows: {
      holyFreeze: 0,
      slowedBy: 0,
      decrepify: false,
      chilled: false,
      lethargy: false,
      ...slows,
    },
  };
}

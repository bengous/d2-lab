import type { CharacterId, SkillId, Wereform } from "@/contracts/build";
import { parseSkillId } from "@/data/rules/skills";

function skillIds(...slugs: readonly string[]): readonly SkillId[] {
  return slugs.map((slug) => parseSkillId(slug));
}

/**
 * Skills every character offers first, in select order. A shapeshifted player has no Kick:
 * `animdata.d2` holds no `40KK` or `TGKK` animation.
 */
export const commonSkills = {
  everyone: skillIds("standard"),
  humanPlayers: skillIds("throw", "kick"),
  shapeshiftedPlayers: [],
  source: "calculator.js:505-512@bcc112d animdata.d2:40KK,TGKK@3.3.93847",
} as const;

/** Class skills after the common ones. A missing wereform offers none. */
export const classSkills: Readonly<
  Record<CharacterId, Partial<Readonly<Record<Wereform, readonly SkillId[]>>>>
> & { readonly source: string } = {
  amazon: {
    none: skillIds("strafe", "jab", "impale", "fend", "dodge"),
  },
  assassin: {
    none: skillIds(
      "laying-traps",
      "dragon-talon",
      "tiger-strike",
      "cobra-strike",
      "phoenix-strike",
      "fists-of-fire",
      "claws-of-thunder",
      "blades-of-ice",
      "dragon-tail",
      "dragon-claw",
    ),
  },
  barbarian: {
    none: skillIds(
      "frenzy",
      "double-swing",
      "whirlwind",
      "concentrate",
      "berserk",
      "bash",
      "stun",
      "double-throw",
    ),
  },
  druid: {
    werewolf: skillIds("fury", "rabies", "feral-rage", "hunger"),
    werebear: skillIds("hunger"),
  },
  necromancer: {},
  paladin: { none: skillIds("smite", "zeal", "sacrifice", "vengeance", "conversion") },
  sorceress: {},
  warlock: { none: skillIds("cleave", "mirrored-blades") },
  "rogue-scout": {},
  "desert-mercenary": { none: skillIds("jab") },
  "bash-barbarian": { none: skillIds("bash", "stun") },
  "frenzy-barbarian": { none: skillIds("frenzy", "taunt") },
  source: "calculator.js:514-637@bcc112d skills.txt:charclass@3.3.93847",
};

export interface Oskill {
  readonly skill: SkillId;
  readonly characters: readonly CharacterId[] | "players";
  readonly wereforms: readonly Wereform[];
  /** The item that grants the skill. */
  readonly grantedBy: string;
}

/**
 * Skills granted by items, offered to player characters after a divider, in select order: Chaos
 * grants Whirlwind, Passion grants Zeal and Berserk, Wolfhowl grants Feral Rage. A skill the class
 * list already holds is not repeated.
 */
export const oskills: { readonly skills: readonly Oskill[]; readonly source: string } = {
  skills: [
    {
      skill: parseSkillId("whirlwind"),
      characters: ["assassin"],
      wereforms: ["none"],
      grantedBy: "Chaos",
    },
    {
      skill: parseSkillId("zeal"),
      characters: "players",
      wereforms: ["none"],
      grantedBy: "Passion",
    },
    {
      skill: parseSkillId("berserk"),
      characters: "players",
      wereforms: ["none"],
      grantedBy: "Passion",
    },
    {
      skill: parseSkillId("feral-rage"),
      characters: ["barbarian"],
      wereforms: ["werewolf"],
      grantedBy: "Wolfhowl",
    },
  ],
  source:
    "calculator.js:639-658@bcc112d runes.txt:Chaos,Passion uniqueitems.txt:Wolfhowl@3.3.93847 decision: Berserk from Passion for every player class in human form, as Zeal outside the Paladin",
};

import type { CharacterId, SkillId } from "@/contracts/build";
import { commonSkills, oskills } from "@/data/rules/skill-lists";
import { characterNames } from "@/ui/screens/labels";

export interface SkillGroup {
  readonly title: string;
  readonly skills: readonly SkillId[];
  /** Skills granted by an item: the group opens with a rule. */
  readonly granted: boolean;
}

const commonSkillIds: ReadonlySet<SkillId> = new Set([
  ...commonSkills.everyone,
  ...commonSkills.humanPlayers,
  ...commonSkills.shapeshiftedPlayers,
]);

function isSkillId(option: SkillId | "divider"): option is SkillId {
  return option !== "divider";
}

/** The attacks every character has, the class skills, then the skills granted by items. */
export function skillGroups(
  character: CharacterId,
  options: readonly (SkillId | "divider")[],
): readonly SkillGroup[] {
  const divider = options.indexOf("divider");
  const own = (divider === -1 ? options : options.slice(0, divider)).filter((option) =>
    isSkillId(option),
  );

  const granted =
    divider === -1 ? [] : options.slice(divider + 1).filter((option) => isSkillId(option));

  const groups: readonly SkillGroup[] = [
    {
      title: "Every character",
      skills: own.filter((skill) => commonSkillIds.has(skill)),
      granted: false,
    },
    {
      title: `${characterNames[character]} skills`,
      skills: own.filter((skill) => !commonSkillIds.has(skill)),
      granted: false,
    },
    { title: "Granted by items", skills: granted, granted: true },
  ];

  return groups.filter((group) => group.skills.length > 0);
}

/** The item that grants the skill to the character, `null` for a skill of its own. */
export function grantingItem(character: CharacterId, skill: SkillId): string | null {
  const oskill = oskills.skills.find(
    (entry) =>
      entry.skill === skill &&
      (entry.characters === "players" || entry.characters.includes(character)),
  );

  return oskill?.grantedBy ?? null;
}

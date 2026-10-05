import type { SkillId, TableVariable } from "@/contracts/build";
import { skillRule } from "@/data/rules/skills";
import { framesColumnLabel, tableVariableLabels } from "@/data/rules/tables";
import { variableBuff } from "@/engine/levels";

/** The two column headers of a table, as Warren's calculator prints them. */
export function tableHeader(variable: TableVariable, skill: SkillId): readonly [string, string] {
  const skillLevelLabel = skillRule(skill).skillLevelLabel;
  const label =
    variableBuff(variable) !== undefined && skillLevelLabel !== undefined
      ? skillLevelLabel
      : tableVariableLabels.labels[variable];

  return [label, framesColumnLabel.label];
}

import type { WithTableVariable } from "@/contracts/engine";
import { eiasCurrent, variableFields } from "@/data/rules/field-values";

/**
 * The value of the old variable goes back to its speed field, and `current` takes the value of the
 * new variable's field. EIAS has no field: leaving it drops the value, choosing it starts at 0.
 */
export const withTableVariable: WithTableVariable = (build, variable) => {
  if (variable === build.tableVariable) {
    return build;
  }

  const released = variableFields[build.tableVariable];
  const speed = released === null ? build.speed : { ...build.speed, [released]: build.current };
  const adopted = variableFields[variable];

  return {
    ...build,
    tableVariable: variable,
    current: adopted === null ? eiasCurrent.default : speed[adopted],
    speed,
  };
};

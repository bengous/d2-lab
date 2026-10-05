import type { PrimaryTable } from "@/contracts/engine";

export const primaryTable: PrimaryTable = ({ tables }) => {
  const table = tables.find(({ role }) => role === "merged") ?? tables[0];

  if (table === undefined) {
    throw new Error("the result has no table");
  }

  return table;
};

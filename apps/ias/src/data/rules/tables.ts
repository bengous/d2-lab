import type { TableVariable } from "@/contracts/build";

/** Header of the first column; skill-level variables read "Skill Level" unless the skill sets its own label. */
export const tableVariableLabels = {
  labels: {
    eias: "EIAS",
    ias: "IAS",
    "primary-wias": "WIAS",
    "secondary-wias": "WIAS",
    fanaticism: "Skill Level",
    "burst-of-speed": "Skill Level",
    werewolf: "Skill Level",
    frenzy: "Skill Level",
    maul: "Skill Level",
  },
  source: "calculator.js:770-788@bcc112d",
} as const satisfies {
  readonly labels: Readonly<Record<TableVariable, string>>;
  readonly source: string;
};

export const framesColumnLabel = {
  label: "FPA",
  source: "calculator.js:1623-1624@bcc112d",
} as const;

import type { ComputeTables } from "@/contracts/engine";
import type { BreakpointRow, BreakpointTable, TableRole } from "@/contracts/result";
import { offHandFirstHitFrames } from "@/data/rules/animation";
import { firstRowFloor, weaponIasCaps } from "@/data/rules/caps";
import type { RollbackRule } from "@/data/rules/rollbacks";
import {
  type AccelerationTable,
  groupHits,
  rollbackNotation,
  rollbackTables,
  singleHitTable,
} from "@/engine/acceleration";
import { type Context, resolveContext } from "@/engine/context";
import { firstHitFrames } from "@/engine/frames";
import { mergeHands } from "@/engine/merge";
import { variableValue } from "@/engine/speed";

type RowFrames = Omit<BreakpointRow, "value">;

interface RoleTable<Frames = RowFrames> {
  readonly role: TableRole;
  readonly table: AccelerationTable<Frames>;
}

function plainFrames(frames: number): RowFrames {
  return { frames: String(frames), hits: [frames], rollback: null };
}

function rollbackFrames(hits: readonly number[]): RowFrames {
  const rollback = groupHits(hits);

  return { frames: rollbackNotation(rollback), hits, rollback };
}

function withRows<Frames>(
  table: AccelerationTable<Frames>,
  rowFrames: (frames: Frames) => RowFrames,
): AccelerationTable<RowFrames> {
  return {
    eiasValues: table.eiasValues,
    breakpoints: table.breakpoints.map(({ eias, frames }) => ({ eias, frames: rowFrames(frames) })),
  };
}

/** Source: calculator.js:737-768@bcc112d. */
function display(context: Context, { role, table }: RoleTable): BreakpointTable {
  const variable = context.build.tableVariable;
  const weaponVariable = variable === "primary-wias" || variable === "secondary-wias";
  const rows: BreakpointRow[] = [];

  for (const [index, breakpoint] of table.breakpoints.entries()) {
    const value = variableValue(context, breakpoint.eias, table.eiasValues);

    if (index === 0 && value < 0) {
      rows.push({ value: firstRowFloor.value, ...breakpoint.frames });
    } else if (weaponVariable && value > weaponIasCaps.displayMax) {
      break;
    } else {
      rows.push({ value, ...breakpoint.frames });
    }
  }

  return { role, variable, rows };
}

/** The main table, unless the skill shows it for another weapon class, then the odd-hits table. */
function rollbackRoleTables(
  context: Context,
  rollback: RollbackRule,
  primaryFirstHit: number,
): readonly RoleTable[] {
  const { skill, primary } = context;
  const { main, oddHits } = rollbackTables(context, rollback, primaryFirstHit);
  const showMain =
    skill.mainTableWeaponClass === undefined || skill.mainTableWeaponClass === primary.weaponClass;

  return [
    ...(showMain ? [{ role: "main", table: withRows(main, rollbackFrames) } as const] : []),
    ...(oddHits === null
      ? []
      : [{ role: "odd-hits", table: withRows(oddHits, rollbackFrames) } as const]),
  ];
}

/** Source: calculator.js:683-735@bcc112d. */
function singleHitTables(context: Context): readonly RoleTable<number>[] {
  const { build, skill, primary, secondary } = context;
  const main = singleHitTable(context, "primary", firstHitFrames(context, primary.weaponClass));
  const mainTable = { role: "main", table: main } as const;

  if (build.wereform === "none" && context.player && skill.offHandTable) {
    return context.dualWielding
      ? [
          mainTable,
          {
            role: "off-hand",
            table: singleHitTable(context, "secondary", offHandFirstHitFrames.frames),
          },
        ]
      : [mainTable];
  }

  if (skill.family === "whirlwind" && context.dualWielding) {
    const offHand = singleHitTable(
      context,
      "secondary",
      firstHitFrames(context, secondary.weaponClass),
    );

    return [
      mainTable,
      { role: "off-hand", table: offHand },
      { role: "merged", table: mergeHands(main, offHand) },
    ];
  }

  return [mainTable];
}

function accelerationTables(context: Context): readonly RoleTable[] {
  const { skill, primary } = context;

  if (skill.family === "rollback") {
    return rollbackRoleTables(
      context,
      skill.rollback,
      firstHitFrames(context, primary.weaponClass),
    );
  }

  return singleHitTables(context).map(({ role, table }) => ({
    role,
    table: withRows(table, plainFrames),
  }));
}

export const computeTables: ComputeTables = (build) => {
  const context = resolveContext(build);

  return {
    tables: accelerationTables(context).map((roleTable) => display(context, roleTable)),
  };
};

import { ChevronDownIcon } from "lucide-react";

import type { Build, TableVariable } from "@/contracts/build";
import type { Locate } from "@/contracts/engine";
import type { Floors, InputSpec } from "@/contracts/inputs";
import type { BreakpointRow as Row, BreakpointTable as Table } from "@/contracts/result";
import { variableFields } from "@/data/rules/field-values";
import { BreakpointTable, type TableFloor } from "@/ui/components/breakpoint-table";
import { Panel } from "@/ui/components/panel";
import { SegmentedToggle } from "@/ui/components/segmented-toggle";
import { SummaryTile } from "@/ui/components/summary-tile";
import { AttackView } from "@/ui/screens/attack-view";
import type { BuildEdit } from "@/ui/screens/build-edit";
import {
  framesText,
  perSecond,
  perSecondCount,
  perSecondLabels,
  type PerSecondCount,
} from "@/ui/screens/hit-labels";
import { tableCaption, tableVariables } from "@/ui/screens/labels";
import { floorRowStatus, tableVariableTips } from "@/ui/screens/option-hints";

const blank = "–";

export interface LocatedTable {
  readonly table: Table;
  /** `locate(table, build.current)`. */
  readonly position: ReturnType<Locate>;
}

interface BreakpointsPanelProps {
  readonly build: Build;
  /** The build the tables come from, which the attack view plays. */
  readonly normalized: Build;
  readonly primary: LocatedTable;
}

interface RowTile {
  readonly value: string;
  readonly unit: string;
  readonly others: readonly string[];
  readonly perSecond: string;
}

function rowTile(row: Row, count: PerSecondCount): RowTile {
  const { figure, unit, others } = framesText(row);

  return {
    value: figure,
    unit,
    others,
    perSecond: `${perSecond(row)} ${perSecondLabels[count].unit}`,
  };
}

export function BreakpointsPanel({ build, normalized, primary }: BreakpointsPanelProps) {
  const variable = tableVariables[primary.table.variable];
  const { position } = primary;
  const next = position?.next ?? null;
  const count = perSecondCount(build.skill);

  return (
    <Panel title="Breakpoints">
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2" aria-live="polite">
          {position === null ? (
            <SummaryTile
              tone="now"
              label="Now:"
              value={blank}
              unit=""
              detail="No breakpoint for this build"
            />
          ) : (
            <SummaryTile
              tone="now"
              label="Now:"
              {...rowTile(position.now, count)}
              detail={`at ${variable.describe(build.current)}`}
            />
          )}
          {next === null ? (
            <SummaryTile
              tone="next"
              label="Next breakpoint:"
              value={blank}
              unit=""
              detail={
                position === null ? "No breakpoint for this build" : "None: this is the fastest"
              }
            />
          ) : (
            <SummaryTile
              tone="next"
              label="Next breakpoint:"
              {...rowTile(next, count)}
              detail={`at ${variable.describe(next.value)} (+${next.value - build.current})`}
            />
          )}
        </div>
        {position !== null && <AttackView build={normalized} now={position.now} next={next} />}
      </div>
    </Panel>
  );
}

function tableFloor(variable: TableVariable, floors: Floors): TableFloor | null {
  const field = variableFields[variable];
  const floor = field === null ? undefined : floors[field];

  return floor === undefined ? null : { min: floor.min, status: floorRowStatus(floor) };
}

interface TableVariableProps {
  readonly build: Build;
  readonly inputs: InputSpec;
  readonly onTableVariableChange: (variable: TableVariable) => void;
}

interface TablesPanelProps {
  readonly build: Build;
  readonly inputs: InputSpec;
  readonly tables: readonly LocatedTable[];
  readonly onEdit: (edit: BuildEdit) => void;
}

/** A native select below 640px, where the segments would not fit on one line. */
function TableVariableSelect({ build, inputs, onTableVariableChange }: TableVariableProps) {
  return (
    <span className="relative min-w-0 flex-1 sm:hidden">
      <select
        aria-label="Breakpoints by"
        value={build.tableVariable}
        // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- React passes a ChangeEvent, whose DOM members are mutable
        onChange={(event) => {
          const variable = inputs.tableVariables.find((option) => option === event.target.value);

          if (variable !== undefined) {
            onTableVariableChange(variable);
          }
        }}
        className="border-border bg-input/60 text-figure focus-visible:ring-ring/50 h-10 w-full cursor-pointer appearance-none rounded-lg border ps-3.5 pe-10 text-[1.0625rem] outline-none focus-visible:ring-3"
      >
        {inputs.tableVariables.map((variable) => (
          <option key={variable} value={variable}>
            {tableVariables[variable].name}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2"
      />
    </span>
  );
}

function TableVariableToggle({ build, inputs, onTableVariableChange }: TableVariableProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-foreground/85 text-[1.0625rem]" aria-hidden="true">
        Breakpoints by
      </span>
      <TableVariableSelect
        build={build}
        inputs={inputs}
        onTableVariableChange={onTableVariableChange}
      />
      <div className="max-w-full overflow-x-auto max-sm:hidden">
        <SegmentedToggle<TableVariable>
          label="Breakpoints by"
          value={build.tableVariable}
          options={inputs.tableVariables.map((variable) => ({
            value: variable,
            label: tableVariables[variable].name,
            hint: tableVariableTips[variable].text,
            worked: tableVariableTips[variable].worked,
          }))}
          onValueChange={onTableVariableChange}
          className="w-max"
        />
      </div>
    </div>
  );
}

export function TablesPanel({ build, inputs, tables, onEdit }: TablesPanelProps) {
  const roles = tables.map(({ table }) => table.role);

  return (
    <Panel title="All breakpoints">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {inputs.fields.has("tableVariable") && inputs.tableVariables.length > 1 && (
          <TableVariableToggle
            build={build}
            inputs={inputs}
            onTableVariableChange={(variable) => {
              onEdit({ kind: "table-variable", variable });
            }}
          />
        )}
        {tables.map(({ table, position }) => (
          <figure key={table.role} className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {tables.length > 1 && (
              <figcaption className="font-display text-figure text-sm font-semibold">
                {tableCaption(table.role, roles)}
              </figcaption>
            )}
            <BreakpointTable
              variableLabel={tableVariables[table.variable].column}
              rows={table.rows}
              now={position?.now ?? null}
              next={position?.next ?? null}
              floor={tableFloor(table.variable, inputs.floors)}
              count={perSecondCount(build.skill)}
            />
          </figure>
        ))}
      </div>
    </Panel>
  );
}

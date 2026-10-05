import { cn } from "cn";

import type { BreakpointRow } from "@/contracts/result";
import { DotList } from "@/ui/components/dot-list";
import { InfoTip } from "@/ui/components/info-tip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import {
  framesText,
  perSecond,
  type PerSecondCount,
  perSecondLabels,
} from "@/ui/screens/hit-labels";
import { perSecondTips } from "@/ui/screens/option-hints";

/** `below`: a row the next row passes before the floor of the build, which the build cannot reach. */
type Status = "now" | "next" | "below" | "other";

/** The lowest value the build allows, with the status its passed rows show, for example `Below Beast`. */
export interface TableFloor {
  readonly min: number;
  readonly status: string;
}

interface BreakpointTableProps {
  /** Header of the first column, for example `IAS`. */
  readonly variableLabel: string;
  /** Without rows, the table says that no breakpoint exists. */
  readonly rows: readonly BreakpointRow[];
  /** Rows of `rows` as `locate` returns them, `null` for an empty table. Matched by identity: original tables can repeat a value. */
  readonly now: BreakpointRow | null;
  readonly next: BreakpointRow | null;
  readonly floor: TableFloor | null;
  /** What the per-second column counts. */
  readonly count: PerSecondCount;
  readonly className?: string;
}

const statusClasses: Readonly<Record<Status, string>> = {
  now: "bg-now-surface text-now outline -outline-offset-1 outline-now/55 hover:bg-now-surface",
  next: "bg-next-surface text-next outline -outline-offset-1 outline-next/45 hover:bg-next-surface",
  below: "text-muted-foreground/65",
  other: "text-figure",
};

const statusLabels: Readonly<Record<Exclude<Status, "below">, string>> = {
  now: "Current",
  next: "Next",
  other: "–",
};

interface RowStatus {
  readonly status: Status;
  readonly label: string;
}

function statusOf(
  { rows, now, next, floor }: Pick<BreakpointTableProps, "rows" | "now" | "next" | "floor">,
  index: number,
): RowStatus {
  const row = rows[index];
  const following = rows[index + 1];

  if (row === now || row === next) {
    const status = row === now ? "now" : "next";

    return { status, label: statusLabels[status] };
  }

  return floor !== null && following !== undefined && following.value <= floor.min
    ? { status: "below", label: floor.status }
    : { status: "other", label: statusLabels.other };
}

function EmptyRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={4}
        className="text-muted-foreground px-2.5 py-3 whitespace-normal sm:px-4"
      >
        No breakpoint exists for this build.
      </TableCell>
    </TableRow>
  );
}

const headClasses = "text-muted-foreground h-9 px-2.5 py-1.5 text-sm font-medium sm:px-4";

const cellClasses = "px-2.5 py-1.5 sm:px-4";

function Header({ variableLabel, count }: Pick<BreakpointTableProps, "variableLabel" | "count">) {
  const label = perSecondLabels[count];

  return (
    <TableHeader className="bg-border/60">
      <TableRow className="hover:bg-transparent">
        <TableHead className={cn(headClasses, "leading-tight whitespace-normal sm:w-1/4")}>
          {variableLabel}
        </TableHead>
        <TableHead className={cn(headClasses, "sm:w-1/3")}>Frames</TableHead>
        <TableHead className={cn(headClasses, "leading-tight whitespace-normal sm:w-1/5")}>
          <span className="flex items-center gap-1">
            {label.column}
            <InfoTip subject={label.unit} text={perSecondTips[count]} />
          </span>
        </TableHead>
        <TableHead className={headClasses}>Status</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function Row({ row, status, label }: RowStatus & { readonly row: BreakpointRow }) {
  return (
    <TableRow data-status={status} className={cn("border-0", statusClasses[status])}>
      <TableCell className={cellClasses}>{row.value}</TableCell>
      <TableCell className={cn(cellClasses, "whitespace-normal")}>
        <DotList parts={framesText(row).cell} />
      </TableCell>
      <TableCell
        className={cn(cellClasses, "tabular-nums", status === "other" && "text-muted-foreground")}
      >
        {perSecond(row)}
      </TableCell>
      <TableCell
        className={cn(
          cellClasses,
          "leading-tight whitespace-normal",
          status === "other" && "text-muted-foreground/65",
        )}
      >
        {label}
      </TableCell>
    </TableRow>
  );
}

export function BreakpointTable({
  variableLabel,
  rows,
  now,
  next,
  floor,
  count,
  className,
}: BreakpointTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Table className="text-[1.0625rem]">
        <Header variableLabel={variableLabel} count={count} />
        <TableBody>
          {rows.length === 0 && <EmptyRow />}
          {rows.map((row, index) => (
            <Row
              // oxlint-disable-next-line react/no-array-index-key -- rows can repeat both value and frames, as some original skill-level tables do, and a table never reorders
              key={index}
              row={row}
              {...statusOf({ rows, now, next, floor }, index)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { cn } from "cn";

import { DotList } from "@/ui/components/dot-list";

type Tone = "now" | "next";

interface SummaryTileProps {
  readonly tone: Tone;
  readonly label: string;
  /** Frames, for example `8`, or the frames of the repeated hit of a rollback skill. */
  readonly value: string;
  readonly unit: string;
  /** For example `first hit 8`, `last hit 11`. */
  readonly others?: readonly string[];
  /** For example `3.13 attacks per second`. */
  readonly perSecond?: string;
  readonly detail: string;
  readonly className?: string;
}

const toneClasses: Readonly<Record<Tone, { readonly tile: string; readonly accent: string }>> = {
  now: { tile: "border-now/25 bg-now/[0.03]", accent: "text-now" },
  next: { tile: "border-next/20 bg-next/[0.03]", accent: "text-next" },
};

const noOthers: readonly string[] = [];

export function SummaryTile({
  tone,
  label,
  value,
  unit,
  others = noOthers,
  perSecond = "",
  detail,
  className,
}: SummaryTileProps) {
  const classes = toneClasses[tone];

  return (
    <div className={cn("rounded-lg border px-5 pt-2.5 pb-3.5", classes.tile, className)}>
      <p className={cn("text-sm opacity-80", classes.accent)}>{label}</p>
      <p
        className={cn(
          "flex flex-wrap items-baseline gap-x-3 font-display font-semibold",
          classes.accent,
        )}
      >
        <span className="text-[3.25rem] leading-[1.15] whitespace-nowrap">{value}</span>
        <span className="text-3xl">{unit}</span>
      </p>
      {others.length > 0 && (
        <p className={cn("font-display text-xl font-semibold", classes.accent)}>
          <DotList parts={others} />
        </p>
      )}
      {perSecond !== "" && (
        <p className={cn("mt-0.5 mb-1 text-lg tabular-nums", classes.accent)}>{perSecond}</p>
      )}
      <p className="text-muted-foreground text-xl leading-6 tracking-wider">{detail}</p>
    </div>
  );
}

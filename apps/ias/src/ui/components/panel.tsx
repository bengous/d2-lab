import { cn } from "cn";
import { type ReactNode, useId } from "react";

interface PanelProps {
  readonly title: string;
  /** Keeps the title for screen readers only, and gives the content the full width. */
  readonly titleHidden?: boolean;
  /** A control on the title line, when the title sits above the content. */
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `children: ReactNode` includes ReactElement, whose fields are mutable in @types/react
export function Panel({ title, titleHidden = false, action, children, className }: PanelProps) {
  const titleId = useId();
  const heading = (
    <h2
      id={titleId}
      className={cn(
        "pt-2 font-display text-base leading-6 font-semibold text-figure",
        titleHidden && "sr-only",
        action !== undefined && "max-md:pt-0",
      )}
    >
      {title}
    </h2>
  );

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "grid gap-3 rounded-lg border bg-card px-4 py-3",
        !titleHidden && "md:grid-cols-[9rem_minmax(0,1fr)] md:gap-5",
        className,
      )}
    >
      {action === undefined ? (
        heading
      ) : (
        <div className="flex items-center justify-between gap-3 md:flex-col md:items-start md:justify-start md:gap-1">
          {heading}
          {action}
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </section>
  );
}

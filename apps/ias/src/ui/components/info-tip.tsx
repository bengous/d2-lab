import { Popover } from "@base-ui/react/popover";
import { cn } from "cn";
import { InfoIcon } from "lucide-react";

/** A formula and a worked example, shown under the text of a tip. */
export interface WorkedExample {
  readonly formula: string;
  readonly example: string;
}

/** The tip as running text, for the description a screen reader reads. */
export function tipDescription(text: string, worked: WorkedExample | null): string {
  return worked === null ? text : `${text} ${worked.formula}. Example: ${worked.example}`;
}

interface InfoTipProps {
  /** Name of the field the tip explains, read in the trigger's accessible name. */
  readonly subject: string;
  readonly text: string;
}

/** The popup of a tip, inside its `Popover.Root`. */
export function TipBubble({
  text,
  worked = null,
}: {
  readonly text: string;
  readonly worked?: WorkedExample | null;
}) {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} className="z-50">
        <Popover.Popup
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 origin-(--transform-origin) rounded-lg border px-3 py-2 text-sm leading-snug shadow-md ring-1 duration-100 outline-none",
            worked === null ? "max-w-72" : "max-w-88",
          )}
        >
          {worked === null ? (
            <Popover.Description>{text}</Popover.Description>
          ) : (
            <Popover.Description render={<div className="grid gap-2" />}>
              <p>{text}</p>
              <p className="bg-muted text-figure rounded-md border px-2 py-1.5 whitespace-pre-line tabular-nums">
                {worked.formula}
              </p>
              <p className="text-muted-foreground">Example: {worked.example}</p>
            </Popover.Description>
          )}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

/** Opens on hover for a pointer, on tap for touch, on Enter or Space for the keyboard. */
export function InfoTip({ subject, text }: InfoTipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        aria-label={`About ${subject}`}
        className="text-muted-foreground/60 hover:text-foreground focus-visible:ring-ring/50 data-popup-open:text-foreground grid size-5 shrink-0 cursor-help place-items-center rounded-full transition-colors outline-none focus-visible:ring-3 [&_svg]:size-4"
      >
        <InfoIcon />
      </Popover.Trigger>
      <TipBubble text={text} />
    </Popover.Root>
  );
}

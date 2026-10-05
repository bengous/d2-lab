import { cn } from "cn";

export function Divider({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("bg-border mx-1.5 w-px shrink-0 self-stretch", className)}
    />
  );
}

/**
 * From xl up, a wrapping row whose items draw their divider in the gap before them. The row clips
 * its start side just past the ember glow, so the item that opens a line shows no divider.
 */
export const dividedRow = "xl:gap-x-12 xl:[clip-path:inset(-2rem_-2rem_-2rem_-1rem)]";

export const dividedItem =
  "relative xl:before:absolute xl:before:inset-y-0 xl:before:-start-6 xl:before:w-px xl:before:bg-border";

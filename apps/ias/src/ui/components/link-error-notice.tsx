import { XIcon } from "lucide-react";

import type { ShareLinkError } from "@/contracts/share-link";
import { shareLinkErrorText } from "@/share-link/error-text";
import { Button } from "@/ui/components/ui/button";

interface LinkErrorNoticeProps {
  readonly error: ShareLinkError;
  readonly onDismiss: () => void;
}

/** Says why a shared link did not load, and that the default build is shown instead. */
export function LinkErrorNotice({ error, onDismiss }: LinkErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="border-destructive/60 flex items-start gap-3 rounded-lg border bg-[color-mix(in_oklab,var(--destructive)_14%,var(--card))] py-2.5 pr-2 pl-4"
    >
      <div className="min-w-0 flex-1 pt-1 text-sm leading-snug">
        <p className="text-figure font-medium">{shareLinkErrorText(error)}</p>
        <p className="text-muted-foreground">The default build is loaded instead.</p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={onDismiss}>
        <XIcon />
      </Button>
    </div>
  );
}

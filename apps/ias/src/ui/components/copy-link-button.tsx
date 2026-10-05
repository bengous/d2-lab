import { CheckIcon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/ui/components/ui/button";

type CopyState =
  | { readonly kind: "idle" }
  | { readonly kind: "copied" }
  | { readonly kind: "failed"; readonly message: string };

const idle: CopyState = { kind: "idle" };

/** How long the button keeps saying "Copied", and how long the failure note stays. */
const feedbackMs = { copied: 2000, failed: 8000 } as const;

/** The state of the last copy, back to idle once its feedback has been shown. */
function useCopyState(onCopy: () => Promise<void>): readonly [CopyState, () => void] {
  const [state, setState] = useState(idle);

  useEffect(() => {
    const timer =
      state.kind === "idle"
        ? null
        : setTimeout(() => {
            setState(idle);
          }, feedbackMs[state.kind]);

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [state]);

  const copy = () => {
    onCopy().then(
      () => {
        setState({ kind: "copied" });
      },
      (error: Readonly<Error>) => {
        setState({ kind: "failed", message: error.message });
      },
    );
  };

  return [state, copy];
}

interface CopyLinkButtonProps {
  /** Writes the link to the clipboard. A rejection with an `Error` is shown next to the button. */
  readonly onCopy: () => Promise<void>;
  readonly className?: string;
}

export function CopyLinkButton({ onCopy, className }: CopyLinkButtonProps) {
  const [state, copy] = useCopyState(onCopy);
  const copied = state.kind === "copied";

  return (
    <div className="relative">
      <Button variant="ghost" onClick={copy} className={className}>
        {copied ? <CheckIcon data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
        <span className="max-sm:sr-only">{copied ? "Copied" : "Copy link"}</span>
      </Button>
      <output className="sr-only">{copied ? "Link copied" : ""}</output>
      {state.kind === "failed" ? (
        <p
          role="alert"
          className="border-destructive/60 text-figure absolute top-full right-0 z-10 mt-1 w-64 rounded-lg border bg-[color-mix(in_oklab,var(--destructive)_14%,var(--card))] px-3 py-2 text-sm leading-snug"
        >
          Could not copy the link: {state.message}
        </p>
      ) : null}
    </div>
  );
}

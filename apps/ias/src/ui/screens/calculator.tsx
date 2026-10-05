import { useState } from "react";

import type { Build } from "@/contracts/build";
import { serializeShareLink } from "@/share-link/serialize";
import { applyEdit } from "@/ui/screens/build-edit";
import { CalculatorScreen } from "@/ui/screens/calculator-screen";
import { calculatorView, loadLink } from "@/ui/screens/calculator-state";

async function copyLink(raw: Build): Promise<void> {
  await navigator.clipboard.writeText(
    `${location.origin}${location.pathname}${serializeShareLink(raw)}`,
  );
}

interface CalculatorProps {
  /** The query string of the page, `""` for the prerendered page. */
  readonly search: string;
}

/** Holds the raw UI state: a hidden field keeps what the user typed until it shows again. */
export function Calculator({ search }: CalculatorProps) {
  const [loaded] = useState(() => loadLink(search));
  const [raw, setRaw] = useState(loaded.raw);
  const [linkError, setLinkError] = useState(loaded.linkError);
  const view = calculatorView(raw);

  return (
    <CalculatorScreen
      build={view.build}
      normalized={view.normalized}
      inputs={view.inputs}
      tables={view.tables}
      primary={view.primary}
      onEdit={(edit) => {
        setRaw(applyEdit(raw, view, edit));
      }}
      onCopyLink={() => copyLink(raw)}
      linkError={linkError}
      onDismissLinkError={() => {
        setLinkError(null);
      }}
    />
  );
}

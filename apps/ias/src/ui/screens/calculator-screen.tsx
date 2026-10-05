import type { Build } from "@/contracts/build";
import type { InputSpec } from "@/contracts/inputs";
import type { ShareLinkError } from "@/contracts/share-link";
import { LinkErrorNotice } from "@/ui/components/link-error-notice";
import { Skyline } from "@/ui/components/skyline";
import { BreakpointsPanel, type LocatedTable, TablesPanel } from "@/ui/screens/breakpoints-panels";
import type { BuildEdit } from "@/ui/screens/build-edit";
import { CharacterPanel } from "@/ui/screens/character-panel";
import {
  PageBanner,
  PageFooter,
  PageTitle,
  SiteNavbar,
  usePageScroll,
} from "@/ui/screens/page-chrome";
import { SkillPanel } from "@/ui/screens/skill-panel";
import { SpeedPanel } from "@/ui/screens/speed-panel";
import { WeaponPanel } from "@/ui/screens/weapon-panel";
import { WereformPanel } from "@/ui/screens/wereform-panel";

export type { LocatedTable };

export interface CalculatorScreenProps {
  /** The raw UI state with the select values the form offers: a hidden field keeps its value. */
  readonly build: Build;
  /** `normalize(raw)`, which the attack view plays. */
  readonly normalized: Build;
  /** `availableInputs` of the raw state. */
  readonly inputs: InputSpec;
  /** Every table of `computeTables(normalize(raw))`, in order, each located at `build.current`. */
  readonly tables: readonly LocatedTable[];
  /** The entry of `tables` that holds `primaryTable(result)`: it feeds the summary tiles. */
  readonly primary: LocatedTable;
  /** Every change the player makes on the form, the table variable included. */
  readonly onEdit: (edit: BuildEdit) => void;
  /** Writes the link to the build to the clipboard, and rejects when the write fails. */
  readonly onCopyLink: () => Promise<void>;
  /** Why the link the page opened with did not load, if it did not. */
  readonly linkError: ShareLinkError | null;
  readonly onDismissLinkError: () => void;
}

export function CalculatorScreen({
  build,
  normalized,
  inputs,
  tables,
  primary,
  onEdit,
  onCopyLink,
  linkError,
  onDismissLinkError,
}: CalculatorScreenProps) {
  const page = usePageScroll();

  return (
    <div className="bg-background relative isolate min-h-screen overflow-x-clip">
      <PageBanner />
      <SiteNavbar scrolled={page.scrolled} titleGone={page.titleGone} onCopyLink={onCopyLink} />
      <main className="relative mx-auto max-w-[81rem] px-4">
        <PageTitle titleRef={page.titleRef} />
        {linkError === null ? null : (
          <div className="pb-4">
            <LinkErrorNotice error={linkError} onDismiss={onDismissLinkError} />
          </div>
        )}
        <div className="grid gap-2.5">
          <CharacterPanel build={build} onEdit={onEdit} />
          {inputs.fields.has("wereform") && (
            <WereformPanel build={build} inputs={inputs} onEdit={onEdit} />
          )}
          <SkillPanel build={build} inputs={inputs} onEdit={onEdit} />
          <WeaponPanel build={build} inputs={inputs} onEdit={onEdit} />
          <SpeedPanel build={build} inputs={inputs} onEdit={onEdit} />
          <BreakpointsPanel build={build} normalized={normalized} primary={primary} />
          <TablesPanel build={build} inputs={inputs} tables={tables} onEdit={onEdit} />
        </div>
      </main>
      <div className="relative">
        <PageFooter />
        <Skyline />
      </div>
    </div>
  );
}

import type { Build, Wereform } from "@/contracts/build";
import type { InputSpec } from "@/contracts/inputs";
import { Panel } from "@/ui/components/panel";
import { SegmentedToggle } from "@/ui/components/segmented-toggle";
import type { BuildEdit } from "@/ui/screens/build-edit";
import { wereformNames } from "@/ui/screens/labels";
import { wereformHint } from "@/ui/screens/option-hints";

interface WereformPanelProps {
  readonly build: Build;
  readonly inputs: InputSpec;
  readonly onEdit: (edit: BuildEdit) => void;
}

/** A player sees every wereform; the ones the class cannot take are disabled. */
const playerWereforms: readonly Wereform[] = ["none", "werebear", "werewolf"];

/** Comes before the skills, whose list depends on the wereform. */
export function WereformPanel({ build, inputs, onEdit }: WereformPanelProps) {
  return (
    <Panel title="Wereform">
      <SegmentedToggle<Wereform>
        label="Wereform"
        value={build.wereform}
        options={playerWereforms.map((wereform) => {
          const offered = inputs.wereforms.includes(wereform);

          return {
            value: wereform,
            label: wereformNames[wereform],
            disabled: !offered,
            hint: wereformHint(build.character, wereform, offered),
          };
        })}
        onValueChange={(wereform) => {
          onEdit({ kind: "build", field: "wereform", value: wereform });
        }}
        className="max-w-[37.5rem]"
      />
    </Panel>
  );
}

import { ChevronDownIcon } from "lucide-react";

import type { Shield } from "@/contracts/animation";
import { shieldGraphics } from "@/data/rules/sprites";
import { CheckField } from "@/ui/components/check-field";
import { attackViewLabels } from "@/ui/screens/attack-labels";

interface ShieldControlsProps {
  readonly shield: Shield;
  readonly onShieldChange: (shield: Shield) => void;
}

/** The shield of a skill that needs one, and Holy Shield, which draws its own in its place. */
export function ShieldControls({ shield, onShieldChange }: ShieldControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <label className="flex items-center gap-2.5">
        <span className="text-foreground/85 text-[1.0625rem]">{attackViewLabels.shield}</span>
        <span className="relative">
          <select
            value={shield.graphic}
            // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- React passes a ChangeEvent, whose DOM members are mutable
            onChange={(event) => {
              onShieldChange({ ...shield, graphic: event.target.value });
            }}
            className="border-border bg-input/60 text-figure focus-visible:ring-ring/50 h-10 cursor-pointer appearance-none rounded-lg border ps-3.5 pe-10 text-[1.0625rem] outline-none focus-visible:ring-3"
          >
            {shieldGraphics.graphics.map(({ graphic, name }) => (
              <option key={graphic} value={graphic}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2"
          />
        </span>
      </label>
      <CheckField
        label={attackViewLabels.holyShield}
        checked={shield.holy}
        onCheckedChange={(holy) => {
          onShieldChange({ ...shield, holy });
        }}
        hint={attackViewLabels.holyShieldHint}
      />
    </div>
  );
}

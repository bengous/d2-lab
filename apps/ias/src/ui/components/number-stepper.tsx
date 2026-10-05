import { NumberField } from "@base-ui/react/number-field";
import { cn } from "cn";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

import { InfoTip } from "@/ui/components/info-tip";

interface NumberStepperProps {
  readonly label: string;
  readonly value: number;
  /** Not called while the field is empty: it shows the last value again on blur. */
  readonly onValueChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly disabled?: boolean;
  /** Shows the value without the step buttons, for a value the user cannot set. */
  readonly readOnly?: boolean;
  /** Text of an info tip after the label. */
  readonly hint?: string | undefined;
  /** The item that sets `min`: a dashed gold outline on the control and a gold line under the label. */
  readonly itemFloor?: string | null | undefined;
  readonly className?: string;
}

const stepButton =
  "grid w-8 shrink-0 cursor-pointer place-items-center text-muted-foreground/60 transition-colors outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:size-4";

interface StepperGroupProps {
  readonly label: string;
  readonly readOnly: boolean;
  readonly describedBy: string | undefined;
}

function StepperGroup({ label, readOnly, describedBy }: StepperGroupProps) {
  return (
    <NumberField.Group
      className={cn(
        "bg-input/60 focus-within:border-ring/60 flex h-10 overflow-hidden rounded-lg border",
        describedBy !== undefined && "border-item/70 border-dashed",
      )}
    >
      {!readOnly && (
        <NumberField.Decrement
          aria-label={`Decrease ${label}`}
          className={cn(stepButton, "border-e")}
        >
          <MinusIcon />
        </NumberField.Decrement>
      )}
      <NumberField.Input
        aria-describedby={describedBy}
        className="text-figure w-[5.75rem] bg-transparent text-center text-xl outline-none"
      />
      {!readOnly && (
        <NumberField.Increment
          aria-label={`Increase ${label}`}
          className={cn(stepButton, "border-s")}
        >
          <PlusIcon />
        </NumberField.Increment>
      )}
    </NumberField.Group>
  );
}

interface StepperLabelProps {
  readonly inputId: string;
  readonly floorId: string;
  readonly label: string;
  readonly hint: string | undefined;
  readonly itemFloor: string | null;
}

function StepperLabel({ inputId, floorId, label, hint, itemFloor }: StepperLabelProps) {
  return (
    <span className="grid">
      <span className="flex items-center gap-1.5">
        <label htmlFor={inputId} className="text-foreground/85 text-[1.0625rem] whitespace-nowrap">
          {label}
        </label>
        {hint !== undefined && <InfoTip subject={label} text={hint} />}
      </span>
      {itemFloor !== null && (
        <span id={floorId} className="text-item text-xs">
          {itemFloor}
        </span>
      )}
    </span>
  );
}

export function NumberStepper({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled = false,
  readOnly = false,
  hint,
  itemFloor,
  className,
}: NumberStepperProps) {
  const inputId = useId();
  const floorId = useId();
  const floored = itemFloor !== undefined && itemFloor !== null;

  return (
    <NumberField.Root
      id={inputId}
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onValueChange(next);
        }
      }}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      readOnly={readOnly}
      className={cn(
        "flex items-center justify-between gap-3 data-disabled:opacity-50 max-sm:w-full",
        className,
      )}
    >
      <StepperLabel
        inputId={inputId}
        floorId={floorId}
        label={label}
        hint={hint}
        itemFloor={floored ? itemFloor : null}
      />
      <StepperGroup label={label} readOnly={readOnly} describedBy={floored ? floorId : undefined} />
    </NumberField.Root>
  );
}

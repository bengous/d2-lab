import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";

import type { WorkedExample } from "@/ui/components/info-tip";
import { OptionTip } from "@/ui/components/option-tip";

export interface SegmentOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
  readonly disabled?: boolean;
  /** Shown in a bubble over the option, and read as its description. */
  readonly hint?: string | null;
  /** Shown under the hint. */
  readonly worked?: WorkedExample | null;
}

interface SegmentedToggleProps<Value extends string> {
  readonly label: string;
  readonly value: Value;
  readonly options: readonly SegmentOption<Value>[];
  readonly onValueChange: (value: Value) => void;
  readonly className?: string;
}

export function SegmentedToggle<Value extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: SegmentedToggleProps<Value>) {
  return (
    <RadioGroup<Value>
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className={cn("flex h-10 rounded-lg border bg-muted", className)}
    >
      {options.map((option) => (
        <OptionTip
          key={option.value}
          text={option.hint ?? null}
          worked={option.worked ?? null}
          className="flex flex-auto"
        >
          {(descriptionId) => (
            <Radio.Root
              value={option.value}
              disabled={option.disabled ?? false}
              aria-describedby={descriptionId ?? undefined}
              className="text-muted-foreground hover:data-unchecked:text-foreground focus-visible:ring-ring/50 data-checked:text-primary data-checked:ember-edge data-checked:ember-fill [[role=radiogroup]>:has([data-unchecked])+*_&]:data-unchecked:border-s-border -m-px flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-transparent px-4 text-base whitespace-nowrap transition-[color,border-color,box-shadow] outline-none focus-visible:ring-3 data-disabled:pointer-events-none data-disabled:opacity-50 [[role=radiogroup]>:has([data-unchecked])+*_&]:data-unchecked:rounded-s-none"
            >
              {option.label}
            </Radio.Root>
          )}
        </OptionTip>
      ))}
    </RadioGroup>
  );
}

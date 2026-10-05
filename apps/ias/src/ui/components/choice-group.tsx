import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";
import type { ReactNode } from "react";

interface ChoiceGroupProps<Value extends string> {
  readonly label: string;
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  /** `PortraitTile`, `SkillChip` or `Divider` elements. */
  readonly children: ReactNode;
  readonly className?: string;
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `children: ReactNode` includes ReactElement, whose fields are mutable in @types/react
export function ChoiceGroup<Value extends string>({
  label,
  value,
  onValueChange,
  children,
  className,
}: ChoiceGroupProps<Value>) {
  return (
    <RadioGroup<Value>
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className={cn("flex flex-wrap items-start gap-2", className)}
    >
      {children}
    </RadioGroup>
  );
}

import { Checkbox } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useId } from "react";

import { InfoTip } from "@/ui/components/info-tip";

interface CheckFieldProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly hint?: string | undefined;
  readonly className?: string;
}

export function CheckField({ label, checked, onCheckedChange, hint, className }: CheckFieldProps) {
  const labelId = useId();

  return (
    <div className={cn("flex h-10 items-center gap-2", className)}>
      <label className="group/check flex cursor-pointer items-center gap-2.5">
        <Checkbox.Root
          aria-labelledby={labelId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="bg-input/60 group-hover/check:data-unchecked:border-foreground/30 focus-visible:ring-ring/50 data-checked:ember-edge data-checked:ember-fill grid size-5 shrink-0 place-items-center rounded-sm border transition-[border-color,box-shadow] outline-none focus-visible:ring-3"
        >
          <Checkbox.Indicator className="text-primary data-unchecked:hidden [&_svg]:size-3.5 [&_svg]:stroke-3">
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span
          id={labelId}
          className="text-foreground/85 group-hover/check:text-foreground text-[1.0625rem] whitespace-nowrap transition-colors"
        >
          {label}
        </span>
      </label>
      {hint !== undefined && <InfoTip subject={label} text={hint} />}
    </div>
  );
}

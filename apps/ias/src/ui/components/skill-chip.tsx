import { Radio } from "@base-ui/react/radio";
import { cn } from "cn";

import { OptionTip } from "@/ui/components/option-tip";

interface SkillChipProps {
  readonly value: string;
  readonly name: string;
  /** A game skill icon, shown as is: never cropped or recolored. `null` for a skill without an icon. */
  readonly iconSrc: string | null;
  /** Shown in a bubble over the chip, and read as its description. */
  readonly hint?: string | null;
  /** Fills its grid cell instead of the fixed chip width. */
  readonly fill?: boolean;
  /** Shows the icon alone; the bubble then names the skill. A chip without an icon keeps its name. */
  readonly nameHidden?: boolean;
  /** The item that grants the skill: a line in item gold, or a gold dot when the name is hidden. */
  readonly grantedBy?: string | null;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function SkillChip({
  value,
  name,
  iconSrc,
  hint = null,
  fill = false,
  nameHidden = false,
  grantedBy = null,
  disabled = false,
  className,
}: SkillChipProps) {
  const iconOnly = nameHidden && iconSrc !== null;
  const bubble = iconOnly ? [name, hint].filter((part) => part !== null).join(": ") : hint;

  return (
    <OptionTip text={bubble} className="flex">
      {(descriptionId) => (
        <Radio.Root
          value={value}
          disabled={disabled}
          aria-describedby={descriptionId ?? undefined}
          className={cn(
            "bg-muted text-muted-foreground hover:data-unchecked:border-foreground/25 hover:data-unchecked:text-foreground focus-visible:ring-ring/50 data-checked:text-primary data-checked:ember-edge data-checked:ember-fill relative flex min-h-[5.75rem] w-24 cursor-pointer flex-col items-center rounded-lg border px-2 text-center text-base leading-none transition-[color,border-color,box-shadow] outline-none focus-visible:ring-3 data-disabled:pointer-events-none data-disabled:opacity-50",
            iconSrc === null || iconOnly ? "justify-center" : "justify-start gap-1 pt-1.5 pb-1.5",
            fill && "w-full",
            nameHidden && "min-h-16 px-1",
            className,
          )}
        >
          {iconSrc !== null && (
            <img src={iconSrc} alt="" width={132} height={130} className="h-12 w-auto" />
          )}
          <span className={cn("text-sm", iconOnly && "sr-only")}>{name}</span>
          {grantedBy !== null && (
            <span
              aria-hidden="true"
              className={cn(
                "text-item text-xs",
                iconOnly &&
                  "bg-item absolute end-1.5 top-1.5 size-1.5 overflow-hidden rounded-full text-transparent",
              )}
            >
              {grantedBy}
            </span>
          )}
        </Radio.Root>
      )}
    </OptionTip>
  );
}

import { Radio } from "@base-ui/react/radio";
import { cn } from "cn";

interface PortraitTileProps {
  readonly value: string;
  readonly name: string;
  /** A game portrait, shown as is: never cropped or recolored. */
  readonly portraitSrc: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function PortraitTile({
  value,
  name,
  portraitSrc,
  disabled = false,
  className,
}: PortraitTileProps) {
  return (
    <Radio.Root
      value={value}
      disabled={disabled}
      className={cn(
        "group/tile focus-visible:ring-ring/50 flex w-24 cursor-pointer flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-3 data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
    >
      <span className="group-hover/tile:group-data-unchecked/tile:border-foreground/30 group-data-checked/tile:ember-edge group-data-checked/tile:ember-fill block w-full rounded-md border p-[3px] transition-[border-color,box-shadow]">
        <img
          src={portraitSrc}
          alt=""
          width={120}
          height={120}
          className="block aspect-square w-full rounded-[3px]"
        />
      </span>
      <span className="text-muted-foreground group-hover/tile:text-foreground group-data-checked/tile:text-primary text-base leading-5 transition-colors">
        {name}
      </span>
    </Radio.Root>
  );
}

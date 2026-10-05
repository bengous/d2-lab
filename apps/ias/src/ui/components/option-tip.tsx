import { Popover } from "@base-ui/react/popover";
import { type ReactNode, useId, useRef } from "react";

import { TipBubble, tipDescription, type WorkedExample } from "@/ui/components/info-tip";

interface OptionTipProps {
  /** `null` wraps the option without a tip. */
  readonly text: string | null;
  readonly worked?: WorkedExample | null;
  readonly className?: string;
  /** Renders the option, with the id its `aria-describedby` names. */
  readonly children: (descriptionId: string | null) => ReactNode;
}

/**
 * Wraps a radio option in a bubble that opens on hover, or on tap for touch. The wrapper takes the
 * pointer, so a disabled option opens it too; the radio stays the only focus stop and reads the
 * text as its description. A mouse click neither opens nor pins the bubble, so only the hovered
 * option shows one. The outer span holds the popover's focus guards, so the options of a group
 * stay adjacent siblings.
 */
export function OptionTip({ text, worked = null, className, children }: OptionTipProps) {
  const descriptionId = useId();
  const pointerType = useRef("");

  return (
    <span className={className}>
      {text === null ? (
        children(null)
      ) : (
        <Popover.Root>
          <Popover.Trigger
            openOnHover
            delay={150}
            nativeButton={false}
            role="presentation"
            tabIndex={-1}
            /** ARIA forbids them on a presentation role; the radio reads the tip as its description. */
            aria-haspopup={undefined}
            aria-expanded={undefined}
            render={<span className="flex flex-1 cursor-help" />}
            // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- React passes DOM events, whose members are mutable
            onPointerDown={(event) => {
              pointerType.current = event.pointerType;
            }}
            // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- React passes DOM events, whose members are mutable
            onClick={(event) => {
              if (pointerType.current === "mouse") {
                event.preventBaseUIHandler();
              }
            }}
          >
            {children(descriptionId)}
            <span id={descriptionId} className="sr-only">
              {tipDescription(text, worked)}
            </span>
          </Popover.Trigger>
          <TipBubble text={text} worked={worked} />
        </Popover.Root>
      )}
    </span>
  );
}

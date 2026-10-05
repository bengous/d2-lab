import { type RefObject, useEffect, useRef, useState } from "react";

import type { Build, CharacterId } from "@/contracts/build";
import { ChoiceGroup } from "@/ui/components/choice-group";
import { Divider } from "@/ui/components/divider";
import { Panel } from "@/ui/components/panel";
import { PortraitTile } from "@/ui/components/portrait-tile";
import type { BuildEdit } from "@/ui/screens/build-edit";
import { characterNames, mercenaries, playerClasses, portraitSrc } from "@/ui/screens/labels";

interface CharacterPanelProps {
  readonly build: Build;
  readonly onEdit: (edit: BuildEdit) => void;
}

/** Which ends of the strip hide more portraits. */
interface Overflow {
  readonly start: boolean;
  readonly end: boolean;
}

const fadeWidth = "2.5rem";

function overflowOf({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: Readonly<Pick<HTMLElement, "scrollLeft" | "clientWidth" | "scrollWidth">>): Overflow {
  return { start: scrollLeft > 1, end: scrollLeft + clientWidth < scrollWidth - 1 };
}

/** Fades the ends that hide more portraits, so the strip shows that it scrolls. */
function fadeOf({ start, end }: Overflow): string | undefined {
  if (!start && !end) {
    return undefined;
  }

  return `linear-gradient(to right, ${start ? "transparent" : "black"}, black ${fadeWidth}, black calc(100% - ${fadeWidth}), ${end ? "transparent" : "black"})`;
}

function tiles(characters: readonly CharacterId[]) {
  return characters.map((character) => (
    <PortraitTile
      key={character}
      value={character}
      name={characterNames[character]}
      portraitSrc={portraitSrc(character)}
      className="w-22 shrink-0 snap-center xl:w-full"
    />
  ));
}

interface Strip {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly overflow: Overflow;
}

/** Centers the selected portrait once, then tracks which ends of the strip hide portraits. */
function useStrip(): Strip {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<Overflow>({ start: false, end: false });

  useEffect(() => {
    const scroller = ref.current;

    if (scroller === null) {
      throw new Error("the character strip is not mounted");
    }

    const selected = scroller.querySelector<HTMLElement>("[data-checked]");

    if (selected !== null) {
      scroller.scrollLeft = selected.offsetLeft - (scroller.clientWidth - selected.offsetWidth) / 2;
    }

    const update = (): void => {
      setOverflow(overflowOf(scroller));
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, overflow };
}

export function CharacterPanel({ build, onEdit }: CharacterPanelProps) {
  const { ref, overflow } = useStrip();

  return (
    <Panel title="Character" titleHidden className="px-0 xl:px-4">
      <div
        ref={ref}
        style={{ maskImage: fadeOf(overflow) }}
        className="relative snap-x snap-mandatory overflow-x-auto xl:overflow-visible"
      >
        <ChoiceGroup<CharacterId>
          label="Character"
          value={build.character}
          onValueChange={(character) => {
            onEdit({ kind: "build", field: "character", value: character });
          }}
          className="w-max flex-nowrap px-4 pt-1 pb-2 xl:grid xl:w-auto xl:grid-cols-[repeat(8,minmax(0,1fr))_auto_repeat(4,minmax(0,1fr))] xl:px-0 xl:pb-0"
        >
          {tiles(playerClasses)}
          <Divider />
          {tiles(mercenaries)}
        </ChoiceGroup>
      </div>
    </Panel>
  );
}

import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";

import { gameData } from "@/data/generated/game-data";
import { CopyLinkButton } from "@/ui/components/copy-link-button";

const patch = gameData.version.split(".").slice(0, 2).join(".");

/** Dark halos that keep small text readable over the banner's fires. */
const legible =
  "[text-shadow:0_0_2px_var(--background),0_0_6px_var(--background),0_0_12px_var(--background)]";

/** The navbar's `h-14`: the page title counts as gone once it slides under it. */
const navbarHeight = 56;

/** Behind the navbar, the title and the first panels; the CSS glow stands in while the image loads or when it is missing. */
export function PageBanner() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10">
      <div className="ember-glow h-[56rem]" />
      <img
        src="art/banner.webp"
        alt=""
        width={2172}
        height={543}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-x-0 top-0 h-52 w-full mask-b-from-30% object-cover object-top select-none md:h-80"
      />
    </div>
  );
}

interface PageScroll {
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  /** The page has left its top: the navbar takes its dark background. */
  readonly scrolled: boolean;
  /** The page title has slid under the navbar, which shows the tool's name instead. */
  readonly titleGone: boolean;
}

export function usePageScroll(): PageScroll {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [titleGone, setTitleGone] = useState(false);

  useEffect(() => {
    const title = titleRef.current;

    if (title === null) {
      throw new Error("the page title is not mounted");
    }

    const update = (): void => {
      setScrolled(scrollY > 0);
      setTitleGone(title.getBoundingClientRect().bottom <= navbarHeight);
    };

    update();
    addEventListener("scroll", update, { passive: true });

    return () => {
      removeEventListener("scroll", update);
    };
  }, []);

  return { titleRef, scrolled, titleGone };
}

/** Says "Tools" while the page title shows and the tool's name once it is gone, so the name never shows twice. */
function ToolMenu({ titleGone }: { readonly titleGone: boolean }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className={`text-figure/90 hover:bg-foreground/5 data-popup-open:bg-foreground/5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.9375rem] ${legible}`}
      >
        <span className="grid justify-items-end">
          <span
            aria-hidden={titleGone}
            className={cn(
              "transition-opacity duration-300 [grid-area:1/1]",
              titleGone && "opacity-0",
            )}
          >
            Tools
          </span>
          <span
            aria-hidden={!titleGone}
            className={cn(
              "font-display font-semibold transition-opacity duration-300 [grid-area:1/1]",
              !titleGone && "opacity-0",
            )}
          >
            IAS Calculator
          </span>
        </span>
        <ChevronDownIcon className="text-muted-foreground size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="isolate z-50">
          <Menu.Popup className="bg-popover text-popover-foreground ring-foreground/10 min-w-56 rounded-lg p-1 shadow-md ring-1">
            <Menu.Item className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden">
              <CheckIcon className="text-primary size-4" />
              IAS Calculator
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface SiteNavbarProps {
  readonly scrolled: boolean;
  readonly titleGone: boolean;
  readonly onCopyLink: () => Promise<void>;
}

/** Clear over the banner at the top of the page, dark with an ember line once the page scrolls. */
export function SiteNavbar({ scrolled, titleGone, onCopyLink }: SiteNavbarProps) {
  return (
    <header
      className={cn(
        "after:via-primary/60 sticky top-0 z-30 transition-[background-color,box-shadow,backdrop-filter] duration-300 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:to-transparent after:opacity-0 after:transition-opacity after:duration-300",
        scrolled &&
          "bg-background/80 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.9)] backdrop-blur-md after:opacity-100",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-[81rem] items-center gap-3 px-4">
        <a href="./" className="flex items-center gap-2">
          <img
            src="logo.svg"
            alt="D2"
            width={114}
            height={64}
            className="h-5 w-auto drop-shadow-[0_0_6px_var(--background)]"
          />
          <span
            className={`font-display text-figure text-xl font-semibold tracking-wider uppercase ${legible}`}
          >
            Lab
          </span>
        </a>
        <div className="ms-auto flex items-center gap-1 md:gap-3">
          <ToolMenu titleGone={titleGone} />
          <CopyLinkButton
            onCopy={onCopyLink}
            className={`text-figure/90 text-[0.9375rem] ${legible}`}
          />
        </div>
      </nav>
    </header>
  );
}

interface PageTitleProps {
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- a ref is mutable by design: React writes the heading into `current`
export function PageTitle({ titleRef }: PageTitleProps) {
  return (
    <div className="py-6 md:py-9 xl:px-24">
      <div className="relative isolate before:absolute before:-inset-x-10 before:-inset-y-6 before:-z-10 before:bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--background)_70%,transparent),transparent)] md:before:max-w-[42rem]">
        <h1
          ref={titleRef}
          className="font-display text-figure text-3xl leading-tight font-semibold md:text-5xl"
        >
          IAS Calculator
        </h1>
        <p className={`text-figure/80 mt-2 max-w-xl text-sm md:text-base ${legible}`}>
          How many frames your attack takes, and the IAS that reaches the next breakpoint.
        </p>
      </div>
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className="text-muted-foreground/65 mx-auto grid max-w-[81rem] gap-1 px-4 pt-12 pb-10 text-center text-xs leading-relaxed">
      <p>Diablo II: Resurrected • Patch {patch}</p>
      <p>Fan-made, not affiliated with Blizzard Entertainment.</p>
      <p>Game icons and sprites © Blizzard Entertainment, Inc.</p>
      <p>Banner and skyline: AI-generated fan art.</p>
    </footer>
  );
}

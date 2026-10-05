import { cn } from "cn";

import { Panel } from "@/ui/components/panel";

const contractTokens = [
  "--background",
  "--foreground",
  "--figure",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--input",
  "--border",
  "--muted",
  "--muted-foreground",
  "--primary",
  "--primary-foreground",
  "--ring",
  "--now",
  "--now-surface",
  "--next",
  "--next-surface",
] as const;

const addedTokens = ["--secondary", "--accent", "--destructive"] as const;

interface TypeSample {
  readonly className: string;
  readonly spec: string;
  readonly use: string;
  readonly text: string;
}

const typeSamples: readonly TypeSample[] = [
  {
    className: "font-display text-4xl font-semibold",
    spec: "Cinzel 600 · 36 px",
    use: "Page title (front)",
    text: "IAS Calculator",
  },
  {
    className: "font-display text-[3.25rem] font-semibold",
    spec: "Cinzel 600 · 52 px",
    use: "Summary value",
    text: "(6)+11",
  },
  {
    className: "font-display text-3xl font-semibold",
    spec: "Cinzel 600 · 30 px",
    use: "Summary unit",
    text: "frames",
  },
  {
    className: "font-display text-figure text-base font-semibold",
    spec: "Cinzel 600 · 16 px",
    use: "Panel and group titles",
    text: "All breakpoints · Wereform",
  },
  {
    className: "text-xl",
    spec: "Alegreya Sans 400 · 20 px",
    use: "Stepper value, summary detail",
    text: "at 24 IAS (+4) · 0123456789",
  },
  {
    className: "text-[1.1875rem]",
    spec: "Alegreya Sans 400 · 19 px",
    use: "Search input",
    text: "Phase Blade",
  },
  {
    className: "text-[1.0625rem]",
    spec: "Alegreya Sans 400 · 17 px",
    use: "Field labels, table cells",
    text: "Weapon speed modifier −30 · 0123456789",
  },
  {
    className: "text-base",
    spec: "Alegreya Sans 400 · 16 px",
    use: "Tile, chip and segment names",
    text: "Necromancer · Conversion · Werebear",
  },
  {
    className: "text-sm",
    spec: "Alegreya Sans 400 · 14 px",
    use: "Summary label",
    text: "Now: · Next breakpoint:",
  },
  {
    className: "text-sm font-medium",
    spec: "Alegreya Sans 500 · 14 px",
    use: "Table header",
    text: "IAS · Frames · Status",
  },
];

function Swatch({ name }: { readonly name: string }) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  return (
    <figure className="grid gap-1.5">
      <div className="h-12 rounded-md border" style={{ background: `var(${name})` }} />
      <figcaption className="text-sm leading-tight">
        <code className="text-foreground">{name}</code>
        <br />
        <span className="text-muted-foreground">{value}</span>
      </figcaption>
    </figure>
  );
}

function SwatchGrid({ names }: { readonly names: readonly string[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-4">
      {names.map((name) => (
        <Swatch key={name} name={name} />
      ))}
    </div>
  );
}

export function TokenPanel() {
  return (
    <Panel title="Tokens">
      <div className="grid gap-5">
        <SwatchGrid names={contractTokens} />
        <p className="text-muted-foreground text-sm">
          Not in the theme contract, needed by the copied shadcn components: aliases of the tokens
          above, and an unmeasured red for invalid fields.
        </p>
        <SwatchGrid names={addedTokens} />
      </div>
    </Panel>
  );
}

export function TypePanel() {
  return (
    <Panel title="Type">
      <dl className="grid gap-4">
        {typeSamples.map((sample) => (
          <div key={sample.spec} className="grid gap-1 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-6">
            <dt className="text-muted-foreground text-sm">
              {sample.spec}
              <br />
              {sample.use}
            </dt>
            <dd className={cn("min-w-0 leading-tight", sample.className)}>{sample.text}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

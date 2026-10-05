import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Skyline } from "@/ui/components/skyline";
import { TokenPanel, TypePanel } from "@/ui/theme-preview/reference";
import { ConceptReplica } from "@/ui/theme-preview/replica";
import { StatesPanel } from "@/ui/theme-preview/states";

function ThemePreview() {
  return (
    <div className="bg-background relative isolate min-h-screen">
      <div
        aria-hidden="true"
        className="ember-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem]"
      />
      <header className="mx-auto max-w-[81rem] px-4 pt-9 pb-7">
        <h1 className="font-display text-4xl font-semibold">Braise theme</h1>
        <p className="text-muted-foreground/60 mt-2 text-xs tracking-[0.3em] uppercase">
          IAS Calculator · theme preview · banner and logo come with the screen
        </p>
      </header>
      <main>
        <div className="relative pb-28">
          <div className="mx-auto max-w-[81rem] px-4">
            <ConceptReplica />
          </div>
          <Skyline />
          <p className="text-muted-foreground/30 absolute inset-x-0 bottom-7 text-center text-[0.6875rem] tracking-[0.3em] uppercase">
            Fan-made, not affiliated with Blizzard Entertainment
          </p>
        </div>
        <div className="mx-auto grid max-w-[81rem] gap-2.5 px-4 pb-16">
          <TokenPanel />
          <TypePanel />
          <StatesPanel />
        </div>
      </main>
    </div>
  );
}

const container = document.querySelector("#root");

if (container === null) {
  throw new Error("theme.html has no #root element");
}

createRoot(container).render(
  <StrictMode>
    <ThemePreview />
  </StrictMode>,
);

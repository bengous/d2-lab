import { LinkIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ChoiceGroup } from "@/ui/components/choice-group";
import { NumberStepper } from "@/ui/components/number-stepper";
import { Panel } from "@/ui/components/panel";
import { PortraitTile } from "@/ui/components/portrait-tile";
import { SearchCombobox } from "@/ui/components/search-combobox";
import { SegmentedToggle } from "@/ui/components/segmented-toggle";
import { SkillChip } from "@/ui/components/skill-chip";
import { Button } from "@/ui/components/ui/button";
import {
  disabledWereforms,
  portraitSrc,
  skillIconSrc,
  weapons,
  wereforms,
} from "@/ui/theme-preview/demo-data";

const states = ["default", "hover", "focus-visible", "selected", "disabled"] as const;

type DemoState = (typeof states)[number];

const interactiveStates = ["default", "hover", "focus-visible", "disabled"] as const;

function ignoreChange(): undefined {
  return undefined;
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `children: ReactNode` includes ReactElement, whose fields are mutable in @types/react
function StateRow({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t pt-4 first:border-t-0 first:pt-0 md:grid-cols-[10rem_minmax(0,1fr)]">
      <h3 className="text-foreground/85 pt-1 text-base">{title}</h3>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-5">{children}</div>
    </div>
  );
}

// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `children: ReactNode` includes ReactElement, whose fields are mutable in @types/react
function StateCell({
  state,
  children,
}: {
  readonly state: DemoState;
  readonly children: ReactNode;
}) {
  return (
    <figure data-demo-state={state} className="grid justify-items-start gap-2">
      {children}
      <figcaption className="text-muted-foreground text-sm">{state}</figcaption>
    </figure>
  );
}

function ChoiceStates() {
  return (
    <>
      <StateRow title="Portrait tile">
        {states.map((state) => (
          <StateCell key={state} state={state}>
            <ChoiceGroup
              label={`Portrait tile, ${state}`}
              value={state === "selected" ? "paladin" : ""}
              onValueChange={ignoreChange}
            >
              <PortraitTile
                value="paladin"
                name="Paladin"
                portraitSrc={portraitSrc("paladin")}
                disabled={state === "disabled"}
              />
            </ChoiceGroup>
          </StateCell>
        ))}
      </StateRow>
      <StateRow title="Skill chip">
        {states.map((state) => (
          <StateCell key={state} state={state}>
            <ChoiceGroup
              label={`Skill chip, ${state}`}
              value={state === "selected" ? "smite" : ""}
              onValueChange={ignoreChange}
            >
              <SkillChip
                value="smite"
                name="Smite"
                iconSrc={skillIconSrc("smite")}
                disabled={state === "disabled"}
              />
            </ChoiceGroup>
          </StateCell>
        ))}
      </StateRow>
    </>
  );
}

function SegmentStates() {
  return (
    <StateRow title="Segmented toggle">
      {states.map((state) => (
        <StateCell key={state} state={state}>
          <SegmentedToggle
            label={`Wereform, ${state}`}
            value={state === "selected" ? "werebear" : "none"}
            options={state === "disabled" ? disabledWereforms : wereforms}
            onValueChange={ignoreChange}
            className="w-80"
          />
        </StateCell>
      ))}
    </StateRow>
  );
}

function FieldStates() {
  return (
    <>
      <StateRow title="Number stepper">
        {interactiveStates.map((state) => (
          <StateCell key={state} state={state}>
            <NumberStepper
              label="Your IAS"
              value={20}
              onValueChange={ignoreChange}
              disabled={state === "disabled"}
            />
          </StateCell>
        ))}
      </StateRow>
      <StateRow title="Search combobox">
        {states.map((state) => (
          <StateCell key={state} state={state}>
            <SearchCombobox
              label={`Weapon, ${state}`}
              items={weapons}
              value={state === "selected" ? "Phase Blade" : null}
              onValueChange={ignoreChange}
              itemToLabel={String}
              placeholder="Search a weapon"
              emptyText="No weapon found."
              className="w-64"
            />
          </StateCell>
        ))}
      </StateRow>
    </>
  );
}

function ButtonStates() {
  return (
    <StateRow title="Button">
      {interactiveStates.map((state) => (
        <StateCell key={state} state={state}>
          <div className="flex items-center gap-3">
            <Button disabled={state === "disabled"}>Primary</Button>
            <Button variant="outline" disabled={state === "disabled"}>
              Outline
            </Button>
            <Button variant="ghost" disabled={state === "disabled"}>
              <LinkIcon data-icon="inline-start" />
              Copy link
            </Button>
          </div>
        </StateCell>
      ))}
    </StateRow>
  );
}

export function StatesPanel() {
  return (
    <Panel title="States">
      <div className="grid gap-5">
        <p className="text-muted-foreground text-sm">
          Hover and focus-visible are live: point at the sample or press Tab to reach it.
        </p>
        <ChoiceStates />
        <SegmentStates />
        <FieldStates />
        <ButtonStates />
      </div>
    </Panel>
  );
}

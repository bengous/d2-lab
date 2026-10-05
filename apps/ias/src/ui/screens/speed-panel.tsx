import { Collapsible } from "@base-ui/react/collapsible";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";

import type { Build, SpeedNumberField } from "@/contracts/build";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import { variableFields } from "@/data/rules/field-values";
import { keysOf } from "@/lib/keys";
import { CheckField } from "@/ui/components/check-field";
import { dividedItem, dividedRow } from "@/ui/components/divider";
import { fieldGrid } from "@/ui/components/field-grid";
import { NumberStepper } from "@/ui/components/number-stepper";
import { Panel } from "@/ui/components/panel";
import type { BuildEdit } from "@/ui/screens/build-edit";
import {
  slowFlags,
  slowSteppers,
  speedFlags,
  speedSteppers,
  tableVariables,
} from "@/ui/screens/labels";
import { boundProps } from "@/ui/screens/option-hints";

/** The weapon panel shows these next to their weapon; the speed panel shows the other fields. */
const weaponIasFields: ReadonlySet<SpeedNumberField> = new Set(["primaryWias", "secondaryWias"]);

const speedPanelFields = keysOf(speedSteppers).filter((field) => !weaponIasFields.has(field));

const speedFlagFields = keysOf(speedFlags);

const slowNumberFields = keysOf(slowSteppers);

const slowFlagFields = keysOf(slowFlags);

interface SpeedPanelProps {
  readonly build: Build;
  readonly fields: ReadonlySet<FieldId>;
  readonly bounds: Pick<InputSpec, "floors" | "ceilings">;
  readonly onEdit: (edit: BuildEdit) => void;
}

function CurrentStepper({ build, bounds, onEdit }: Omit<SpeedPanelProps, "fields">) {
  const variable = tableVariables[build.tableVariable];
  const field = variableFields[build.tableVariable];

  return (
    <NumberStepper
      label={variable.currentLabel}
      value={build.current}
      onValueChange={(current) => {
        onEdit({ kind: "build", field: "current", value: current });
      }}
      {...(field === null
        ? { min: variable.min, max: variable.max }
        : boundProps(field, bounds, variable))}
    />
  );
}

function SpeedFields({ build, fields, bounds, onEdit }: SpeedPanelProps) {
  const shown = speedPanelFields.filter((field) => fields.has(field));

  return (
    <>
      {fields.has("current") && <CurrentStepper build={build} bounds={bounds} onEdit={onEdit} />}
      {shown.map((field) => (
        <NumberStepper
          key={field}
          {...speedSteppers[field]}
          {...boundProps(field, bounds, speedSteppers[field])}
          className={dividedItem}
          value={build.speed[field]}
          onValueChange={(value) => {
            onEdit({ kind: "speed", field, value });
          }}
        />
      ))}
      {speedFlagFields.flatMap((field) =>
        fields.has(field)
          ? [
              <CheckField
                key={field}
                {...speedFlags[field]}
                className={dividedItem}
                checked={build.speed[field]}
                onCheckedChange={(checked) => {
                  onEdit({ kind: "speed", field, value: checked });
                }}
              />,
            ]
          : [],
      )}
    </>
  );
}

function SlowFields({ build, fields, onEdit }: Omit<SpeedPanelProps, "bounds">) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] items-center gap-x-4 gap-y-3 border-t pt-3 xl:gap-x-12">
      {slowNumberFields.flatMap((field) =>
        fields.has(field)
          ? [
              <NumberStepper
                key={field}
                {...slowSteppers[field]}
                value={build.slows[field]}
                onValueChange={(value) => {
                  onEdit({ kind: "slows", field, value });
                }}
              />,
            ]
          : [],
      )}
      {slowFlagFields.flatMap((field) =>
        fields.has(field)
          ? [
              <CheckField
                key={field}
                {...slowFlags[field]}
                checked={build.slows[field]}
                onCheckedChange={(checked) => {
                  onEdit({ kind: "slows", field, value: checked });
                }}
              />,
            ]
          : [],
      )}
    </div>
  );
}

function activeSlows(build: Build, fields: ReadonlySet<FieldId>): number {
  const numbers = slowNumberFields.filter((field) => fields.has(field) && build.slows[field] > 0);
  const flags = slowFlagFields.filter((field) => fields.has(field) && build.slows[field]);

  return numbers.length + flags.length;
}

interface SpeedPanelInputs {
  readonly build: Build;
  readonly inputs: Pick<InputSpec, "fields" | "floors" | "ceilings">;
  readonly onEdit: (edit: BuildEdit) => void;
}

export function SpeedPanel({ build, inputs, onEdit }: SpeedPanelInputs) {
  const { fields } = inputs;
  const hasSlows = [...slowNumberFields, ...slowFlagFields].some((field) => fields.has(field));
  const active = activeSlows(build, fields);

  return (
    <Panel title="Speed">
      <Collapsible.Root className="grid gap-3">
        <div className={cn(fieldGrid, dividedRow)}>
          <SpeedFields build={build} fields={fields} bounds={inputs} onEdit={onEdit} />
          {hasSlows && (
            <Collapsible.Trigger
              className={cn(
                dividedItem,
                "group/slows text-foreground/85 hover:border-foreground/25 hover:text-foreground focus-visible:ring-ring/50 data-panel-open:border-foreground/25 col-span-full -mx-3 flex h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 text-[1.0625rem] transition-colors outline-none focus-visible:ring-3",
              )}
            >
              <span className="whitespace-nowrap">
                PvP slows
                {active > 0 && <span className="text-primary ms-2 text-sm">{active} active</span>}
              </span>
              <ChevronDownIcon className="size-5 transition-transform group-data-panel-open/slows:rotate-180" />
            </Collapsible.Trigger>
          )}
        </div>
        {hasSlows && (
          <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
            <SlowFields build={build} fields={fields} onEdit={onEdit} />
          </Collapsible.Panel>
        )}
      </Collapsible.Root>
    </Panel>
  );
}

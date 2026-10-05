import { cn } from "cn";

import type { Build, WeaponId } from "@/contracts/build";
import type { WeaponData } from "@/contracts/game-data";
import type { FieldId, InputSpec } from "@/contracts/inputs";
import { gameData } from "@/data/generated/game-data";
import { isRunewordBase, runewordBases } from "@/data/rules/equipment";
import { neededRuneword } from "@/engine/weapon-offer";
import { CheckField } from "@/ui/components/check-field";
import { dividedItem, dividedRow } from "@/ui/components/divider";
import { fieldGrid, fieldGridWide } from "@/ui/components/field-grid";
import { NumberStepper } from "@/ui/components/number-stepper";
import { OptionTip } from "@/ui/components/option-tip";
import { Panel } from "@/ui/components/panel";
import type { BuildEdit } from "@/ui/screens/build-edit";
import { speedSteppers } from "@/ui/screens/labels";
import { boundProps, runewordWeaponHints } from "@/ui/screens/option-hints";
import { WeaponPicker } from "@/ui/screens/weapon-picker";

const weaponsById: ReadonlyMap<WeaponId, WeaponData> = new Map(
  gameData.weapons.map((weapon) => [weapon.id, weapon]),
);

function weaponData(id: WeaponId): WeaponData {
  const weapon = weaponsById.get(id);

  if (weapon === undefined) {
    throw new Error(`no weapon "${id}" in the game data`);
  }

  return weapon;
}

type Hand = "primary" | "secondary";

interface HandRowProps {
  readonly build: Build;
  readonly fields: ReadonlySet<FieldId>;
  readonly bounds: Pick<InputSpec, "floors" | "ceilings">;
  readonly hand: Hand;
  readonly weapons: readonly WeaponId[];
  /** Why this hand carries a runeword: a dashed gold outline and a tip on hover. */
  readonly runewordTip: string | null;
  /** Shows the hand's name before the search: only a dual wield has two rows. */
  readonly dual: boolean;
  readonly onEdit: (edit: BuildEdit) => void;
}

const hands = {
  primary: {
    name: "Main hand",
    modifier: "Weapon speed modifier",
    wias: "primaryWias",
    hint: "Speed modifier of the weapon base, read from the game files. Lower is faster.",
  },
  secondary: {
    name: "Off-hand",
    modifier: "Off-hand speed modifier",
    wias: "secondaryWias",
    hint: "Speed modifier of the off-hand weapon base, read from the game files. Lower is faster.",
  },
} as const;

function ignoreChange(): undefined {
  return undefined;
}

function WeaponSearch({
  build,
  hand,
  weapons,
  runewordTip,
  dual,
  onEdit,
}: Omit<HandRowProps, "fields" | "bounds">) {
  return (
    <OptionTip text={runewordTip} className="flex min-w-60 flex-1 max-sm:min-w-40">
      {(descriptionId) => (
        <WeaponPicker
          label={dual ? `${hands[hand].name} weapon` : "Weapon"}
          weapons={weapons.map((id) => weaponData(id))}
          value={weaponData(build[hand])}
          onValueChange={(weapon) => {
            onEdit({ kind: "build", field: hand, value: weapon.id });
          }}
          describedBy={descriptionId ?? undefined}
          className={cn("flex-1", runewordTip !== null && "border-item/70 border-dashed")}
        />
      )}
    </OptionTip>
  );
}

function HandRow(props: HandRowProps) {
  const { build, fields, bounds, hand, dual, onEdit } = props;
  const spec = hands[hand];

  return (
    <div className={cn(fieldGrid, dividedRow)}>
      <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", fieldGridWide)}>
        {dual && (
          <span
            className="text-foreground/85 w-20 text-[1.0625rem] whitespace-nowrap"
            aria-hidden="true"
          >
            {spec.name}
          </span>
        )}
        <WeaponSearch {...props} />
      </div>
      <NumberStepper
        className={dividedItem}
        label={spec.modifier}
        value={weaponData(build[hand]).wsm}
        onValueChange={ignoreChange}
        readOnly
        hint={spec.hint}
      />
      {fields.has(spec.wias) && (
        <NumberStepper
          className={dividedItem}
          {...speedSteppers[spec.wias]}
          {...boundProps(spec.wias, bounds, speedSteppers[spec.wias])}
          value={build.speed[spec.wias]}
          onValueChange={(value) => {
            onEdit({ kind: "speed", field: spec.wias, value });
          }}
        />
      )}
    </div>
  );
}

/** The panel's gold caption, and the tip of the hand that holds the base of the runeword. */
interface RunewordMarks {
  readonly caption: string | null;
  readonly tips: Readonly<Record<Hand, string | null>>;
}

const noRuneword: RunewordMarks = { caption: null, tips: { primary: null, secondary: null } };

/** The coerced build holds a base of the runeword it needs in one hand, the main hand first. */
function runewordMarks(build: Build, inputs: InputSpec): RunewordMarks {
  const requirement = inputs.fields.has("primary") ? neededRuneword(build) : null;

  if (requirement === null) {
    return noRuneword;
  }

  const { caption, text } = runewordWeaponHints[requirement.runeword];
  const inPrimary = isRunewordBase(weaponData(build.primary), runewordBases[requirement.runeword]);

  return {
    caption,
    tips: { primary: inPrimary ? text : null, secondary: inPrimary ? null : text },
  };
}

interface WeaponPanelProps {
  readonly build: Build;
  readonly inputs: InputSpec;
  readonly onEdit: (edit: BuildEdit) => void;
}

export function WeaponPanel({ build, inputs, onEdit }: WeaponPanelProps) {
  const dual = inputs.fields.has("secondary");
  const { caption, tips } = runewordMarks(build, inputs);
  const shared = { build, fields: inputs.fields, bounds: inputs, dual, onEdit };

  return (
    <Panel
      title={dual ? "Weapons" : "Weapon"}
      action={caption === null ? undefined : <span className="text-item text-xs">{caption}</span>}
    >
      <div className="grid gap-3">
        {inputs.fields.has("primary") && (
          <HandRow
            {...shared}
            hand="primary"
            weapons={inputs.primaryWeapons}
            runewordTip={tips.primary}
          />
        )}
        {dual && (
          <HandRow
            {...shared}
            hand="secondary"
            weapons={inputs.secondaryWeapons}
            runewordTip={tips.secondary}
          />
        )}
        {inputs.fields.has("oneHanded") && (
          <CheckField
            label="One-handed"
            checked={build.oneHanded}
            onCheckedChange={(oneHanded) => {
              onEdit({ kind: "build", field: "oneHanded", value: oneHanded });
            }}
            hint="A Barbarian can wield a two-handed sword in one hand."
          />
        )}
      </div>
    </Panel>
  );
}

import { useState } from "react";

import type { Wereform } from "@/contracts/build";
import { BreakpointTable } from "@/ui/components/breakpoint-table";
import { ChoiceGroup } from "@/ui/components/choice-group";
import { Divider } from "@/ui/components/divider";
import { NumberStepper } from "@/ui/components/number-stepper";
import { Panel } from "@/ui/components/panel";
import { PortraitTile } from "@/ui/components/portrait-tile";
import { SearchCombobox } from "@/ui/components/search-combobox";
import { SegmentedToggle } from "@/ui/components/segmented-toggle";
import { SkillChip } from "@/ui/components/skill-chip";
import { SummaryTile } from "@/ui/components/summary-tile";
import {
  classes,
  mercenaries,
  nextRow,
  nowRow,
  portraitSrc,
  rows,
  skillIconSrc,
  skills,
  weapons,
  wereforms,
} from "@/ui/theme-preview/demo-data";

function CharacterPanel() {
  const [character, setCharacter] = useState("paladin");

  return (
    <Panel title="Character" titleHidden>
      <ChoiceGroup
        label="Character"
        value={character}
        onValueChange={setCharacter}
        className="lg:grid lg:grid-cols-[repeat(8,minmax(0,1fr))_auto_repeat(4,minmax(0,1fr))]"
      >
        {classes.map((choice) => (
          <PortraitTile
            key={choice.value}
            value={choice.value}
            name={choice.name}
            portraitSrc={portraitSrc(choice.value)}
            className="lg:w-full"
          />
        ))}
        <Divider />
        {mercenaries.map((choice) => (
          <PortraitTile
            key={choice.value}
            value={choice.value}
            name={choice.name}
            portraitSrc={portraitSrc(choice.value)}
            className="lg:w-full"
          />
        ))}
      </ChoiceGroup>
    </Panel>
  );
}

function SkillPanel() {
  const [skill, setSkill] = useState("smite");
  const [wereform, setWereform] = useState<Wereform>("none");

  return (
    <Panel title="Skill">
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        <ChoiceGroup label="Skill" value={skill} onValueChange={setSkill} className="gap-3">
          {skills.map((choice) => (
            <SkillChip
              key={choice.value}
              value={choice.value}
              name={choice.name}
              iconSrc={skillIconSrc(choice.value)}
            />
          ))}
        </ChoiceGroup>
        <Divider />
        <div className="grid min-w-72 flex-1 content-start gap-3">
          <h3 className="font-display text-figure pt-2 text-base leading-6 font-semibold">
            Wereform
          </h3>
          <SegmentedToggle
            label="Wereform"
            value={wereform}
            options={wereforms}
            onValueChange={setWereform}
          />
        </div>
      </div>
    </Panel>
  );
}

function WeaponPanel() {
  const [weapon, setWeapon] = useState<string | null>("Phase Blade");
  const [modifier, setModifier] = useState(-30);

  return (
    <Panel title="Weapon">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <SearchCombobox
          label="Weapon"
          items={weapons}
          value={weapon}
          onValueChange={setWeapon}
          itemToLabel={String}
          placeholder="Search a weapon"
          emptyText="No weapon found."
          className="max-w-[37.5rem] flex-1"
        />
        <Divider />
        <NumberStepper
          label="Weapon speed modifier"
          value={modifier}
          onValueChange={setModifier}
          min={-60}
          max={60}
        />
      </div>
    </Panel>
  );
}

function SpeedPanel() {
  const [ias, setIas] = useState(20);
  const [fanaticism, setFanaticism] = useState(0);
  const [burstOfSpeed, setBurstOfSpeed] = useState(0);

  return (
    <Panel title="Speed">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <NumberStepper label="Your IAS" value={ias} onValueChange={setIas} min={0} max={400} />
        <Divider />
        <NumberStepper
          label="Fanaticism"
          value={fanaticism}
          onValueChange={setFanaticism}
          min={0}
          max={99}
        />
        <Divider />
        <NumberStepper
          label="Burst of Speed"
          value={burstOfSpeed}
          onValueChange={setBurstOfSpeed}
          min={0}
          max={99}
        />
      </div>
    </Panel>
  );
}

export function ConceptReplica() {
  return (
    <div className="grid gap-2.5">
      <CharacterPanel />
      <SkillPanel />
      <WeaponPanel />
      <SpeedPanel />
      <Panel title="Breakpoints">
        <div className="grid gap-3 md:grid-cols-2">
          <SummaryTile tone="now" label="Now:" value="8" unit="frames" detail="at 20 IAS" />
          <SummaryTile
            tone="next"
            label="Next breakpoint:"
            value="7"
            unit="frames"
            detail="at 24 IAS (+4)"
          />
        </div>
      </Panel>
      <Panel title="All breakpoints">
        <BreakpointTable
          variableLabel="IAS"
          rows={rows}
          now={nowRow}
          next={nextRow}
          floor={null}
          count="attacks"
        />
      </Panel>
    </div>
  );
}

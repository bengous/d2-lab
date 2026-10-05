import { cn } from "cn";
import type { ReactNode } from "react";

import type { Build, SkillId } from "@/contracts/build";
import type { InputSpec } from "@/contracts/inputs";
import { CheckField } from "@/ui/components/check-field";
import { ChoiceGroup } from "@/ui/components/choice-group";
import { Panel } from "@/ui/components/panel";
import { SkillChip } from "@/ui/components/skill-chip";
import { useMediaQuery } from "@/ui/hooks/use-media-query";
import { useStoredFlag } from "@/ui/hooks/use-stored-flag";
import type { BuildEdit } from "@/ui/screens/build-edit";
import { skillIconSrc, skillName } from "@/ui/screens/labels";
import { skillHint } from "@/ui/screens/option-hints";
import { grantingItem, type SkillGroup, skillGroups } from "@/ui/screens/skill-groups";

interface SkillPanelProps {
  readonly build: Build;
  readonly inputs: InputSpec;
  readonly onEdit: (edit: BuildEdit) => void;
}

/** Names start hidden on a phone, where the icons alone fill fewer rows. */
const phoneLayout = "(width < 48rem)";

interface SkillGroupRowProps {
  readonly group: SkillGroup;
  /** Grid columns of the chips. */
  readonly grid: string;
  readonly children: ReactNode;
}

/** The legend floats: a browser draws an unfloated legend inside the fieldset's top border. */
// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- `children: ReactNode` includes ReactElement, whose fields are mutable in @types/react
function SkillGroupRow({ group, grid, children }: SkillGroupRowProps) {
  return (
    <fieldset className={cn("min-w-0", group.granted && "border-t pt-3")}>
      <legend className="text-muted-foreground float-left mb-2 w-full text-sm">
        {group.title}
      </legend>
      <div className={cn("grid clear-left gap-2", grid)}>{children}</div>
    </fieldset>
  );
}

interface SkillChoicesProps extends SkillPanelProps {
  readonly namesHidden: boolean;
}

function SkillChoices({ build, inputs, onEdit, namesHidden }: SkillChoicesProps) {
  const grid = namesHidden
    ? "grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]"
    : "grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]";

  return (
    <ChoiceGroup<SkillId>
      label="Skill"
      value={build.skill}
      onValueChange={(skill) => {
        onEdit({ kind: "build", field: "skill", value: skill });
      }}
      className="grid w-full gap-3"
    >
      {skillGroups(build.character, inputs.skills).map((group) => (
        <SkillGroupRow key={group.title} group={group} grid={grid}>
          {group.skills.map((skill) => (
            <SkillChip
              key={skill}
              value={skill}
              name={skillName(skill)}
              iconSrc={skillIconSrc(skill)}
              hint={skillHint(build.character, skill)}
              fill
              nameHidden={namesHidden}
              grantedBy={group.granted ? grantingItem(build.character, skill) : null}
            />
          ))}
        </SkillGroupRow>
      ))}
    </ChoiceGroup>
  );
}

export function SkillPanel({ build, inputs, onEdit }: SkillPanelProps) {
  const phone = useMediaQuery(phoneLayout);
  const [storedNamesShown, setNamesShown] = useStoredFlag("ias:skill-names");
  const namesShown = storedNamesShown ?? !phone;

  return (
    <Panel
      title="Skill"
      action={
        <CheckField label="Show names" checked={namesShown} onCheckedChange={setNamesShown} />
      }
    >
      <SkillChoices build={build} inputs={inputs} onEdit={onEdit} namesHidden={!namesShown} />
    </Panel>
  );
}

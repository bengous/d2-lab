import { cn } from "cn";
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";

import type { Timeline } from "@/contracts/animation";
import type { Build } from "@/contracts/build";
import type { BreakpointRow } from "@/contracts/result";
import { hitCountChoices } from "@/data/rules/rollbacks";
import { skillRule } from "@/data/rules/skills";
import { shieldGraphics, shieldSkills } from "@/data/rules/sprites";
import { attackTimeline } from "@/engine/animation";
import { keysOf } from "@/lib/keys";
import { NumberStepper } from "@/ui/components/number-stepper";
import { SegmentedToggle } from "@/ui/components/segmented-toggle";
import { useSprites } from "@/ui/components/sprite-player";
import { Button } from "@/ui/components/ui/button";
import { type GameClock, type Playback, useGameClock } from "@/ui/hooks/use-game-clock";
import {
  attackSentence,
  attackViewLabels,
  type Comparison,
  comparisonText,
  hitCountHint,
  hitCountLabel,
  moveOf,
  type Phrase,
  playbackLabels,
  sceneLabel,
  sequenceSentence,
  unavailableText,
} from "@/ui/screens/attack-labels";
import { FilmStrip, Scene } from "@/ui/screens/attack-scene";
import { placedAt, placeTicks } from "@/ui/screens/attack-ticks";
import { characterNames, skillName } from "@/ui/screens/labels";
import { ShieldControls } from "@/ui/screens/shield-controls";

const controlHeight = "h-10 px-3.5 text-base";

function PhraseText({ phrase }: { readonly phrase: Phrase }) {
  return phrase.map((part, position) => (
    <span
      // oxlint-disable-next-line react/no-array-index-key -- the parts of a sentence never reorder, and two can read the same
      key={position}
      className={cn(part.figure && "text-now font-bold tabular-nums")}
    >
      {part.text}
    </span>
  ));
}

interface SentenceProps {
  readonly build: Build;
  readonly timeline: Timeline;
  readonly rollback: Rollback | null;
}

function Sentence({ build, timeline, rollback }: SentenceProps) {
  const frames = timeline.ticks.length;
  const hitFrames = timeline.ticks.flatMap(({ hit }, index) => (hit === null ? [] : [index + 1]));
  const { lead, detail } =
    rollback === null
      ? attackSentence(moveOf(build.skill), frames, hitFrames)
      : sequenceSentence({
          skill: skillName(build.skill),
          character: characterNames[build.character],
          hits: timeline.hits,
          fullRollback: rollback.full,
        });

  return (
    <div>
      <p className="text-figure max-w-[46ch] text-lg leading-snug">
        <PhraseText phrase={lead} />
      </p>
      <p className="text-muted-foreground mt-1.5 max-w-[52ch] text-[0.9375rem]">{detail}</p>
    </div>
  );
}

interface CellRowProps {
  readonly label: string;
  readonly cells: number;
  readonly tone: "now" | "next";
}

function CellRow({ label, cells, tone }: CellRowProps) {
  return (
    <div className="text-muted-foreground grid items-center gap-x-2.5 gap-y-0.5 text-[0.8125rem] sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span>{label}</span>
      <span aria-hidden="true" className="flex flex-wrap gap-0.5">
        {Array.from({ length: cells }, (_, cell) => cell).map((cell) => (
          <span
            key={cell}
            className={cn("h-3 w-3.5 rounded-[2px]", tone === "now" ? "bg-now/55" : "bg-next/55")}
          />
        ))}
      </span>
    </div>
  );
}

/** One cell per game frame, now and at the next breakpoint. */
function ComparisonRows({ comparison }: { readonly comparison: Comparison }) {
  const text = comparisonText(comparison);

  return (
    <div className="grid gap-1 border-t border-dashed pt-2.5">
      <p className="text-next text-sm">{text.summary}</p>
      <CellRow label={text.now} cells={comparison.frames} tone="now" />
      {text.next !== null && comparison.next !== null && (
        <CellRow label={text.next} cells={comparison.next.frames} tone="next" />
      )}
    </div>
  );
}

function PlaybackControls({ clock }: { readonly clock: GameClock }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedToggle<Playback>
        label={attackViewLabels.playback}
        value={clock.playback}
        options={keysOf(playbackLabels).map((playback) => ({
          value: playback,
          label: playbackLabels[playback],
        }))}
        onValueChange={clock.setPlayback}
      />
      <Button
        variant="outline"
        disabled={clock.playback !== "step"}
        onClick={clock.step}
        className={controlHeight}
      >
        {attackViewLabels.nextFrame}
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}

/** A rollback skill: the hit counts the view offers, and how far each hit but the last goes back. */
interface Rollback {
  readonly min: number;
  readonly max: number;
  readonly start: number;
  readonly hint: string;
  /** Back to the start of the swing, not part of the way. */
  readonly full: boolean;
}

function rollbackOf(build: Build, now: BreakpointRow): Rollback | null {
  const rule = skillRule(build.skill);

  if (rule.family !== "rollback") {
    return null;
  }

  const choice = hitCountChoices.bySkill[build.skill] ?? hitCountChoices.other;

  return {
    min: choice.min,
    max: choice.max,
    start: choice.start ?? now.hits.length,
    hint: hitCountHint(build.skill, now.hits.length),
    full: rule.rollback.factor === 100,
  };
}

interface AttackPlayerProps {
  readonly build: Build;
  readonly timeline: Timeline;
  readonly next: Comparison["next"];
  readonly rollback: Rollback | null;
  readonly onHitCountChange: (hits: number) => void;
}

function AttackPlayer({ build, timeline, next, rollback, onHitCountChange }: AttackPlayerProps) {
  const clock = useGameClock();
  const sprites = useSprites(timeline);
  const groups = useMemo(() => placeTicks(timeline), [timeline]);
  const frames = timeline.ticks.length;
  const index = clock.tick % frames;
  const hits = timeline.hits.length;
  const move = moveOf(build.skill);

  return (
    <>
      <div className="grid items-center gap-4.5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Scene
          sprites={sprites}
          placed={placedAt(groups, index)}
          hits={hits}
          label={sceneLabel(characterNames[build.character], move)}
        />
        <Sentence build={build} timeline={timeline} rollback={rollback} />
      </div>
      {sprites.kind === "ready" && <FilmStrip sprites={sprites} groups={groups} index={index} />}
      <ComparisonRows
        comparison={{
          move,
          variable: build.tableVariable,
          current: build.current,
          hits,
          frames,
          next,
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlaybackControls clock={clock} />
        {rollback !== null && (
          <NumberStepper
            label={hitCountLabel(skillName(build.skill))}
            value={hits}
            onValueChange={onHitCountChange}
            min={rollback.min}
            max={rollback.max}
            hint={rollback.hint}
          />
        )}
      </div>
    </>
  );
}

interface AttackViewProps {
  /** The normalized build, which the tables come from. */
  readonly build: Build;
  readonly now: BreakpointRow;
  /** `null` at the fastest breakpoint. */
  readonly next: BreakpointRow | null;
}

function AttackSection({ id, build, now, next }: AttackViewProps & { readonly id: string }) {
  const rollback = rollbackOf(build, now);
  const [chosen, setChosen] = useState<number | null>(null);
  const [shield, setShield] = useState(shieldGraphics.start);
  const hitCount = rollback === null ? null : (chosen ?? rollback.start);
  const timeline = useMemo(
    () => attackTimeline(build, hitCount, shield),
    [build, hitCount, shield],
  );

  const nextTimeline = useMemo(
    () =>
      next === null ? null : attackTimeline({ ...build, current: next.value }, hitCount, shield),
    [build, next, hitCount, shield],
  );

  return (
    <section
      id={id}
      aria-label={attackViewLabels.section}
      className="bg-figure/[0.02] grid gap-3.5 rounded-lg border p-4"
    >
      {timeline.kind === "unavailable" ? (
        <p className="text-muted-foreground">
          {unavailableText(skillName(build.skill), timeline.reason)}
        </p>
      ) : (
        <>
          <AttackPlayer
            build={build}
            timeline={timeline}
            next={
              next === null || nextTimeline?.kind !== "timeline"
                ? null
                : { value: next.value, frames: nextTimeline.ticks.length }
            }
            rollback={rollback}
            onHitCountChange={setChosen}
          />
          {shieldSkills.skills.some((skill) => skill === build.skill) && (
            <ShieldControls shield={shield} onShieldChange={setShield} />
          )}
        </>
      )}
    </section>
  );
}

/** "Watch the attack" unfolds the attack of the build at its current breakpoint. */
export function AttackView({ build, now, next }: AttackViewProps) {
  const [open, setOpen] = useState(false);
  const sectionId = useId();

  return (
    <div className="grid gap-3">
      <div>
        <Button
          variant="outline"
          aria-expanded={open}
          aria-controls={open ? sectionId : undefined}
          onClick={() => {
            setOpen(!open);
          }}
          className={controlHeight}
        >
          {open ? attackViewLabels.hide : attackViewLabels.watch}
          {open ? (
            <ChevronUpIcon data-icon="inline-end" />
          ) : (
            <ChevronDownIcon data-icon="inline-end" />
          )}
        </Button>
      </div>
      {open && (
        <AttackSection key={build.skill} id={sectionId} build={build} now={now} next={next} />
      )}
    </div>
  );
}

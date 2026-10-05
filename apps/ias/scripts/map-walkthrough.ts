import { join } from "node:path";

import type { Build } from "@/contracts/build";
import type { BreakpointRow } from "@/contracts/result";
import { gameFramesPerSecond } from "@/data/rules/animation";
import { ceilingRules } from "@/data/rules/floors";
import { fieldRules } from "@/data/rules/form-fields";
import { shieldGraphics } from "@/data/rules/sprites";
import { attackTimeline } from "@/engine/animation";
import { computeTables } from "@/engine/compute-tables";
import { resolveContext } from "@/engine/context";
import { defaultBuild } from "@/engine/default-build";
import { locate } from "@/engine/locate";
import { normalize, resolveBuild } from "@/engine/normalize";
import { primaryTable } from "@/engine/primary-table";
import { eiasValues, iasToEias } from "@/engine/speed";
import { keysOf } from "@/lib/keys";
import { parseShareLink } from "@/share-link/parse";
import { perSecond } from "@/ui/screens/hit-labels";

import { inlinedSprites } from "./map-sprites";

/** The build the map walks through: a Zeal Paladin with a Thunder Maul at 83 IAS, Fanaticism 20. */
export const walkthroughLink =
  "?v=1&class=paladin&skill=zeal&weapon=thunder-maul&current=83&fana=20";

export const walkthroughPath = join(import.meta.dir, "../../../docs/map/data-walkthrough.js");

type FieldValue = string | number | boolean;

/** `[field, before, after]`, with `speed.` and `slows.` prefixes for the nested fields. */
type Change = readonly [string, FieldValue | undefined, FieldValue];

type FieldEntry = readonly [string, FieldValue];

function prefixed<Key extends string>(
  prefix: string,
  group: Readonly<Record<Key, FieldValue>>,
): readonly FieldEntry[] {
  return keysOf(group).map((key) => [`${prefix}${key}`, group[key]] as const);
}

function fieldValues(build: Build): ReadonlyMap<string, FieldValue> {
  const { speed, slows, ...selects } = build;

  return new Map([
    ...prefixed("", selects),
    ...prefixed("speed.", speed),
    ...prefixed("slows.", slows),
  ]);
}

function changes(before: Build, after: Build): readonly Change[] {
  const from = fieldValues(before);

  return [...fieldValues(after)].flatMap(([key, value]: FieldEntry): readonly Change[] =>
    from.get(key) === value ? [] : [[key, from.get(key), value]],
  );
}

function parsed(search: string): Build {
  const shareLink = parseShareLink(search);

  if (!shareLink.ok) {
    throw new Error(`the walkthrough link does not parse: ${JSON.stringify(shareLink.error)}`);
  }

  return shareLink.build;
}

/** What `normalize` does to values a player types that the form forbids for this build. */
function typedEdit(build: Build): Build {
  return { ...build, speed: { ...build.speed, burstOfSpeed: 10, frenzy: 5 } };
}

function formStep(build: Build) {
  const { spec } = resolveBuild(build);

  return {
    wereforms: spec.wereforms,
    skills: spec.skills.filter((skill) => skill !== "divider"),
    primaryWeapons: spec.primaryWeapons.length,
    secondaryWeapons: spec.secondaryWeapons,
    tableVariables: spec.tableVariables,
    fields: [...spec.fields],
    hidden: keysOf(fieldRules).filter((field) => !spec.fields.has(field)),
    floors: spec.floors,
    ceilings: spec.ceilings,
    ceilingSources: ceilingRules.flatMap(({ field, max, source }) =>
      spec.ceilings[field] === undefined ? [] : [{ field, max, source }],
    ),
  };
}

function row(breakpoint: BreakpointRow) {
  const { value, frames, hits } = breakpoint;

  return { value, frames, hits, perSecond: perSecond(breakpoint) };
}

function timelineStep(build: Build) {
  const timeline = attackTimeline(build, null, shieldGraphics.start);

  if (timeline.kind === "unavailable") {
    throw new Error(`the walkthrough build plays no animation: ${timeline.reason}`);
  }

  return {
    clip: timeline.clip,
    framesPerSecond: gameFramesPerSecond,
    modes: [...new Set(timeline.ticks.map(({ mode }) => mode))],
    hits: timeline.hits,
    ticks: timeline.ticks.map(({ mode, position, hit }) => ({
      mode,
      position: Math.round(position * 100) / 100,
      hit,
    })),
  };
}

/** The steps a share link goes through, from the URL to the attack animation, with real values. */
export function walkthrough(search: string) {
  const build = parsed(search);
  const typed = typedEdit(build);
  const breakpoints = computeTables(build);
  const position = locate(primaryTable(breakpoints), build.current);
  const values = eiasValues(resolveContext(build), "primary");

  return {
    link: search,
    parse: { from: "defaultBuild", changes: changes(defaultBuild, build), build },
    form: formStep(build),
    normalize: { typed: changes(build, typed), normalized: changes(typed, normalize(typed)) },
    speed: { ...values, iasToEias: { ias: build.current, eias: iasToEias(build.current) } },
    tables: breakpoints.tables.map(({ role, variable, rows }) => ({
      role,
      variable,
      rows: rows.map((breakpoint) => row(breakpoint)),
    })),
    locate:
      position === null
        ? null
        : { now: row(position.now), next: position.next && row(position.next) },
    timeline: timelineStep(build),
  };
}

export async function walkthroughScript(): Promise<string> {
  const steps = walkthrough(walkthroughLink);
  const sprites = await inlinedSprites(steps.timeline.clip, steps.timeline.modes);
  const json = JSON.stringify({ ...steps, sprites }, null, 2);

  return `/** Generated by \`bun run map:walkthrough\` from the engine and public/game/sprites/. Do not edit. */\nwindow.MAP_WALKTHROUGH = ${json};\n`;
}

if (import.meta.main) {
  await Bun.write(walkthroughPath, await walkthroughScript());
  console.log(`${walkthroughPath}: ${walkthroughLink}`);
}

import { cn } from "cn";

import { type ReadySprites, SpriteCanvas, type Sprites } from "@/ui/components/sprite-player";
import {
  attackViewLabels,
  counterText,
  hitGroupText,
  thumbnailText,
} from "@/ui/screens/attack-labels";
import type { HitGroup, PlacedTick } from "@/ui/screens/attack-ticks";

const sceneScale = 2;

interface SceneProps {
  readonly sprites: Sprites;
  readonly placed: PlacedTick;
  /** Hits of the attack. */
  readonly hits: number;
  readonly label: string;
}

/** The animation at ×2, with its game frame counter and a badge on the frame where the hit lands. */
export function Scene({ sprites, placed, hits, label }: SceneProps) {
  const { tick, hit, frame, frames } = placed;

  return (
    <div className="bg-input relative grid min-h-[250px] place-items-center rounded-md border sm:min-w-[200px]">
      {sprites.kind === "missing" && (
        <p className="text-muted-foreground max-w-48 p-3 text-center text-sm">
          {attackViewLabels.missing}
        </p>
      )}
      {sprites.kind === "ready" && (
        <>
          <SpriteCanvas
            sprites={sprites}
            mode={tick.mode}
            position={tick.position}
            scale={sceneScale}
            label={label}
            className="h-auto max-w-full"
          />
          <span
            aria-hidden="true"
            className={cn(
              "bg-primary text-primary-foreground font-display absolute top-1.5 right-1.5 rounded-full px-2 text-[0.65rem] font-bold tracking-[0.08em] uppercase",
              tick.hit === null && "opacity-0",
            )}
          >
            {attackViewLabels.hit}
          </span>
          <span className="text-figure absolute bottom-1.5 left-2 rounded-full bg-black/55 px-2 text-sm tabular-nums">
            {counterText(frame, frames, hit, hits)}
          </span>
        </>
      )}
    </div>
  );
}

interface FilmStripProps {
  readonly sprites: ReadySprites;
  readonly groups: readonly HitGroup[];
  /** The tick the scene shows. */
  readonly index: number;
}

function GroupLabel({ group, hits }: { readonly group: HitGroup; readonly hits: number }) {
  const [first] = group;

  return (
    first !== undefined && (
      <span className="text-muted-foreground text-[0.8125rem]">
        {hitGroupText(first.hit, hits, first.frames)}
      </span>
    )
  );
}

/** One thumbnail per game frame, grouped by hit; the thumbnail where a hit lands is framed. */
export function FilmStrip({ sprites, groups, index }: FilmStripProps) {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-x-4.5 gap-y-3.5">
      {groups.map((group) => (
        <div key={group[0]?.index} className="grid content-start gap-1">
          {groups.length > 1 && <GroupLabel group={group} hits={groups.length} />}
          <div className="flex flex-wrap gap-[3px]">
            {group.map(({ index: at, frame, tick }) => (
              <div key={at} className="grid w-[54px] justify-items-center gap-0.5">
                <SpriteCanvas
                  sprites={sprites}
                  mode={tick.mode}
                  position={tick.position}
                  scale={1}
                  className={cn(
                    "bg-input h-auto w-full rounded border",
                    tick.hit !== null && "border-primary shadow-[0_0_0_1px_var(--primary)]",
                    at === index && "outline-now outline-2 outline-offset-1",
                  )}
                />
                <span
                  className={cn(
                    "text-muted-foreground text-[0.7rem] tabular-nums",
                    tick.hit !== null && "text-primary font-bold",
                  )}
                >
                  {thumbnailText(frame, tick.hit !== null)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

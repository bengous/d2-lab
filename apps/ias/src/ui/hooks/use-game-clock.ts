import { useEffect, useState } from "react";

import { gameFramesPerSecond } from "@/data/rules/animation";
import { useMediaQuery } from "@/ui/hooks/use-media-query";

/** `slow` plays four times slower; `step` waits for `step()`. */
export type Playback = "real" | "slow" | "step";

const slowFactor = 4;

const rates: Readonly<Record<Exclude<Playback, "step">, number>> = {
  real: gameFramesPerSecond.frames,
  slow: gameFramesPerSecond.frames / slowFactor,
};

export interface GameClock {
  /** Game frames since the clock started. */
  readonly tick: number;
  readonly playback: Playback;
  readonly setPlayback: (playback: Playback) => void;
  /** One game frame further, for `step`. */
  readonly step: () => void;
}

/** Counts game frames; it starts slowed, or stopped when the viewer prefers reduced motion. */
export function useGameClock(): GameClock {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [chosen, setPlayback] = useState<Playback | null>(null);
  const [tick, setTick] = useState(0);
  const playback = chosen ?? (reducedMotion ? "step" : "slow");

  useEffect(() => {
    let request = 0;

    if (playback !== "step") {
      const perMs = rates[playback] / 1000;
      let last = performance.now();
      let pending = 0;

      const advance = (now: number): void => {
        pending += (now - last) * perMs;
        last = now;

        const whole = Math.floor(pending);

        if (whole > 0) {
          pending -= whole;
          setTick((previous) => previous + whole);
        }

        request = requestAnimationFrame(advance);
      };

      request = requestAnimationFrame(advance);
    }

    return () => {
      cancelAnimationFrame(request);
    };
  }, [playback]);

  return {
    tick,
    playback,
    setPlayback,
    step: () => {
      setTick((previous) => previous + 1);
    },
  };
}

import { useState, useSyncExternalStore } from "react";

/** `null` when the browser blocks storage (private windows, site settings). */
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readFlag(key: string): boolean | null {
  const stored = storage()?.getItem(key) ?? null;

  return stored === null ? null : stored === "true";
}

/** Another tab of the site changed a flag. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
  };
}

/**
 * A viewer preference kept in `localStorage`, `null` until the viewer sets it. Without storage it
 * lasts for the page only. The prerendered page reads `null`, and hydration then reads the storage.
 */
export function useStoredFlag(key: string): readonly [boolean | null, (value: boolean) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => readFlag(key),
    () => null,
  );

  const [chosen, setChosen] = useState<boolean | null>(null);

  const update = (next: boolean): void => {
    setChosen(next);
    storage()?.setItem(key, String(next));
  };

  return [chosen ?? stored, update];
}

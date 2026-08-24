import type { RoundConfig } from "./types";

export type DailyFocus = {
  label: string;
  note: string;
  config: RoundConfig;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type StoredDailyFocus = {
  dateKey: string;
  focus: DailyFocus;
};

const storagePrefix = "jamb-quest-daily-focus-v1";

function readStoredFocus(storage: StorageLike, key: string): StoredDailyFocus | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDailyFocus>;
    return typeof parsed.dateKey === "string" && parsed.focus && typeof parsed.focus.label === "string" && typeof parsed.focus.note === "string" && parsed.focus.config
      ? parsed as StoredDailyFocus
      : null;
  } catch {
    return null;
  }
}

function browserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/**
 * Keeps one evidence-based priority stable during an unfinished local study day.
 * It is a convenience only: the learner's saved answers remain the source of truth.
 */
export function getPinnedDailyFocus({ learnerKey, dateKey, completed, focus, storage = browserStorage() }: { learnerKey?: string | null; dateKey: string; completed: boolean; focus: DailyFocus; storage?: StorageLike | null }): DailyFocus {
  if (!learnerKey || !storage || completed) return focus;
  const key = `${storagePrefix}:${learnerKey}`;
  const existing = readStoredFocus(storage, key);
  if (existing?.dateKey === dateKey) return existing.focus;

  try {
    storage.setItem(key, JSON.stringify({ dateKey, focus } satisfies StoredDailyFocus));
  } catch {
    // Storage is only a convenience. Study remains available when it is unavailable.
  }
  return focus;
}

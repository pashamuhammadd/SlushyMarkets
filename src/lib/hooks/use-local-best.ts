"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Best game score stored ONLY in this browser (localStorage). No account, no server, no leaderboard.
 * Reads and writes are wrapped in try/catch because storage can be blocked (private mode,
 * strict settings). The game keeps working without it.
 */
export type LocalBest = { score: number; max: number; achievedAt: string };

const PREFIX = "slushymarkets:game:";
const EVENT = "slushymarkets:game-best";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function parseBest(raw: string | null): LocalBest | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LocalBest>;
    if (typeof value.score === "number" && typeof value.max === "number" && typeof value.achievedAt === "string") {
      return { score: value.score, max: value.max, achievedAt: value.achievedAt };
    }
  } catch {
    // ignore malformed data
  }
  return null;
}

/** True when `score` should replace the stored best. */
export function isNewBest(best: LocalBest | null, score: number): boolean {
  return best === null || score > best.score;
}

export function useLocalBest(gameId: string) {
  const raw = useSyncExternalStore(subscribe, () => read(gameId), () => null);
  const best = parseBest(raw);

  /** Saves the score only if it beats the stored best. Returns whether it was saved. */
  const submit = useCallback(
    (score: number, max: number) => {
      if (!isNewBest(parseBest(read(gameId)), score)) return false;
      try {
        window.localStorage.setItem(PREFIX + gameId, JSON.stringify({ score, max, achievedAt: new Date().toISOString() }));
        window.dispatchEvent(new Event(EVENT));
        return true;
      } catch {
        return false;
      }
    },
    [gameId],
  );

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(PREFIX + gameId);
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // nothing to clear
    }
  }, [gameId]);

  return { best, submit, clear };
}

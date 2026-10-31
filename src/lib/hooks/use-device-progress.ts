"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Lesson completion stored ONLY in this browser (localStorage). No account, no server.
 * Reads and writes are wrapped in try/catch because storage can be blocked
 * (private mode, strict settings). The lesson keeps working without it.
 */
export type LessonProgress = { completedAt: string; score: number; total: number };

const PREFIX = "slushymarkets:lesson:";
const EVENT = "slushymarkets:progress";

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

export function parseProgress(raw: string | null): LessonProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LessonProgress>;
    if (typeof value.completedAt === "string" && typeof value.score === "number" && typeof value.total === "number") {
      return { completedAt: value.completedAt, score: value.score, total: value.total };
    }
  } catch {
    // ignore malformed data
  }
  return null;
}

export function useDeviceProgress(lessonId: string) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(lessonId),
    () => null,
  );
  const progress = parseProgress(raw);

  const save = useCallback(
    (value: LessonProgress) => {
      try {
        window.localStorage.setItem(PREFIX + lessonId, JSON.stringify(value));
        window.dispatchEvent(new Event(EVENT));
        return true;
      } catch {
        return false;
      }
    },
    [lessonId],
  );

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(PREFIX + lessonId);
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // nothing to clear
    }
  }, [lessonId]);

  return { progress, save, clear };
}

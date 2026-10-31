"use client";

import { useCallback, useEffect, useState } from "react";

export const PLAYBACK_SPEEDS = [0.5, 1, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

type Options = {
  /** Number of events (trades) in the timeline. */
  total: number;
  /** Where the cursor starts. Defaults to the end so the finished picture is visible first. */
  initialCursor?: number;
  /** Events revealed per second at 1x speed. */
  eventsPerSecond?: number;
};

/**
 * The single simulation clock. `cursor` is the number of trades revealed so far.
 * Every chart derives its view from this one value, so views can never drift apart:
 * pausing freezes all of them and restart resets all of them together.
 */
export function usePlayback({ total, initialCursor = total, eventsPerSecond = 12 }: Options) {
  const [cursor, setCursor] = useState(() => clamp(initialCursor, 0, total));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  /** Playback pauses automatically when the cursor reaches this point. */
  const [stopAt, setStopAt] = useState(total);

  // Reaching the stop point ends playback (state adjustment during render, no extra effect needed).
  if (playing && cursor >= stopAt) {
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () => setCursor((c) => (c >= stopAt ? c : c + 1)),
      1000 / (eventsPerSecond * speed),
    );
    return () => window.clearInterval(id);
  }, [playing, speed, stopAt, eventsPerSecond]);

  // Pause when the tab is hidden so the lesson does not run away in the background.
  useEffect(() => {
    if (!playing) return;
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [playing]);

  /** Play to the end. From the end, starts again from the first trade. */
  const play = useCallback(() => {
    setStopAt(total);
    setCursor((c) => (c >= total ? 0 : c));
    setPlaying(true);
  }, [total]);

  /** Play from `from` (or the current position) and pause at `target`. */
  const playRange = useCallback(
    (target: number, from?: number) => {
      const end = clamp(target, 0, total);
      setStopAt(end);
      setCursor((c) => clamp(from ?? c, 0, end));
      setPlaying(true);
    },
    [total],
  );

  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const seek = useCallback(
    (next: number) => {
      setPlaying(false);
      setCursor(clamp(next, 0, total));
    },
    [total],
  );

  const stepForward = useCallback(() => {
    setPlaying(false);
    setCursor((c) => clamp(c + 1, 0, total));
  }, [total]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setCursor((c) => clamp(c - 1, 0, total));
  }, [total]);

  const restart = useCallback(() => {
    setPlaying(false);
    setCursor(0);
  }, []);

  return { cursor, total, playing, speed, setSpeed, play, playRange, pause, toggle, seek, stepForward, stepBack, restart };
}

export type Playback = ReturnType<typeof usePlayback>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

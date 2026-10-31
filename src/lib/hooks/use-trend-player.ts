"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPianoSynth, type PianoSynth } from "@/lib/audio/piano-synth";
import { notesAt, STEP_COUNT, STEP_SECONDS, TIMEFRAMES, type TimeframeId } from "@/lib/audio/trend-scenario";

export type ListenMode = "all" | TimeframeId;

const LOOKAHEAD_SEC = 0.12;
const TICK_MS = 25;

function enabledFor(mode: ListenMode): Set<TimeframeId> {
  return mode === "all" ? new Set(TIMEFRAMES.map((t) => t.id)) : new Set([mode]);
}

/**
 * Sequencer for Three Trends, One Piano. A look ahead scheduler queues notes on the
 * AudioContext clock (sample accurate) and moves the visual playhead in step with them.
 * Nothing makes a sound until `play` is called from a user action.
 */
export function useTrendPlayer() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setModeState] = useState<ListenMode>("all");
  const [volume, setVolumeState] = useState(0.6);
  const [muted, setMutedState] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const synthRef = useRef<PianoSynth | null>(null);
  const timerRef = useRef<number | null>(null);
  const uiTimeouts = useRef<number[]>([]);
  const nextStepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const modeRef = useRef<ListenMode>("all");

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    uiTimeouts.current.forEach((id) => window.clearTimeout(id));
    uiTimeouts.current = [];
  }, []);

  const halt = useCallback(
    (resetTo?: number) => {
      clearTimers();
      synthRef.current?.stopAll();
      setPlaying(false);
      setActiveNotes([]);
      if (resetTo !== undefined) {
        nextStepRef.current = resetTo;
        setStep(resetTo);
      }
    },
    [clearTimers],
  );

  const play = useCallback(async () => {
    try {
      const synth = synthRef.current ?? getPianoSynth();
      synthRef.current = synth;
      synth.setVolume(volume);
      synth.setMuted(muted);
      await synth.resume();
      setError(null);

      if (nextStepRef.current >= STEP_COUNT) {
        nextStepRef.current = 0;
        setStep(0);
      }
      nextTimeRef.current = synth.ctx.currentTime + 0.06;
      clearTimers();
      setPlaying(true);

      timerRef.current = window.setInterval(() => {
        const ctx = synth.ctx;
        while (nextTimeRef.current < ctx.currentTime + LOOKAHEAD_SEC) {
          const s = nextStepRef.current;
          if (s >= STEP_COUNT) {
            const endDelay = Math.max((nextTimeRef.current - ctx.currentTime) * 1000, 0) + 400;
            clearTimers();
            uiTimeouts.current.push(
              window.setTimeout(() => {
                setPlaying(false);
                setActiveNotes([]);
              }, endDelay),
            );
            return;
          }
          const notes = notesAt(s, enabledFor(modeRef.current));
          for (const note of notes) {
            synth.playNote(note.midi, nextTimeRef.current, note.durationSteps * STEP_SECONDS, 0.7 * note.gain);
          }
          const delay = Math.max((nextTimeRef.current - ctx.currentTime) * 1000, 0);
          const midis = notes.map((n) => n.midi);
          uiTimeouts.current.push(
            window.setTimeout(() => {
              setStep(s);
              if (midis.length) setActiveNotes(midis);
            }, delay),
          );
          nextStepRef.current = s + 1;
          nextTimeRef.current += STEP_SECONDS;
        }
      }, TICK_MS);
    } catch {
      setPlaying(false);
      setError("Sound could not start in this browser. The visual demo still works.");
    }
  }, [clearTimers, muted, volume]);

  const pause = useCallback(() => halt(), [halt]);
  const stop = useCallback(() => halt(0), [halt]);

  const setMode = useCallback((next: ListenMode) => {
    modeRef.current = next;
    setModeState(next);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    synthRef.current?.setVolume(v);
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    synthRef.current?.setMuted(m);
  }, []);

  const seek = useCallback(
    (s: number) => {
      halt(Math.min(Math.max(s, 0), STEP_COUNT - 1));
    },
    [halt],
  );

  // Stop sound when the tab is hidden and when leaving the page.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) halt();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
      synthRef.current?.stopAll();
    };
  }, [halt, clearTimers]);

  return { step, playing, mode, volume, muted, activeNotes, error, play, pause, stop, seek, setMode, setVolume, setMuted };
}

export type TrendPlayer = ReturnType<typeof useTrendPlayer>;

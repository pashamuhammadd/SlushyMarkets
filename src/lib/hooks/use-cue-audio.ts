"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSonarEngine, type SonarEngine } from "@/lib/audio/sonar-engine";
import type { VoiceId } from "@/lib/sonification/voices";

const BUS = "lesson-cues";

/**
 * Short sound cues for lessons (value notes and crossing chimes), built on the shared
 * Web Audio engine. Nothing plays until `enable` or `playNotes` runs from a click.
 * The chimes are the breakout chimes from Slushy's sonar prototypes:
 * up = 880 Hz then 1174.66 Hz, down = 660 Hz then 440 Hz.
 */
export function useCueAudio() {
  const engineRef = useRef<SonarEngine | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensure = useCallback(async () => {
    const engine = engineRef.current ?? getSonarEngine();
    engineRef.current = engine;
    engine.setMuted(false);
    engine.setVolume(0.7);
    await engine.resume();
    engine.setLayerGain(BUS, 0.8);
    return engine;
  }, []);

  const enable = useCallback(async () => {
    try {
      await ensure();
      setEnabled(true);
      setError(null);
      return true;
    } catch {
      setError("Sound could not start in this browser. Everything else still works.");
      return false;
    }
  }, [ensure]);

  const disable = useCallback(() => {
    engineRef.current?.stopAll();
    setEnabled(false);
  }, []);

  /** Plays notes one after another. Works from a click even when cues are switched off. */
  const playNotes = useCallback(
    async (hz: number[], voice: VoiceId = "flute", gapSec = 0.32) => {
      try {
        const engine = await ensure();
        engine.stopAll();
        const start = engine.ctx.currentTime + 0.06;
        hz.forEach((f, i) => engine.playTone(BUS, voice, start + i * gapSec, f, 1, 0.28));
        setError(null);
      } catch {
        setError("Sound could not start in this browser. Everything else still works.");
      }
    },
    [ensure],
  );

  /** Crossing chime. Only sounds while cues are enabled. */
  const chime = useCallback(
    (direction: "up" | "down") => {
      const engine = engineRef.current;
      if (!enabled || !engine) return;
      const start = engine.ctx.currentTime + 0.02;
      const [first, second] = direction === "up" ? [880, 1174.66] : [660, 440];
      engine.playTone(BUS, "chime", start, first, 1, 0.16);
      engine.playTone(BUS, "chime", start + 0.12, second, 1, 0.2);
    },
    [enabled],
  );

  useEffect(() => () => engineRef.current?.stopAll(), []);

  return { enabled, enable, disable, playNotes, chime, error };
}

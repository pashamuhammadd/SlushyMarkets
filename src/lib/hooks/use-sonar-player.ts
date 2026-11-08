"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSonarEngine, type SonarEngine } from "@/lib/audio/sonar-engine";
import { buildMarket, VISIBLE_BARS, type TimeframeId } from "@/lib/sonification/market";
import { audibleGain, BAR_SECONDS, hasSolo, notesForBar } from "@/lib/sonification/mixer";
import { resolveOptions, type LayerSettings, type ModeOptions, type Preset, type SonificationMode } from "@/lib/sonification/types";

const LOOKAHEAD_SEC = 0.15;
const TICK_MS = 25;

export type PlayerStatus = "idle" | "playing" | "paused" | "finished";

function clonePreset(preset: Preset): Record<string, LayerSettings> {
  return Object.fromEntries(Object.entries(preset.layers).map(([id, s]) => [id, { ...s }]));
}

/**
 * Sequencer for the Sound Playground. A look ahead scheduler queues each bar's notes on the
 * AudioContext clock and moves the chart cursor in step with them, so sound and picture stay
 * together. Mute, solo and volume act instantly through layer buses; instrument, pulse
 * speed and mode toggle changes apply from the next bar. Changing the chart or timeframe stops playback and
 * rewinds, so audio never plays one chart while another is drawn. No sound before Play.
 */
export function useSonarPlayer<A>(mode: SonificationMode<A>, initialSeed: number) {
  const [seed, setSeed] = useState(initialSeed);
  const [timeframe, setTimeframeState] = useState<TimeframeId>("15m");
  const [presetId, setPresetId] = useState(mode.presets[0].id);
  const [layers, setLayers] = useState<Record<string, LayerSettings>>(() => clonePreset(mode.presets[0]));
  const [options, setOptions] = useState<ModeOptions>(() => resolveOptions(mode.toggles, mode.presets[0]));
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [volume, setVolumeState] = useState(0.7);
  const [muted, setMutedState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysis = useMemo(() => mode.analyze(buildMarket(seed, timeframe)), [mode, seed, timeframe]);

  const engineRef = useRef<SonarEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const uiTimeouts = useRef<number[]>([]);
  const nextBarRef = useRef(0);
  const nextTimeRef = useRef(0);
  const layersRef = useRef(layers);
  const optionsRef = useRef(options);
  const analysisRef = useRef(analysis);

  useEffect(() => {
    analysisRef.current = analysis;
  }, [analysis]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const syncGains = useCallback((next: Record<string, LayerSettings>) => {
    const engine = engineRef.current;
    if (!engine) return;
    const solo = hasSolo(next);
    for (const [id, layer] of Object.entries(next)) engine.setLayerGain(id, audibleGain(layer, solo));
  }, []);

  useEffect(() => {
    layersRef.current = layers;
    syncGains(layers);
  }, [layers, syncGains]);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    uiTimeouts.current.forEach((id) => window.clearTimeout(id));
    uiTimeouts.current = [];
  }, []);

  const halt = useCallback(
    (next: PlayerStatus, rewind: boolean) => {
      clearTimers();
      engineRef.current?.stopAll();
      setStatus(next);
      if (rewind) {
        nextBarRef.current = 0;
        setCursor(0);
      }
    },
    [clearTimers],
  );

  // Never leave sound running after leaving the page.
  useEffect(() => () => {
    clearTimers();
    engineRef.current?.stopAll();
  }, [clearTimers]);

  const start = useCallback(
    async (fromBar: number) => {
      try {
        const engine = engineRef.current ?? getSonarEngine();
        engineRef.current = engine;
        engine.setVolume(volume);
        engine.setMuted(muted);
        await engine.resume();
        syncGains(layersRef.current);
        setError(null);
        clearTimers();

        nextBarRef.current = fromBar;
        setCursor(fromBar);
        nextTimeRef.current = engine.ctx.currentTime + 0.08;
        setStatus("playing");

        timerRef.current = window.setInterval(() => {
          const ctx = engine.ctx;
          while (nextTimeRef.current < ctx.currentTime + LOOKAHEAD_SEC) {
            const bar = nextBarRef.current;
            if (bar >= VISIBLE_BARS) {
              const endDelay = Math.max((nextTimeRef.current - ctx.currentTime) * 1000, 0) + 300;
              clearTimers();
              uiTimeouts.current.push(window.setTimeout(() => setStatus("finished"), endDelay));
              return;
            }
            const when = nextTimeRef.current;
            for (const layer of mode.layers) {
              const settings = layersRef.current[layer.id];
              if (!settings) continue;
              const events = mode.events(layer.id, bar, analysisRef.current, optionsRef.current);
              const notes = notesForBar(layer, settings, events, bar);
              for (const note of notes) {
                engine.playTone(layer.id, settings.voice, when + note.offsetSec, note.hz, note.amp, note.durationSec);
              }
            }
            const delay = Math.max((when - ctx.currentTime) * 1000, 0);
            uiTimeouts.current.push(window.setTimeout(() => setCursor(bar), delay));
            nextBarRef.current = bar + 1;
            nextTimeRef.current += BAR_SECONDS;
          }
        }, TICK_MS);
      } catch {
        setStatus("idle");
        setError("Sound could not start in this browser. The chart and the readout still work.");
      }
    },
    [clearTimers, mode, muted, syncGains, volume],
  );

  const play = useCallback(() => {
    // Resume from the bar under the cursor, or start over when the piece has finished.
    const from = status === "finished" || nextBarRef.current >= VISIBLE_BARS ? 0 : status === "paused" ? cursor : 0;
    void start(from);
  }, [cursor, start, status]);

  const pause = useCallback(() => halt("paused", false), [halt]);
  const stop = useCallback(() => halt("idle", true), [halt]);
  const replay = useCallback(() => void start(0), [start]);

  const newChart = useCallback(() => {
    halt("idle", true);
    setSeed((s) => s + 1);
  }, [halt]);

  const setTimeframe = useCallback(
    (next: TimeframeId) => {
      halt("idle", true);
      setTimeframeState(next);
    },
    [halt],
  );

  const applyPreset = useCallback(
    (id: string) => {
      const preset = mode.presets.find((p) => p.id === id);
      if (!preset) return;
      setPresetId(id);
      setLayers(clonePreset(preset));
      setOptions(resolveOptions(mode.toggles, preset));
    },
    [mode],
  );

  const resetToPreset = useCallback(() => applyPreset(presetId), [applyPreset, presetId]);

  const setOption = useCallback((id: string, value: boolean) => {
    setOptions((prev) => ({ ...prev, [id]: value }));
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<LayerSettings>) => {
    setLayers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  /** Three short notes of one layer's instrument, outside the piece. Stops the piece first. */
  const previewLayer = useCallback(
    async (id: string) => {
      const hz = mode.layers.find((l) => l.id === id)?.previewHz ?? 440;
      try {
        halt(status === "playing" ? "paused" : status, false);
        const engine = engineRef.current ?? getSonarEngine();
        engineRef.current = engine;
        engine.setVolume(volume);
        engine.setMuted(muted);
        await engine.resume();
        const previewBus = `preview-${id}`;
        engine.setLayerGain(previewBus, layersRef.current[id]?.gain ?? 0.7);
        const voice = layersRef.current[id]?.voice ?? "organ";
        for (let j = 0; j < 3; j += 1) engine.playTone(previewBus, voice, engine.ctx.currentTime + 0.05 + j * 0.25, hz, 1, 0.2);
        setError(null);
      } catch {
        setError("Sound could not start in this browser.");
      }
    },
    [halt, mode, muted, status, volume],
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    engineRef.current?.setVolume(v);
  }, []);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    engineRef.current?.setMuted(m);
  }, []);

  return {
    analysis,
    seed,
    timeframe,
    presetId,
    layers,
    options,
    cursor,
    status,
    volume,
    muted,
    error,
    play,
    pause,
    stop,
    replay,
    newChart,
    setTimeframe,
    applyPreset,
    resetToPreset,
    updateLayer,
    setOption,
    previewLayer,
    setVolume,
    setMuted,
  };
}

"use client";

import { useId } from "react";
import { Pause, Play, Square, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { SCENARIO, STEP_COUNT, STEP_SECONDS } from "@/lib/audio/trend-scenario";
import { useTrendPlayer, type ListenMode } from "@/lib/hooks/use-trend-player";
import { PianoKeyboard } from "./PianoKeyboard";
import { TrendSparkline } from "./TrendSparkline";
import { STATE_UI } from "./trend-state-ui";

const MODES: { value: ListenMode; label: string }[] = [
  { value: "all", label: "All three" },
  { value: "daily", label: "Daily only" },
  { value: "4h", label: "4H only" },
  { value: "15m", label: "15m only" },
];

/** Interactive Three Trends, One Piano prototype. Audio starts only on Play. */
export function TrendPiano() {
  const player = useTrendPlayer();
  const { step, playing, mode, volume, muted, activeNotes, error } = player;
  const volumeId = useId();
  const seconds = (STEP_COUNT * STEP_SECONDS).toFixed(0);

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 md:grid-cols-3">
        {SCENARIO.map((series) => {
          const tf = series.timeframe;
          const state = series.states[Math.min(step, STEP_COUNT - 1)];
          const ui = STATE_UI[state];
          const Icon = ui.icon;
          const audible = mode === "all" || mode === tf.id;
          return (
            <li
              key={tf.id}
              className={cn(
                "rounded-2xl bg-navy-950/55 p-4 ring-1 transition",
                audible ? "ring-white/10" : "opacity-45 ring-white/5",
              )}
              style={audible && playing ? { boxShadow: `0 0 0 1px ${tf.color}55` } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-sans text-sm font-semibold text-ink">{tf.label}</h3>
                <span className="text-xs text-muted">{tf.register}</span>
              </div>
              <TrendSparkline series={series} step={step} className="mt-3 h-20 w-full" />
              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge tone={ui.tone}>
                  <Icon aria-hidden="true" className="size-3.5" />
                  {ui.text}
                </Badge>
                <span className="text-xs text-subtle">{audible ? "In the mix" : "Muted"}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl bg-navy-950/45 p-3 ring-1 ring-white/10 sm:p-4">
        <PianoKeyboard activeNotes={playing ? activeNotes : []} />
        <div className="mt-1 flex justify-between text-[11px] text-subtle">
          <span>Low: Daily</span>
          <span>Middle: 4H</span>
          <span>High: 15m</span>
        </div>
      </div>

      <div className="rounded-2xl bg-navy-900/80 p-3 ring-1 ring-white/10 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={playing ? player.pause : player.play}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-magenta to-violet px-5 text-sm font-semibold text-white shadow-glow-violet transition hover:brightness-110"
          >
            {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
            {playing ? "Pause" : step > 0 && step < STEP_COUNT - 1 ? "Resume" : "Play"}
          </button>
          <button
            type="button"
            onClick={player.stop}
            disabled={!playing && step === 0}
            aria-label="Stop and rewind"
            className="grid size-11 place-items-center rounded-full text-ink ring-1 ring-white/10 transition hover:bg-white/5 disabled:opacity-40"
          >
            <Square aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => player.setMuted(!muted)}
            aria-pressed={muted}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid size-11 place-items-center rounded-full text-ink ring-1 ring-white/10 transition hover:bg-white/5"
          >
            {muted ? <VolumeX aria-hidden="true" className="size-4 text-danger" /> : <Volume2 aria-hidden="true" className="size-4" />}
          </button>
          <div className="flex min-w-36 flex-1 items-center gap-2 sm:max-w-56">
            <label htmlFor={volumeId} className="text-xs text-muted">
              Volume
            </label>
            <input
              id={volumeId}
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => player.setVolume(Number(e.target.value) / 100)}
              className="h-2 w-full cursor-pointer accent-magenta"
            />
          </div>
          <span className="ml-auto text-xs tabular-nums text-muted">
            Step {Math.min(step + 1, STEP_COUNT)} / {STEP_COUNT} · about {seconds}s
          </span>
        </div>

        <div role="group" aria-label="What to listen to" className="mt-3 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mode === m.value}
              onClick={() => player.setMode(m.value)}
              className={cn(
                "h-9 rounded-full px-3.5 text-xs font-semibold ring-1 transition",
                mode === m.value ? "bg-magenta/15 text-ink ring-magenta/50" : "text-muted ring-white/10 hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

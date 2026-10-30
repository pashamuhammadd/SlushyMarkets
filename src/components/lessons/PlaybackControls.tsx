"use client";

import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { PLAYBACK_SPEEDS, type Playback } from "@/lib/hooks/use-playback";

const iconButton =
  "grid size-11 place-items-center rounded-full text-ink ring-1 ring-white/10 transition hover:bg-white/5 hover:ring-cyan/50 disabled:opacity-40 disabled:hover:bg-transparent";

/** Reusable controls for any lesson driven by `usePlayback`. */
export function PlaybackControls({ playback, eventLabel = "Trade" }: { playback: Playback; eventLabel?: string }) {
  const { cursor, total, playing, speed, setSpeed, toggle, stepBack, stepForward, restart, seek } = playback;
  const scrubId = useId();
  const atEnd = cursor >= total;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-5 text-sm font-semibold text-navy-950 shadow-glow-cyan transition hover:brightness-110"
        >
          {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          {playing ? "Pause" : atEnd ? "Replay" : cursor === 0 ? "Play" : "Resume"}
        </button>
        <button type="button" onClick={stepBack} disabled={cursor === 0} className={iconButton} aria-label={`Step back one ${eventLabel.toLowerCase()}`}>
          <StepBack aria-hidden="true" className="size-4" />
        </button>
        <button type="button" onClick={stepForward} disabled={atEnd} className={iconButton} aria-label={`Step forward one ${eventLabel.toLowerCase()}`}>
          <StepForward aria-hidden="true" className="size-4" />
        </button>
        <button type="button" onClick={restart} disabled={cursor === 0 && !playing} className={iconButton} aria-label="Restart from the first trade">
          <RotateCcw aria-hidden="true" className="size-4" />
        </button>

        <div role="group" aria-label="Playback speed" className="ml-auto flex rounded-full bg-navy-950/60 p-1 ring-1 ring-white/10">
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={cn(
                "h-9 min-w-11 rounded-full px-2.5 text-xs font-semibold transition",
                speed === s ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40" : "text-muted hover:text-ink",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={scrubId} className="sr-only">
          Timeline position
        </label>
        <input
          id={scrubId}
          type="range"
          min={0}
          max={total}
          step={1}
          value={cursor}
          onChange={(e) => seek(Number(e.target.value))}
          aria-valuetext={`${eventLabel} ${cursor} of ${total}`}
          className="h-2 w-full cursor-pointer accent-cyan"
        />
        <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted">
          {eventLabel} {cursor} / {total}
        </span>
      </div>
    </div>
  );
}

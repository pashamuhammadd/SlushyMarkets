"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bell, BellOff } from "lucide-react";
import { COLORS } from "@/components/lessons/chart-geometry";
import { PlaybackControls } from "@/components/lessons/PlaybackControls";
import { Badge } from "@/components/ui/Badge";
import { SOPR_TIMELINE_SEED } from "@/data/lessons/on-chain-metrics";
import { useCueAudio } from "@/lib/hooks/use-cue-audio";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { usePlayback } from "@/lib/hooks/use-playback";
import { crossings, soprZone, syntheticSoprSeries } from "@/lib/onchain/metrics";

const HEIGHT = 240;
const PAD = { top: 14, right: 12, bottom: 26, left: 44 };

/**
 * Invented daily SOPR values revealed day by day. The 1.0 line splits "spent above
 * created value" from "spent below". With cues on, a chime marks each cross of 1.0.
 */
export function SoprTimeline() {
  const series = useMemo(() => syntheticSoprSeries(SOPR_TIMELINE_SEED), []);
  const crossMap = useMemo(() => new Map(crossings(series).map((c) => [c.index, c.direction])), [series]);
  const playback = usePlayback({ total: series.length, initialCursor: 0, eventsPerSecond: 4 });
  const cues = useCueAudio();
  const [ref, width] = useElementWidth<HTMLDivElement>(720);
  const prevCursor = useRef(playback.cursor);
  const { chime } = cues;

  // Chime only when moving forward onto a day that crossed 1.0.
  useEffect(() => {
    const prev = prevCursor.current;
    prevCursor.current = playback.cursor;
    if (playback.cursor !== prev + 1) return;
    const direction = crossMap.get(playback.cursor - 1);
    if (direction) chime(direction);
  }, [playback.cursor, crossMap, chime]);

  const lo = Math.min(0.9, ...series) - 0.01;
  const hi = Math.max(1.1, ...series) + 0.01;
  const plotW = Math.max(width - PAD.left - PAD.right, 40);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (series.length - 1)) * plotW;
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo)) * plotH;
  const shown = series.slice(0, Math.max(playback.cursor, 1));
  const path = shown.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const current = playback.cursor > 0 ? series[playback.cursor - 1] : null;
  const zone = current === null ? null : soprZone(current);
  const crossedSoFar = [...crossMap.keys()].filter((i) => i < playback.cursor).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-navy-950/55 p-2 ring-1 ring-white/10">
        <div ref={ref} className="w-full">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`Invented daily SOPR line, ${playback.cursor} of ${series.length} days shown. The dashed line marks 1.0.`}
          className="block"
        >
          <rect x={PAD.left} y={PAD.top} width={plotW} height={y(1) - PAD.top} fill="rgb(68 217 164 / 0.06)" />
          <rect x={PAD.left} y={y(1)} width={plotW} height={PAD.top + plotH - y(1)} fill="rgb(255 117 138 / 0.06)" />
          {[lo + 0.01, 1, hi - 0.01].map((t) => (
            <text key={t} x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={COLORS.label}>
              {t.toFixed(2)}
            </text>
          ))}
          <line x1={PAD.left} x2={PAD.left + plotW} y1={y(1)} y2={y(1)} stroke={COLORS.text} strokeOpacity={0.6} strokeDasharray="5 5" />
          <text x={PAD.left + 6} y={y(1) - 6} fontSize="11" fill={COLORS.text} opacity={0.75}>
            1.0 break even
          </text>
          {path ? <path d={path} fill="none" stroke={COLORS.cyan} strokeWidth={2.25} strokeLinejoin="round" /> : null}
          {[...crossMap.entries()]
            .filter(([i]) => i < playback.cursor)
            .map(([i, dir]) => (
              <circle key={i} cx={x(i)} cy={y(1)} r={4.5} fill={dir === "up" ? COLORS.up : COLORS.down} stroke={COLORS.text} strokeWidth={1} />
            ))}
          <text x={PAD.left} y={HEIGHT - 6} fontSize="11" fill={COLORS.label}>
            Day 1 to day {series.length} · invented values
          </text>
        </svg>
        </div>
      </div>

      <PlaybackControls playback={playback} eventLabel="Day" />

      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <button
          type="button"
          aria-pressed={cues.enabled}
          onClick={() => (cues.enabled ? cues.disable() : void cues.enable())}
          className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
        >
          {cues.enabled ? <Bell aria-hidden="true" className="size-4 text-gold" /> : <BellOff aria-hidden="true" className="size-4" />}
          Crossing chimes: {cues.enabled ? "On" : "Off"}
        </button>
        {current !== null && zone ? (
          <Badge tone={zone === "profit" ? "success" : zone === "loss" ? "danger" : "neutral"}>
            Day {playback.cursor}: SOPR {current.toFixed(3)}
          </Badge>
        ) : (
          <span className="text-sm text-muted">Press Play to draw the line day by day.</span>
        )}
        <span className="text-sm text-subtle">Crosses of 1.0 so far: {crossedSoFar}</span>
      </div>
      {cues.error ? (
        <p role="alert" className="text-sm text-danger">
          {cues.error}
        </p>
      ) : null}
    </div>
  );
}

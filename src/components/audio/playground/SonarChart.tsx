"use client";

import { COLORS } from "@/components/lessons/chart-geometry";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import type { ChartModel } from "@/lib/sonification/types";

type SonarChartProps = {
  model: ChartModel;
  /** Last bar drawn while a piece is playing or paused. `null` shows the whole chart. */
  revealTo: number | null;
  cursor: number | null;
  timeframeLabel: string;
};

const HEIGHT = 300;
const PAD = { top: 16, right: 12, bottom: 28, left: 46 };

const MARKER_COLORS = { up: "#44D9A4", down: "#FF6B8B", return: "#B79BFF" } as const;

/**
 * Candles plus the lines of the current mode, drawn from the same analysis the sound is built
 * from. While playing, candles, lines and markers appear bar by bar under the cursor.
 */
export function SonarChart({ model, revealTo, cursor, timeframeLabel }: SonarChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>(720);
  const { bars, lines, markers } = model;
  const last = revealTo === null ? bars.length - 1 : revealTo;

  const values = bars.flatMap((b) => [b.high, b.low]).concat(lines.flatMap((l) => l.values));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lo = min - span * 0.05;
  const hi = max + span * 0.05;

  const plotW = Math.max(width - PAD.left - PAD.right, 40);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const step = plotW / bars.length;
  const x = (i: number) => PAD.left + (i + 0.5) * step;
  const y = (p: number) => PAD.top + ((hi - p) / (hi - lo)) * plotH;
  const bodyW = Math.max(Math.min(step * 0.6, 9), 1.5);
  const ticks = [0, 0.5, 1].map((t) => lo + (hi - lo) * t);

  const linePath = (series: number[]) =>
    series
      .slice(0, last + 1)
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");

  return (
    <div ref={ref} className="w-full">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`${model.description} ${timeframeLabel} bars. ${
          revealTo === null ? `All ${bars.length} bars shown.` : `Showing bar ${last + 1} of ${bars.length}.`
        }`}
        className="block"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.07)" />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={COLORS.label}>
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 8} fontSize="11" fill={COLORS.label}>
          Simulated price units · {timeframeLabel} bars
        </text>

        {bars.map((b, i) => {
          if (i > last) return null;
          const up = b.close >= b.open;
          const color = up ? COLORS.up : COLORS.down;
          const top = y(Math.max(b.open, b.close));
          const bodyH = Math.max(Math.abs(y(b.open) - y(b.close)), 1);
          return (
            <g key={i} opacity={0.6}>
              <line x1={x(i)} x2={x(i)} y1={y(b.high)} y2={y(b.low)} stroke={color} strokeWidth={1} />
              <rect x={x(i) - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={color} rx={1} />
            </g>
          );
        })}

        {lines.map((l) => (
          <path
            key={l.id}
            d={linePath(l.values)}
            fill="none"
            stroke={l.color}
            strokeWidth={l.dashed ? 1.5 : 2.25}
            strokeDasharray={l.dashed ? "6 5" : undefined}
            strokeLinejoin="round"
          />
        ))}

        {markers
          .filter((m) => m.index <= last)
          .map((m) =>
            m.kind === "return" ? (
              <rect
                key={`r${m.index}`}
                x={x(m.index) - 4}
                y={y(m.price) - 4}
                width={8}
                height={8}
                fill={MARKER_COLORS.return}
                stroke="#0B1020"
                strokeWidth={1}
              />
            ) : (
              <circle
                key={`b${m.index}`}
                cx={x(m.index)}
                cy={y(m.price)}
                r={5.5}
                fill="none"
                stroke={MARKER_COLORS[m.kind]}
                strokeWidth={2.25}
              />
            ),
          )}

        {cursor !== null ? (
          <line x1={x(cursor)} x2={x(cursor)} y1={PAD.top} y2={PAD.top + plotH} stroke="#E3CBFF" strokeWidth={1.5} />
        ) : null}
      </svg>
    </div>
  );
}

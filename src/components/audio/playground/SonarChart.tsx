"use client";

import { COLORS } from "@/components/lessons/chart-geometry";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { EMA_SONAR_LAYERS, type EmaSonarAnalysis } from "@/lib/sonification/modes/ema-sonar";

type SonarChartProps = {
  analysis: EmaSonarAnalysis;
  /** Last bar drawn while a piece is playing or paused. `null` shows the whole chart. */
  revealTo: number | null;
  cursor: number | null;
  timeframeLabel: string;
};

const HEIGHT = 300;
const PAD = { top: 16, right: 12, bottom: 28, left: 46 };

/**
 * Candles plus the three EMA lines, drawn from the same analysis the sound is built from.
 * While playing, candles appear bar by bar under the cursor, like in Slushy's prototype.
 */
export function SonarChart({ analysis, revealTo, cursor, timeframeLabel }: SonarChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>(720);
  const { bars, emas } = analysis;
  const last = revealTo === null ? bars.length - 1 : revealTo;

  const values = bars.flatMap((b, i) => [b.high, b.low, ...EMA_SONAR_LAYERS.map((l) => emas[l.id][i])]);
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
        aria-label={`Simulated ${timeframeLabel} candles with the 7 EMA in violet, the 20 EMA in pink and the 50 EMA in mint. ${
          revealTo === null ? "All 60 bars shown." : `Showing bar ${last + 1} of 60.`
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

        {EMA_SONAR_LAYERS.map((l) => (
          <path key={l.id} d={linePath(emas[l.id])} fill="none" stroke={l.color} strokeWidth={2.25} strokeLinejoin="round" />
        ))}

        {cursor !== null ? (
          <line x1={x(cursor)} x2={x(cursor)} y1={PAD.top} y2={PAD.top + plotH} stroke="#E3CBFF" strokeWidth={1.5} />
        ) : null}
      </svg>
    </div>
  );
}

import { formatClock, formatPrice } from "@/lib/format";
import type { Candle } from "@/lib/simulations/types";
import { chartGeometry, COLORS, priceTicks, priceToY, type PriceRange } from "./chart-geometry";

type CandleChartProps = {
  width: number;
  height?: number;
  candles: Candle[];
  slotCount: number;
  originMs: number;
  candleMs: number;
  range: PriceRange;
  /** Largest candle volume in the full series, so volume bars grow instead of rescaling. */
  volumeMax: number;
  lastPrice: number | null;
  /** True while the latest candle is still collecting trades. */
  forming: boolean;
  label: string;
};

const RIGHT_AXIS = 58;

export function CandleChart({
  width,
  height,
  candles,
  slotCount,
  originMs,
  candleMs,
  range,
  volumeMax,
  lastPrice,
  forming,
  label,
}: CandleChartProps) {
  const g = chartGeometry(height);
  const plotLeft = 6;
  const plotRight = Math.max(width - RIGHT_AXIS, plotLeft + 50);
  const slotWidth = (plotRight - plotLeft) / slotCount;
  const bodyWidth = Math.max(Math.min(slotWidth * 0.58, 26), 3);
  const y = (p: number) => priceToY(p, range, g.top, g.priceBottom);
  const volumeScale = (v: number) => (volumeMax > 0 ? (v / volumeMax) * (g.volumeBottom - g.volumeTop) : 0);
  const labelEvery = slotWidth < 34 ? 4 : slotWidth < 52 ? 2 : 1;
  const lastIndex = candles.length ? candles[candles.length - 1].index : -1;

  return (
    <svg width={width} height={g.height} viewBox={`0 0 ${width} ${g.height}`} role="img" aria-label={label} className="block">
      {/* price grid */}
      {priceTicks(range).map((p) => (
        <g key={p}>
          <line x1={plotLeft} x2={plotRight} y1={y(p)} y2={y(p)} stroke={COLORS.grid} />
          <text x={plotRight + 8} y={y(p) + 4} fontSize={11} fill={COLORS.label} fontFamily="var(--font-geist)">
            {formatPrice(p)}
          </text>
        </g>
      ))}
      <line x1={plotLeft} x2={plotRight} y1={g.volumeBottom} y2={g.volumeBottom} stroke={COLORS.grid} />

      {/* time labels */}
      {Array.from({ length: slotCount }, (_, i) =>
        i % labelEvery === 0 ? (
          <text
            key={i}
            x={plotLeft + slotWidth * (i + 0.5)}
            y={g.axisY}
            fontSize={10.5}
            textAnchor="middle"
            fill={COLORS.label}
            fontFamily="var(--font-geist)"
          >
            {formatClock(originMs + i * candleMs)}
          </text>
        ) : null,
      )}

      {candles.map((c) => {
        const cx = plotLeft + slotWidth * (c.index + 0.5);
        const up = c.close >= c.open;
        const color = up ? COLORS.up : COLORS.down;
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyHeight = Math.max(Math.abs(y(c.open) - y(c.close)), 1.5);
        const isForming = forming && c.index === lastIndex;
        const vh = volumeScale(c.volumeBtc);
        return (
          <g key={c.index}>
            {isForming ? (
              <rect
                x={plotLeft + slotWidth * c.index + 1}
                y={g.top}
                width={slotWidth - 2}
                height={g.volumeBottom - g.top}
                rx={6}
                fill="rgba(55, 213, 250, 0.07)"
                stroke="rgba(55, 213, 250, 0.35)"
                strokeDasharray="3 4"
              />
            ) : null}
            <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1.5} />
            <rect
              x={cx - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              rx={2}
              fill={color}
              fillOpacity={up ? 0.9 : 0.85}
            />
            <rect
              x={cx - bodyWidth / 2}
              y={g.volumeBottom - vh}
              width={bodyWidth}
              height={vh}
              rx={2}
              fill={color}
              fillOpacity={0.45}
            />
          </g>
        );
      })}

      {/* last traded price */}
      {lastPrice !== null ? (
        <g>
          <line
            x1={plotLeft}
            x2={plotRight}
            y1={y(lastPrice)}
            y2={y(lastPrice)}
            stroke={COLORS.cyan}
            strokeOpacity={0.6}
            strokeDasharray="4 4"
          />
          <rect x={plotRight + 2} y={y(lastPrice) - 10} width={RIGHT_AXIS - 4} height={20} rx={6} fill={COLORS.cyan} />
          <text
            x={plotRight + RIGHT_AXIS / 2}
            y={y(lastPrice) + 4}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            fill="#050C1B"
            fontFamily="var(--font-geist)"
          >
            {formatPrice(lastPrice)}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

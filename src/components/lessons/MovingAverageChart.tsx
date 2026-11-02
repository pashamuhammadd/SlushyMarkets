import { formatClock, formatPrice } from "@/lib/format";
import type { Series } from "@/lib/simulations/moving-averages";
import type { Candle } from "@/lib/simulations/types";
import { COLORS, priceTicks, priceToY, type PriceRange } from "./chart-geometry";

/** Line styles shared with the legend so color is never the only cue. */
export const MA_STYLES = {
  sma: { color: COLORS.gold, dash: "7 5", label: "SMA" },
  ema: { color: COLORS.magenta, dash: undefined, label: "EMA" },
} as const;

type MovingAverageChartProps = {
  width: number;
  height?: number;
  /** Candles revealed so far. */
  candles: readonly Candle[];
  slotCount: number;
  originMs: number;
  candleMs: number;
  range: PriceRange;
  /** Full series, one value per candle. Only the revealed part is drawn. */
  smaSeries: Series;
  emaSeries: Series;
  showSma: boolean;
  showEma: boolean;
  /** Candle index of the price peak, drawn when turn markers are on. */
  peakIndex?: number;
  turns?: { sma: number | null; ema: number | null };
  /** First candle of the shaded sideways range. */
  rangeStart?: number;
  label: string;
};

const RIGHT_AXIS = 58;
const TOP = 22;
const AXIS = 26;

export function MovingAverageChart({
  width,
  height = 300,
  candles,
  slotCount,
  originMs,
  candleMs,
  range,
  smaSeries,
  emaSeries,
  showSma,
  showEma,
  peakIndex,
  turns,
  rangeStart,
  label,
}: MovingAverageChartProps) {
  const plotLeft = 6;
  const plotRight = Math.max(width - RIGHT_AXIS, plotLeft + 50);
  const bottom = height - AXIS;
  const slotWidth = (plotRight - plotLeft) / slotCount;
  const bodyWidth = Math.max(Math.min(slotWidth * 0.6, 14), 2);
  const x = (index: number) => plotLeft + slotWidth * (index + 0.5);
  const y = (price: number) => priceToY(price, range, TOP, bottom);
  const revealed = candles.length;
  const labelEvery = slotWidth < 9 ? 12 : slotWidth < 16 ? 6 : 4;

  function linePath(series: Series) {
    let d = "";
    let pen = false;
    for (let i = 0; i < revealed; i += 1) {
      const v = series[i];
      if (v === null || v === undefined) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  }

  const showRange = rangeStart !== undefined && revealed > rangeStart;
  const showPeak = peakIndex !== undefined && revealed > peakIndex;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block">
      {showRange ? (
        <g>
          <rect
            x={plotLeft + slotWidth * rangeStart}
            y={TOP - 14}
            width={slotWidth * (Math.min(revealed, slotCount) - rangeStart)}
            height={bottom - TOP + 14}
            rx={8}
            fill="rgba(139, 92, 246, 0.09)"
            stroke="rgba(139, 92, 246, 0.35)"
            strokeDasharray="3 4"
          />
          <text x={plotLeft + slotWidth * rangeStart + 8} y={TOP - 2} fontSize={10.5} fill={COLORS.violet} fontFamily="var(--font-geist)">
            Sideways range
          </text>
        </g>
      ) : null}

      {priceTicks(range, 250).map((p) => (
        <g key={p}>
          <line x1={plotLeft} x2={plotRight} y1={y(p)} y2={y(p)} stroke={COLORS.grid} />
          <text x={plotRight + 8} y={y(p) + 4} fontSize={11} fill={COLORS.label} fontFamily="var(--font-geist)">
            {formatPrice(p)}
          </text>
        </g>
      ))}

      {Array.from({ length: slotCount }, (_, i) =>
        i % labelEvery === 0 ? (
          <text
            key={i}
            x={i === 0 ? plotLeft : x(i)}
            y={height - 8}
            fontSize={10.5}
            textAnchor={i === 0 ? "start" : "middle"}
            fill={COLORS.label}
            fontFamily="var(--font-geist)"
          >
            {formatClock(originMs + i * candleMs)}
          </text>
        ) : null,
      )}

      {showPeak ? (
        <g>
          <line x1={x(peakIndex)} x2={x(peakIndex)} y1={TOP - 4} y2={bottom} stroke={COLORS.cyan} strokeOpacity={0.45} strokeDasharray="2 4" />
          <text x={x(peakIndex)} y={TOP - 10} fontSize={10.5} textAnchor="middle" fill={COLORS.cyan} fontFamily="var(--font-geist)">
            Peak
          </text>
        </g>
      ) : null}

      {candles.map((c) => {
        const up = c.close >= c.open;
        const color = up ? COLORS.up : COLORS.down;
        return (
          <g key={c.index} opacity={showSma || showEma ? 0.7 : 1}>
            <line x1={x(c.index)} x2={x(c.index)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1.2} />
            <rect
              x={x(c.index) - bodyWidth / 2}
              y={y(Math.max(c.open, c.close))}
              width={bodyWidth}
              height={Math.max(Math.abs(y(c.open) - y(c.close)), 1.5)}
              rx={1.5}
              fill={color}
            />
          </g>
        );
      })}

      {showSma ? (
        <path d={linePath(smaSeries)} fill="none" stroke={MA_STYLES.sma.color} strokeWidth={2.4} strokeDasharray={MA_STYLES.sma.dash} strokeLinejoin="round" />
      ) : null}
      {showEma ? (
        <path d={linePath(emaSeries)} fill="none" stroke={MA_STYLES.ema.color} strokeWidth={2.4} strokeLinejoin="round" />
      ) : null}

      {turns
        ? (["sma", "ema"] as const).map((key) => {
            const index = turns[key];
            const series = key === "sma" ? smaSeries : emaSeries;
            const visible = key === "sma" ? showSma : showEma;
            const value = index !== null ? series[index] : null;
            if (!visible || index === null || index >= revealed || value === null || value === undefined) return null;
            return (
              <circle
                key={key}
                cx={x(index)}
                cy={y(value)}
                r={5.5}
                fill="#050C1B"
                stroke={MA_STYLES[key].color}
                strokeWidth={2.5}
              />
            );
          })
        : null}
    </svg>
  );
}

/** Legend that names each line and shows its dash pattern, not only its color. */
export function MovingAverageLegend({ period }: { period: number }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {(["sma", "ema"] as const).map((key) => (
        <li key={key} className="flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="1" x2="27" y1="4" y2="4" stroke={MA_STYLES[key].color} strokeWidth="2.5" strokeDasharray={MA_STYLES[key].dash} />
          </svg>
          <span>
            {MA_STYLES[key].label} {period}
          </span>
        </li>
      ))}
      <li className="flex items-center gap-2">
        <svg width="12" height="12" aria-hidden="true">
          <circle cx="6" cy="6" r="4" fill="#050C1B" stroke="#9FB3CC" strokeWidth="2" />
        </svg>
        <span>First move lower after the peak</span>
      </li>
    </ul>
  );
}

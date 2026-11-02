import { COLORS } from "./chart-geometry";
import { MA_STYLES } from "./MovingAverageChart";

type WeightsChartProps = {
  width: number;
  /** Weight of each candle in the SMA, newest last. */
  smaWeights: number[];
  emaWeights: number[];
  /** How many of the most recent candles to show. */
  visible: number;
  label: string;
};

const HEIGHT = 150;
const TOP = 18;
const AXIS = 24;

/**
 * Side by side bars: how much each recent close counts in the SMA and in the EMA.
 * SMA bars are hatched, EMA bars are solid, so the two differ by more than color.
 */
export function WeightsChart({ width, smaWeights, emaWeights, visible, label }: WeightsChartProps) {
  const count = smaWeights.length;
  const shown = Math.min(visible, count);
  const start = count - shown;
  const bottom = HEIGHT - AXIS;
  const max = Math.max(0.0001, ...smaWeights.slice(start), ...emaWeights.slice(start));
  const left = 8;
  const right = width - 8;
  const slot = shown > 0 ? (right - left) / shown : 0;
  const bar = Math.max(Math.min(slot * 0.36, 12), 2);
  const h = (w: number) => (w / max) * (bottom - TOP);
  const labelEvery = slot < 18 ? 5 : 2;

  return (
    <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={label} className="block">
      <defs>
        <pattern id="sma-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" fill={MA_STYLES.sma.color} fillOpacity="0.35" />
          <line x1="0" y1="0" x2="0" y2="4" stroke={MA_STYLES.sma.color} strokeWidth="2.2" />
        </pattern>
      </defs>
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke={COLORS.grid} />
      {shown === 0 ? (
        <text x={width / 2} y={(TOP + bottom) / 2} textAnchor="middle" fontSize={12} fill={COLORS.label} fontFamily="var(--font-geist)">
          Weights appear once there are enough candles for the period
        </text>
      ) : null}
      {Array.from({ length: shown }, (_, k) => {
        const i = start + k;
        const ago = count - 1 - i;
        const cx = left + slot * (k + 0.5);
        const ws = h(smaWeights[i]);
        const we = h(emaWeights[i]);
        return (
          <g key={i}>
            <rect x={cx - bar - 0.5} y={bottom - ws} width={bar} height={ws} rx={1.5} fill="url(#sma-hatch)" />
            <rect x={cx + 0.5} y={bottom - we} width={bar} height={we} rx={1.5} fill={MA_STYLES.ema.color} />
            {ago === 0 || ago % labelEvery === 0 ? (
              <text x={cx} y={HEIGHT - 8} fontSize={10} textAnchor="middle" fill={ago === 0 ? COLORS.text : COLORS.label} fontFamily="var(--font-geist)">
                {ago === 0 ? "now" : `-${ago}`}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

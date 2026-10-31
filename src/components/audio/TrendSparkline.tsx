import type { TrendSeries } from "@/lib/audio/trend-scenario";

type Props = {
  series: TrendSeries;
  /** Current playhead step, or null to hide it. */
  step?: number | null;
  className?: string;
};

const W = 240;
const H = 80;
const PAD = 6;

/** Synthetic trend line for one timeframe. Illustrative only, not market data. */
export function TrendSparkline({ series, step = null, className }: Props) {
  const { values, timeframe } = series;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - PAD - v * (H - PAD * 2);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const gradientId = `trend-fill-${timeframe.id}`;
  const played = step === null ? null : values.slice(0, step + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={timeframe.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={timeframe.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${gradientId})`} />
      <path
        d={d}
        fill="none"
        stroke={timeframe.color}
        strokeOpacity={played ? 0.35 : 1}
        strokeWidth="2.2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {played && played.length > 1 ? (
        <path
          d={played.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={timeframe.color}
          strokeWidth="2.6"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {step !== null ? (
        <line
          x1={x(step)}
          x2={x(step)}
          y1={0}
          y2={H}
          stroke="#F0F7FF"
          strokeOpacity="0.55"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}

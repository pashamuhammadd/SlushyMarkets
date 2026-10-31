import { formatPrice } from "@/lib/format";
import type { VolumeProfile } from "@/lib/simulations/types";
import { COLORS } from "./chart-geometry";

type VolumeBucketsChartProps = {
  width: number;
  height?: number;
  buckets: VolumeProfile;
  /** Largest bucket volume in the full series. Cups never rescale while filling. */
  bucketMax: number;
  lastPrice: number | null;
  label: string;
  idPrefix: string;
};

/**
 * "Volume buckets": one cup per price range, filled with the BTC that traded inside it.
 * Prices run low to high from left to right. Rotate this view 90 degrees and you get
 * the volume profile, which is the point the lesson makes.
 */
export function VolumeBucketsChart({
  width,
  height = 210,
  buckets,
  bucketMax,
  lastPrice,
  label,
  idPrefix,
}: VolumeBucketsChartProps) {
  const count = buckets.bands.length;
  const padX = 14;
  const slot = (width - padX * 2) / count;
  const cupTop = 30;
  const cupBottom = height - 34;
  const cupHeight = cupBottom - cupTop;
  const topWidth = Math.min(slot * 0.82, 56);
  const bottomWidth = topWidth * 0.72;
  const capacity = bucketMax * 1.08;
  const labelEvery = slot < 30 ? 3 : slot < 46 ? 2 : 1;
  const showValues = slot >= 34;
  const active = lastPrice === null ? -1 : buckets.bands.findIndex((b) => lastPrice >= b.lowUsd && lastPrice < b.highUsd);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block">
      <defs>
        <linearGradient id={`${idPrefix}-slush`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor={COLORS.electric} />
          <stop offset="70%" stopColor={COLORS.cyan} />
          <stop offset="100%" stopColor="#B8F3FF" />
        </linearGradient>
      </defs>

      {buckets.bands.map((band, i) => {
        const cx = padX + slot * (i + 0.5);
        const path = `M${cx - topWidth / 2},${cupTop} L${cx + topWidth / 2},${cupTop} L${cx + bottomWidth / 2},${cupBottom} L${cx - bottomWidth / 2},${cupBottom} Z`;
        const level = capacity > 0 ? Math.min(band.volumeBtc / capacity, 1) : 0;
        const fillTop = cupBottom - level * cupHeight;
        const isActive = i === active;
        const clipId = `${idPrefix}-cup-${i}`;
        return (
          <g key={band.index}>
            <clipPath id={clipId}>
              <path d={path} />
            </clipPath>
            <path d={path} fill="rgba(117, 201, 255, 0.06)" />
            {level > 0 ? (
              <rect
                x={cx - topWidth / 2}
                y={fillTop}
                width={topWidth}
                height={cupBottom - fillTop}
                fill={`url(#${idPrefix}-slush)`}
                clipPath={`url(#${clipId})`}
              />
            ) : null}
            {/* cup rim and outline */}
            <path
              d={path}
              fill="none"
              stroke={isActive ? COLORS.cyan : "rgba(240, 247, 255, 0.35)"}
              strokeWidth={isActive ? 2 : 1.2}
              strokeLinejoin="round"
            />
            <line
              x1={cx - topWidth / 2 - 2}
              x2={cx + topWidth / 2 + 2}
              y1={cupTop}
              y2={cupTop}
              stroke={isActive ? COLORS.cyan : "rgba(240, 247, 255, 0.55)"}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {isActive ? (
              <path d={`M${cx - 5},${cupTop - 16} L${cx + 5},${cupTop - 16} L${cx},${cupTop - 8} Z`} fill={COLORS.cyan} />
            ) : null}
            {showValues && band.volumeBtc > 0 ? (
              <text
                x={cx}
                y={Math.max(fillTop - 5, cupTop + 12)}
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
                fill={level > 0.9 ? "#050C1B" : COLORS.text}
                fontFamily="var(--font-geist)"
              >
                {band.volumeBtc.toFixed(1)}
              </text>
            ) : null}
            {i % labelEvery === 0 ? (
              <text
                x={cx}
                y={height - 14}
                fontSize={10.5}
                textAnchor="middle"
                fill={COLORS.label}
                fontFamily="var(--font-geist)"
              >
                {formatPrice(band.lowUsd)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

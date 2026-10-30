import { formatPrice } from "@/lib/format";
import type { VolumeProfile } from "@/lib/simulations/types";
import { chartGeometry, COLORS, priceTicks, priceToY, type PriceRange } from "./chart-geometry";

export type NodeKind = "poc" | "high" | "low" | "normal" | "empty";

/**
 * Simple, explainable labels for this demo:
 * high volume node = at least 60% of the busiest band,
 * low volume node = traded band at or under 15% of the busiest band, inside the traded range.
 */
export function classifyBands(profile: VolumeProfile): NodeKind[] {
  const volumes = profile.bands.map((b) => b.volumeBtc);
  const max = Math.max(0, ...volumes);
  const traded = profile.bands.flatMap((b, i) => (b.tradeCount > 0 ? [i] : []));
  const first = traded[0] ?? -1;
  const last = traded[traded.length - 1] ?? -1;
  return profile.bands.map((b, i) => {
    if (i === profile.pocBandIndex) return "poc";
    if (max === 0 || i < first || i > last) return "empty";
    if (b.volumeBtc >= max * 0.6) return "high";
    if (b.volumeBtc <= max * 0.15) return "low";
    return "normal";
  });
}

const FILL: Record<NodeKind, string> = {
  poc: COLORS.gold,
  high: COLORS.cyan,
  low: "#3D6FD8",
  normal: COLORS.icy,
  empty: "transparent",
};

type VolumeProfileChartProps = {
  width: number;
  height?: number;
  profile: VolumeProfile;
  range: PriceRange;
  /** Largest band volume in the full series, so bars grow instead of rescaling. */
  bandMax: number;
  lastPrice: number | null;
  label: string;
};

const RIGHT_AXIS = 58;

export function VolumeProfileChart({ width, height, profile, range, bandMax, lastPrice, label }: VolumeProfileChartProps) {
  const g = chartGeometry(height);
  const left = 6;
  const right = Math.max(width - RIGHT_AXIS, left + 40);
  const y = (p: number) => priceToY(p, range, g.top, g.priceBottom);
  const kinds = classifyBands(profile);
  const activeBand =
    lastPrice === null ? -1 : profile.bands.findIndex((b) => lastPrice >= b.lowUsd && lastPrice < b.highUsd);

  return (
    <svg width={width} height={g.height} viewBox={`0 0 ${width} ${g.height}`} role="img" aria-label={label} className="block">
      {priceTicks(range).map((p) => (
        <g key={p}>
          <line x1={left} x2={right} y1={y(p)} y2={y(p)} stroke={COLORS.grid} />
          <text x={right + 8} y={y(p) + 4} fontSize={11} fill={COLORS.label} fontFamily="var(--font-geist)">
            {formatPrice(p)}
          </text>
        </g>
      ))}

      {profile.bands.map((band, i) => {
        const yTop = y(band.highUsd);
        const h = Math.max(y(band.lowUsd) - yTop - 1.5, 1);
        const w = bandMax > 0 ? (band.volumeBtc / bandMax) * (right - left) : 0;
        const kind = kinds[i];
        return (
          <g key={band.index}>
            {i === activeBand ? (
              <rect x={left} y={yTop} width={right - left} height={h} rx={3} fill="rgba(55, 213, 250, 0.10)" />
            ) : null}
            {w > 0 ? (
              <rect
                x={left}
                y={yTop + 0.75}
                width={w}
                height={h}
                rx={3}
                fill={FILL[kind]}
                fillOpacity={kind === "low" ? 0.75 : 0.9}
              />
            ) : null}
          </g>
        );
      })}

      {lastPrice !== null ? (
        <line
          x1={left}
          x2={right}
          y1={y(lastPrice)}
          y2={y(lastPrice)}
          stroke={COLORS.cyan}
          strokeOpacity={0.6}
          strokeDasharray="4 4"
        />
      ) : null}

      <text
        x={left}
        y={g.volumeTop + 18}
        fontSize={11}
        fill={COLORS.label}
        fontFamily="var(--font-geist)"
      >
        Executed volume by $25 price band
      </text>
      <text x={left} y={g.volumeTop + 36} fontSize={11} fill={COLORS.text} fontFamily="var(--font-geist)">
        Total: {profile.totalVolumeBtc.toLocaleString("en-US", { maximumFractionDigits: 4 })} BTC
      </text>
    </svg>
  );
}

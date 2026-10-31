import { formatPrice } from "@/lib/format";
import { classifyVolumeNodes, type NodeKind } from "@/lib/simulations/nodes";
import type { VolumeProfile } from "@/lib/simulations/types";
import { chartGeometry, COLORS, priceTicks, priceToY, type PriceRange } from "./chart-geometry";

/** Which node labels are switched on. Lessons reveal them step by step. */
export type NodeVisibility = { poc: boolean; high: boolean; low: boolean };

export const ALL_NODES: NodeVisibility = { poc: true, high: true, low: true };

export const NODE_COLORS = {
  poc: COLORS.gold,
  high: COLORS.cyan,
  low: "#3D6FD8",
  normal: COLORS.icy,
} as const;

function fillFor(kind: NodeKind, show: NodeVisibility): string {
  if (kind === "poc" && show.poc) return NODE_COLORS.poc;
  if ((kind === "high" || (kind === "poc" && !show.poc)) && show.high) return NODE_COLORS.high;
  if (kind === "low" && show.low) return NODE_COLORS.low;
  return NODE_COLORS.normal;
}

type VolumeProfileChartProps = {
  width: number;
  height?: number;
  profile: VolumeProfile;
  range: PriceRange;
  /** Largest band volume in the full series, so bars grow instead of rescaling. */
  bandMax: number;
  lastPrice: number | null;
  label: string;
  nodes?: NodeVisibility;
};

const RIGHT_AXIS = 58;

export function VolumeProfileChart({
  width,
  height,
  profile,
  range,
  bandMax,
  lastPrice,
  label,
  nodes = ALL_NODES,
}: VolumeProfileChartProps) {
  const g = chartGeometry(height);
  const left = 6;
  const right = Math.max(width - RIGHT_AXIS, left + 40);
  const y = (p: number) => priceToY(p, range, g.top, g.priceBottom);
  const kinds = classifyVolumeNodes(profile);
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
        const fill = fillFor(kind, nodes);
        return (
          <g key={band.index}>
            {i === activeBand ? (
              <rect x={left} y={yTop} width={right - left} height={h} rx={3} fill="rgba(55, 213, 250, 0.10)" />
            ) : null}
            {w > 0 ? <rect x={left} y={yTop + 0.75} width={w} height={h} rx={3} fill={fill} fillOpacity={0.9} /> : null}
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

      <text x={left} y={g.volumeTop + 18} fontSize={11} fill={COLORS.label} fontFamily="var(--font-geist)">
        Executed volume by ${profile.bandUsd} price band
      </text>
      <text x={left} y={g.volumeTop + 36} fontSize={11} fill={COLORS.text} fontFamily="var(--font-geist)">
        Total: {profile.totalVolumeBtc.toLocaleString("en-US", { maximumFractionDigits: 4 })} BTC
      </text>
    </svg>
  );
}

export function NodeLegend({ nodes = ALL_NODES }: { nodes?: NodeVisibility }) {
  const items = [
    { key: "poc", show: nodes.poc, color: NODE_COLORS.poc, label: "Point of control" },
    { key: "high", show: nodes.high, color: NODE_COLORS.high, label: "High volume node" },
    { key: "low", show: nodes.low, color: NODE_COLORS.low, label: "Low volume node" },
  ].filter((item) => item.show);

  if (items.length === 0) {
    return <p className="mt-1 text-xs text-muted">Bars show executed volume per $25 band.</p>;
  }

  return (
    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Legend">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

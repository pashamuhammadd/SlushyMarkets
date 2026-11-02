import { formatPrice } from "@/lib/format";
import type { RenkoBrick } from "@/lib/simulations/renko";
import { COLORS, priceTicks, priceToY, type PriceRange } from "./chart-geometry";

type RenkoChartProps = {
  width: number;
  height?: number;
  bricks: readonly RenkoBrick[];
  /** Slots reserved for bricks, from the full data set, so bricks never rescale during playback. */
  slotCount: number;
  range: PriceRange;
  lastClose: number | null;
  nextUp: number | null;
  nextDown: number | null;
  showThresholds: boolean;
  idPrefix: string;
  label: string;
};

const RIGHT_AXIS = 58;
const TOP = 22;
const AXIS = 26;

/**
 * Renko bricks on a price scale shared with the candle chart. The horizontal axis counts bricks,
 * not time. Up bricks are solid, down bricks are hatched, so direction is not shown by color alone.
 */
export function RenkoChart({
  width,
  height = 300,
  bricks,
  slotCount,
  range,
  lastClose,
  nextUp,
  nextDown,
  showThresholds,
  idPrefix,
  label,
}: RenkoChartProps) {
  const plotLeft = 6;
  const plotRight = Math.max(width - RIGHT_AXIS, plotLeft + 50);
  const bottom = height - AXIS;
  const slots = Math.max(slotCount, 1);
  const slotWidth = Math.min((plotRight - plotLeft) / slots, 30);
  const brickWidth = Math.max(slotWidth * 0.86, 2);
  const y = (price: number) => priceToY(price, range, TOP, bottom);
  const hatchId = `${idPrefix}-down-hatch`;
  const labelEvery = slots <= 10 ? 1 : slots <= 20 ? 5 : 10;
  const newest = bricks.length ? bricks[bricks.length - 1].index : -1;

  const threshold = (price: number | null, color: string, text: string) =>
    price === null || price < range.minPriceUsd || price > range.maxPriceUsd ? null : (
      <g>
        <line x1={plotLeft} x2={plotRight} y1={y(price)} y2={y(price)} stroke={color} strokeOpacity={0.75} strokeDasharray="5 4" />
        <rect x={plotRight + 2} y={y(price) - 9} width={RIGHT_AXIS - 4} height={18} rx={5} fill="#050C1B" stroke={color} />
        <text x={plotRight + RIGHT_AXIS / 2} y={y(price) + 4} fontSize={10} fontWeight={600} textAnchor="middle" fill={color} fontFamily="var(--font-geist)">
          {text}
        </text>
      </g>
    );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block">
      <defs>
        <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill={COLORS.down} fillOpacity="0.3" />
          <line x1="0" y1="0" x2="0" y2="5" stroke={COLORS.down} strokeWidth="2.4" />
        </pattern>
      </defs>

      {priceTicks(range, 250).map((p) => {
        // Hide a price label when a threshold badge sits on top of it.
        const covered =
          showThresholds && [nextUp, nextDown].some((t) => t !== null && Math.abs(y(t) - y(p)) < 14);
        return (
          <g key={p}>
            <line x1={plotLeft} x2={plotRight} y1={y(p)} y2={y(p)} stroke={COLORS.grid} />
            {covered ? null : (
              <text x={plotRight + 8} y={y(p) + 4} fontSize={11} fill={COLORS.label} fontFamily="var(--font-geist)">
                {formatPrice(p)}
              </text>
            )}
          </g>
        );
      })}

      {Array.from({ length: slots }, (_, i) =>
        i === 0 || (i + 1) % labelEvery === 0 ? (
          <text
            key={i}
            x={i === 0 ? plotLeft : plotLeft + slotWidth * (i + 0.5)}
            y={height - 8}
            fontSize={10.5}
            textAnchor={i === 0 ? "start" : "middle"}
            fill={COLORS.label}
            fontFamily="var(--font-geist)"
          >
            {i + 1}
          </text>
        ) : null,
      )}

      {bricks.length === 0 ? (
        <text x={(plotLeft + plotRight) / 2} y={(TOP + bottom) / 2} textAnchor="middle" fontSize={12} fill={COLORS.label} fontFamily="var(--font-geist)">
          No bricks yet. Price has not moved a full box.
        </text>
      ) : null}

      {bricks.map((b) => {
        const up = b.direction === "up";
        const top = y(Math.max(b.open, b.close));
        const h = Math.max(Math.abs(y(b.open) - y(b.close)), 2);
        const x = plotLeft + slotWidth * b.index + (slotWidth - brickWidth) / 2;
        return (
          <rect
            key={b.index}
            x={x}
            y={top}
            width={brickWidth}
            height={h}
            rx={2}
            fill={up ? COLORS.up : `url(#${hatchId})`}
            fillOpacity={up ? 0.85 : 1}
            stroke={b.index === newest ? COLORS.text : up ? COLORS.up : COLORS.down}
            strokeWidth={b.index === newest ? 2 : 1}
          />
        );
      })}

      {lastClose !== null ? (
        <line
          x1={plotLeft}
          x2={plotRight}
          y1={y(lastClose)}
          y2={y(lastClose)}
          stroke={COLORS.cyan}
          strokeOpacity={0.7}
          strokeWidth={1.5}
        />
      ) : null}

      {showThresholds ? (
        <>
          {threshold(nextUp, COLORS.up, "Next up")}
          {threshold(nextDown, COLORS.down, "Next down")}
        </>
      ) : null}
    </svg>
  );
}

/** Legend for the brick chart: shape and pattern, not only color. */
export function RenkoLegend({ idPrefix }: { idPrefix: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block size-3 rounded-[3px]" style={{ backgroundColor: COLORS.up }} />
        Up brick (solid)
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden="true">
          <rect width="12" height="12" rx="2" fill={`url(#${idPrefix}-down-hatch)`} stroke={COLORS.down} />
        </svg>
        Down brick (hatched)
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="18" height="6" aria-hidden="true">
          <line x1="0" x2="18" y1="3" y2="3" stroke={COLORS.cyan} strokeWidth="2" />
        </svg>
        Last close
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="18" height="6" aria-hidden="true">
          <line x1="0" x2="18" y1="3" y2="3" stroke={COLORS.label} strokeWidth="2" strokeDasharray="5 4" />
        </svg>
        Level needed for the next brick
      </li>
    </ul>
  );
}

/**
 * Shared vertical layout so the candle chart and the volume profile use the exact same
 * price scale. Placed side by side, a price band lines up with the candles that traded there.
 */
export type PriceRange = { minPriceUsd: number; maxPriceUsd: number };

export const CHART_HEIGHT = 320;

export function chartGeometry(height: number = CHART_HEIGHT) {
  const top = 14;
  const axis = 26;
  const volumeHeight = Math.round(height * 0.2);
  const gap = 10;
  const priceBottom = height - axis - volumeHeight - gap;
  const volumeTop = priceBottom + gap;
  const volumeBottom = height - axis;
  return { height, top, priceBottom, volumeTop, volumeBottom, axisY: height - 8 };
}

export function priceToY(price: number, range: PriceRange, top: number, bottom: number) {
  const span = range.maxPriceUsd - range.minPriceUsd || 1;
  return bottom - ((price - range.minPriceUsd) / span) * (bottom - top);
}

/** Price grid lines on round $100 levels inside the range. */
export function priceTicks(range: PriceRange, step = 100) {
  const ticks: number[] = [];
  for (let p = Math.ceil(range.minPriceUsd / step) * step; p <= range.maxPriceUsd; p += step) ticks.push(p);
  return ticks;
}

export const COLORS = {
  up: "#44D9A4",
  down: "#FF758A",
  cyan: "#37D5FA",
  icy: "#75C9FF",
  electric: "#2F7BFF",
  violet: "#8B5CF6",
  magenta: "#F05DEB",
  gold: "#FFC53D",
  grid: "rgba(117, 201, 255, 0.08)",
  label: "#7D93B2",
  text: "#F0F7FF",
} as const;

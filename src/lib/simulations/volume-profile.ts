import { fromQuantityUnits, toQuantityUnits } from "./trades";
import type { PriceBand, Trade, VolumeProfile } from "./types";

export type VolumeProfileOptions = {
  /** Width of one price band in USD. */
  bandUsd: number;
  /** Fixed price range so bars keep their position while trades accumulate. */
  minPriceUsd: number;
  maxPriceUsd: number;
};

/** Band index for a price. Bands include their lower edge and exclude their upper edge. */
export function bandIndexFor(priceUsd: number, bandUsd: number): number {
  return Math.floor(priceUsd / bandUsd);
}

/**
 * Sums executed quantity per price band (volume by price).
 *
 * This measures trades that actually happened at each price. It is not resting
 * order book liquidity and it does not promise future buying or selling interest.
 * Every band in the range is returned, including empty ones, so layouts stay stable.
 * Trades outside the range are clamped into the first or last band.
 */
export function buildVolumeProfile(
  trades: readonly Trade[],
  { bandUsd, minPriceUsd, maxPriceUsd }: VolumeProfileOptions,
): VolumeProfile {
  if (bandUsd <= 0) throw new Error("bandUsd must be positive");
  if (maxPriceUsd < minPriceUsd) throw new Error("maxPriceUsd must be at least minPriceUsd");

  const firstIndex = bandIndexFor(minPriceUsd, bandUsd);
  const lastIndex = bandIndexFor(maxPriceUsd, bandUsd);
  const count = lastIndex - firstIndex + 1;

  const units = new Array<number>(count).fill(0);
  const tradeCounts = new Array<number>(count).fill(0);
  let totalUnits = 0;

  for (const trade of trades) {
    const raw = bandIndexFor(trade.priceUsd, bandUsd) - firstIndex;
    const slot = Math.min(Math.max(raw, 0), count - 1);
    const q = toQuantityUnits(trade.quantityBtc);
    units[slot] += q;
    tradeCounts[slot] += 1;
    totalUnits += q;
  }

  const bands: PriceBand[] = units.map((u, i) => {
    const index = firstIndex + i;
    return {
      index,
      lowUsd: index * bandUsd,
      highUsd: (index + 1) * bandUsd,
      volumeBtc: fromQuantityUnits(u),
      tradeCount: tradeCounts[i],
    };
  });

  // Point of control: the band with the most executed volume. Ties go to the lower price band.
  let pocBandIndex: number | null = null;
  units.forEach((u, i) => {
    if (u > 0 && (pocBandIndex === null || u > units[pocBandIndex])) pocBandIndex = i;
  });

  return { bandUsd, bands, totalVolumeBtc: fromQuantityUnits(totalUnits), pocBandIndex };
}

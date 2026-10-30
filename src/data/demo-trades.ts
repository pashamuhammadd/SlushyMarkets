import { createRng } from "@/lib/simulations/trades";
import type { Trade } from "@/lib/simulations/types";

/**
 * SYNTHETIC DEMO DATA. These are invented, BTC-like trades for teaching.
 * They do not come from any exchange and must never be presented as live prices.
 *
 * The series is generated from a fixed seed, so it is identical on every build,
 * server render and browser. Shape of the story it tells:
 *   1. a slow climb from about $63,700,
 *   2. a long, busy consolidation around $64,000 (a high volume area),
 *   3. a fast breakout higher with thinner trading (low volume areas).
 */
export const DEMO_SEED = 20_261_031;
export const DEMO_ORIGIN_MS = Date.UTC(2026, 0, 5, 10, 0, 0);
export const DEMO_CANDLE_MS = 60_000;
export const DEMO_BAND_USD = 25;
export const DEMO_TRADES_PER_CANDLE = 14;
export const DEMO_SYMBOL = "SYN-BTC/USD";

/** Target price per one minute candle; trades drift toward it with seeded noise. */
const CANDLE_TARGETS = [63_730, 63_780, 63_850, 63_940, 64_010, 63_985, 64_025, 63_995, 64_015, 64_130, 64_240, 64_300];

function generateDemoTrades(): Trade[] {
  const rng = createRng(DEMO_SEED);
  const trades: Trade[] = [];
  let price = 63_700;
  let serial = 0;

  CANDLE_TARGETS.forEach((target, candleIndex) => {
    const candleStart = DEMO_ORIGIN_MS + candleIndex * DEMO_CANDLE_MS;
    const step = DEMO_CANDLE_MS / DEMO_TRADES_PER_CANDLE;

    for (let i = 0; i < DEMO_TRADES_PER_CANDLE; i += 1) {
      const pull = (target - price) * 0.28;
      const noise = (rng() - 0.5) * 46;
      price = Math.round(price + pull + noise);

      // Trading is busier near $64,000 in this story, so that level builds a volume node.
      const nearConsolidation = Math.abs(price - 64_000) < 45;
      const base = 0.04 + rng() * 0.42;
      const quantity = Math.round(base * (nearConsolidation ? 2.1 : 1) * 10_000) / 10_000;

      const jitter = Math.floor(rng() * (step * 0.6));
      serial += 1;
      trades.push({
        id: `t-${String(serial).padStart(3, "0")}`,
        timestampMs: candleStart + Math.floor(i * step) + jitter,
        priceUsd: price,
        quantityBtc: quantity,
      });
    }
  });

  return trades;
}

export const DEMO_TRADES: readonly Trade[] = Object.freeze(generateDemoTrades());

const prices = DEMO_TRADES.map((t) => t.priceUsd);

/** Fixed price window for charts, padded to whole bands so the axis never jumps. */
export const DEMO_PRICE_RANGE = {
  minPriceUsd: Math.floor((Math.min(...prices) - DEMO_BAND_USD) / DEMO_BAND_USD) * DEMO_BAND_USD,
  maxPriceUsd: Math.ceil((Math.max(...prices) + DEMO_BAND_USD) / DEMO_BAND_USD) * DEMO_BAND_USD,
} as const;

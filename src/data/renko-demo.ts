import { paddedPriceRange, syntheticCandles } from "@/lib/simulations/synthetic-candles";
import type { Candle } from "@/lib/simulations/types";

/**
 * SYNTHETIC DEMO DATA for the Renko Bricks lesson. Invented, BTC-like hourly candles.
 * They do not come from any exchange and must never be presented as live prices.
 *
 * Generated from a fixed seed. The story has five parts that each teach one idea:
 *   1. a steady climb (one brick every few hours),
 *   2. a long quiet range (candles keep printing, $100 bricks do not),
 *   3. a sudden spike (one candle completes several bricks),
 *   4. a slide lower (the first down brick needs two boxes),
 *   5. a choppy finish: $50 bricks flip back and forth, $100 and $200 bricks stay still.
 */
export const RENKO_DEMO_SEED = 20_261_103;
export const RENKO_DEMO_SYMBOL = "SYN-BTC/USD";
export const RENKO_DEMO_CANDLE_MS = 60 * 60 * 1000;
export const RENKO_DEMO_ORIGIN_MS = Date.UTC(2026, 0, 19, 0, 0, 0);

/** Box size choices in dollars. $100 is the default. */
export const RENKO_BOX_SIZES = [50, 100, 200] as const;
export type RenkoBoxSize = (typeof RENKO_BOX_SIZES)[number];
export const RENKO_DEFAULT_BOX: RenkoBoxSize = 100;

/** Candle ranges for each part of the story (start inclusive, end exclusive). */
export const RENKO_PHASES = {
  climb: { start: 0, end: 12 },
  quiet: { start: 12, end: 28 },
  spike: { start: 28, end: 30 },
  slide: { start: 30, end: 46 },
  finish: { start: 46, end: 58 },
} as const;

const TARGETS: number[] = [
  // 0 to 11: steady climb from about 63,000
  63_020, 63_070, 63_110, 63_170, 63_210, 63_260, 63_300, 63_360, 63_410, 63_460, 63_510, 63_550,
  // 12 to 27: quiet range between about 63,500 and 63,590
  63_530, 63_565, 63_520, 63_575, 63_540, 63_580, 63_525, 63_560, 63_535, 63_570, 63_520, 63_555, 63_540, 63_575, 63_530, 63_560,
  // 28 to 29: sudden spike
  63_780, 64_030,
  // 30 to 45: drift, then a slide lower
  64_050, 64_010, 64_060, 64_020, 63_940, 63_860, 63_780, 63_690, 63_600, 63_520, 63_430, 63_360, 63_300, 63_250, 63_280, 63_240,
  // 46 to 57: choppy finish, swings of about $150
  63_370, 63_215, 63_370, 63_215, 63_370, 63_215, 63_370, 63_215, 63_370, 63_215, 63_370, 63_215,
];

export const RENKO_DEMO_CANDLES: readonly Candle[] = Object.freeze(
  syntheticCandles(TARGETS, {
    seed: RENKO_DEMO_SEED,
    originMs: RENKO_DEMO_ORIGIN_MS,
    candleMs: RENKO_DEMO_CANDLE_MS,
    closeNoise: 16,
  }),
);
export const RENKO_DEMO_CLOSES: readonly number[] = Object.freeze(RENKO_DEMO_CANDLES.map((c) => c.close));

/** Fixed price window shared by the candle chart and the brick chart, so both line up. */
export const RENKO_DEMO_PRICE_RANGE = paddedPriceRange(RENKO_DEMO_CANDLES);

import { paddedPriceRange, syntheticCandles } from "@/lib/simulations/synthetic-candles";
import type { Candle } from "@/lib/simulations/types";

/**
 * SYNTHETIC DEMO DATA for the SMA vs EMA lesson. Invented, BTC-like hourly candles.
 * They do not come from any exchange and must never be presented as live prices.
 *
 * Generated from a fixed seed, so it is identical on every build and browser.
 * The story has three parts that each teach one idea:
 *   1. a steady climb (both averages follow, the EMA hugs price more closely),
 *   2. a sharp reversal after a peak (the EMA turns down before the SMA),
 *   3. a choppy sideways range (the EMA wobbles more, the SMA stays calmer).
 */
export const MA_DEMO_SEED = 20_261_102;
export const MA_DEMO_SYMBOL = "SYN-BTC/USD";
export const MA_DEMO_CANDLE_MS = 60 * 60 * 1000;
export const MA_DEMO_ORIGIN_MS = Date.UTC(2026, 0, 12, 0, 0, 0);

/** Period choices offered in the lesson. 10 is the default. */
export const MA_PERIODS = [5, 10, 20] as const;
export type MaPeriod = (typeof MA_PERIODS)[number];
export const MA_DEFAULT_PERIOD: MaPeriod = 10;

/** Index of the highest close, where the climb ends and the reversal starts. */
export const MA_DEMO_PEAK_INDEX = 21;
/** First candle of the sideways range. */
export const MA_DEMO_RANGE_START = 30;

/** Target close per candle. Seeded noise is added on top. */
const TARGETS: number[] = [
  // 0 to 21: steady climb with small pullbacks
  63_000, 63_080, 63_050, 63_170, 63_260, 63_220, 63_340, 63_430, 63_400, 63_520, 63_610,
  63_580, 63_700, 63_790, 63_760, 63_880, 63_980, 63_950, 64_080, 64_180, 64_260, 64_380,
  // 22 to 29: sharp reversal
  64_150, 63_900, 63_700, 63_480, 63_300, 63_150, 63_050, 62_980,
  // 30 to 47: sideways chop around 63,000
  63_120, 62_900, 63_080, 62_870, 63_150, 62_930, 63_060, 62_880, 63_140, 62_950, 63_100,
  62_890, 63_130, 62_920, 63_070, 62_900, 63_110, 63_000,
];

export const MA_DEMO_CANDLES: readonly Candle[] = Object.freeze(
  syntheticCandles(TARGETS, { seed: MA_DEMO_SEED, originMs: MA_DEMO_ORIGIN_MS, candleMs: MA_DEMO_CANDLE_MS, closeNoise: 30 }),
);
export const MA_DEMO_CLOSES: readonly number[] = Object.freeze(MA_DEMO_CANDLES.map((c) => c.close));

/** Fixed price window padded to round $250 levels so the axis never jumps during playback. */
export const MA_DEMO_PRICE_RANGE = paddedPriceRange(MA_DEMO_CANDLES);

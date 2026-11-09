import type { RawCandle } from "@/lib/experiments/squeeze";

/**
 * Coinbase Exchange BTC-USD daily UTC candles: [unix seconds, low, high, open, close, volume],
 * October 2024 through December 2025. Oct to Dec 2024 only initializes the indicators.
 * Left empty until the data file is added. The experiment stays unavailable while this is empty.
 */
export const BTC_USD_DAILY: RawCandle[] = [];

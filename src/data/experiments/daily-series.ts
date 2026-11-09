import type { RawCandle } from "@/lib/experiments/squeeze";
import { BTC_USD_DAILY } from "./btc-usd-daily";

/**
 * Historical series the daily mystery experiment draws its charts from.
 * Add more by importing a candle file here. `buyVolume` (taker buy volume per candle) enables the
 * Volume Pulse preset for charts from that series.
 */
export type DailySeries = { asset: string; source: string; candles: RawCandle[]; buyVolume?: number[] };

export const DAILY_SERIES: DailySeries[] = [{ asset: "BTC/USD", source: "Coinbase Exchange daily UTC candles", candles: BTC_USD_DAILY }];

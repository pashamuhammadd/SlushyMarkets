import type { RawCandle } from "@/lib/experiments/squeeze";
import { BTC_USD_DAILY } from "./btc-usd-daily";
import { BTC_USD_DAILY_2020 } from "./btc-usd-daily-2020";
import { SOL_USD_DAILY } from "./sol-usd-daily";

/**
 * Historical series the daily mystery experiment draws its charts from.
 * `buyVolume` (taker buy volume per candle) enables the Volume Pulse preset for charts from that series.
 * None of these sources has a buyer and seller split yet, so Volume Pulse stays hidden for now.
 */
export type DailySeries = { asset: string; source: string; candles: RawCandle[]; buyVolume?: number[] };

export const DAILY_SERIES: DailySeries[] = [
  { asset: "BTC/USD", source: "Coinbase Exchange daily UTC candles", candles: BTC_USD_DAILY },
  { asset: "BTC/USD", source: "Coinbase Exchange daily UTC candles", candles: BTC_USD_DAILY_2020 },
  { asset: "SOL/USD", source: "Yahoo Finance daily USD candles", candles: SOL_USD_DAILY },
];

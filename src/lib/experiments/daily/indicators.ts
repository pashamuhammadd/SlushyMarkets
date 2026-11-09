import { squeezeBars, type RawCandle, type SqueezeBar } from "../squeeze";

/**
 * Indicators for the daily mystery-market experiment, following Slushy's version 2 prototype.
 * Checked against its published preview bars on 10 November 2026: ER(14), the ER channel and
 * the EMA Sonar gains match exactly. Prices are indexed so the first context close is 100.
 */

export type DailyBar = SqueezeBar & {
  index: number;
  atr: number;
  ema7: number;
  ema20: number;
  ema50: number;
  /** EMA Sonar loudness 0 to 1: (1 - distance / (fade x ATR))^curve. */
  g7: number;
  g20: number;
  g50: number;
  er: number;
  erAge: number;
  erChannelL: number;
  erChannelH: number;
  volume: number;
  volumeRatio: number;
  /** Taker buy share 0 to 1. Null when the source has no buyer and seller split. */
  buyShare: number | null;
  dominanceAge: number;
};

const WARMUP = 50;

function emaSeries(values: readonly number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : out[i - 1] + (v - out[i - 1]) * k));
  return out;
}

function wilderAtr(raw: readonly RawCandle[], period = 14): number[] {
  const out: number[] = [];
  raw.forEach(([, l, h, o], i) => {
    const prev = i > 0 ? raw[i - 1][4] : o;
    const tr = Math.max(h - l, Math.abs(h - prev), Math.abs(l - prev));
    out.push(i < period ? ((out[i - 1] ?? 0) * i + tr) / (i + 1) : out[i - 1] + (tr - out[i - 1]) / period);
  });
  return out;
}

export const emaGain = (price: number, ema: number, atr: number, fade: number, curve: number) =>
  atr > 0 ? Math.max(0, 1 - Math.abs(price - ema) / (fade * atr)) ** curve : 0;

const dominantSide = (share: number | null) => (share === null ? null : share > 0.525 ? "buy" : share < 0.475 ? "sell" : "balanced");

/**
 * `raw` must include at least 50 warm up candles before the first returned bar.
 * `buyVolume` (taker buy volume per candle, same length) is optional.
 */
export function dailyBars(raw: readonly RawCandle[], buyVolume?: readonly number[]): DailyBar[] {
  const closes = raw.map((r) => r[4]);
  const ema7 = emaSeries(closes, 7);
  const ema20 = emaSeries(closes, 20);
  const ema50 = emaSeries(closes, 50);
  const atr = wilderAtr(raw);
  const squeeze = new Map(squeezeBars(raw).map((b) => [b.time, b]));
  const out: DailyBar[] = [];
  for (let i = WARMUP; i < raw.length; i += 1) {
    const s = squeeze.get(raw[i][0]);
    if (!s) continue;
    let path = 0;
    for (let k = i - 13; k <= i; k += 1) path += Math.abs(closes[k] - closes[k - 1]);
    const er = path > 0 ? Math.abs(closes[i] - closes[i - 14]) / path : 0;
    const volumes = raw.slice(i - 20, i).map((r) => r[5]);
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const buy = buyVolume?.[i];
    const buyShare = buy !== undefined && raw[i][5] > 0 ? Math.min(1, Math.max(0, buy / raw[i][5])) : null;
    const prev = out.at(-1);
    const side = dominantSide(buyShare);
    out.push({
      ...s,
      index: i,
      atr: atr[i],
      ema7: ema7[i],
      ema20: ema20[i],
      ema50: ema50[i],
      g7: emaGain(s.c, ema7[i], atr[i], 1, 2.5),
      g20: emaGain(s.c, ema20[i], atr[i], 3, 1.5),
      g50: emaGain(s.c, ema50[i], atr[i], 3, 1.5),
      er,
      erAge: prev && prev.er > 0.5 === er > 0.5 ? prev.erAge + 1 : 1,
      erChannelL: closes[i - 14] - 0.5 * path,
      erChannelH: closes[i - 14] + 0.5 * path,
      volume: raw[i][5],
      volumeRatio: mean > 0 ? raw[i][5] / mean : 0,
      buyShare,
      dominanceAge: prev && side !== null && dominantSide(prev.buyShare) === side ? prev.dominanceAge + 1 : 1,
    });
  }
  return out;
}

const PRICE_KEYS = ["o", "h", "l", "c", "ema14", "bbL", "bbH", "kcL", "kcH", "atr", "ema7", "ema20", "ema50", "erChannelL", "erChannelH"] as const;

/** Rescales prices so `base` becomes 100, and hides real dates. Ratios and indicators are unchanged by scaling. */
export function indexBars(bars: readonly DailyBar[], base: number, startNumber = 1): DailyBar[] {
  const f = 100 / base;
  return bars.map((b, n) => {
    const scaled = { ...b, date: `Bar ${String(startNumber + n).padStart(3, "0")}`, time: startNumber + n };
    for (const key of PRICE_KEYS) scaled[key] = b[key] * f;
    return scaled;
  });
}

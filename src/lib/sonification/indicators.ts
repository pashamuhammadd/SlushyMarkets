import type { Bar } from "./market";

/**
 * Indicator math for the sonification modes. Pure functions, one value per bar.
 *
 * Definitions follow Slushy's prototypes so the sound behaves the same way. Where several
 * versions of an indicator exist, the exact variant is documented next to the function.
 */

/**
 * Average range with Wilder style smoothing, as used for "ATR(7)" in Slushy's prototypes:
 * avg = avg + (high - low - avg) / period, seeded with the first bar's range.
 * Note: this smooths the plain high minus low range, not the classic true range
 * (which also looks at gaps from the previous close).
 */
export function averageRange(bars: readonly Bar[], period = 7): number[] {
  if (!Number.isInteger(period) || period < 1) throw new Error("period must be a positive integer");
  const out: number[] = [];
  let avg = bars.length ? bars[0].high - bars[0].low : 0;
  for (const bar of bars) {
    avg += (bar.high - bar.low - avg) / period;
    out.push(avg);
  }
  return out;
}

/**
 * Kaufman style Efficiency Ratio without smoothing:
 * ER = |close now - close `period` bars ago| / sum of the `period` absolute bar to bar changes.
 * 1 means a perfectly straight move, values near 0 mean a lot of back and forth.
 * `null` until `period` changes exist. A completely flat path returns 0.
 * Slushy's ER(7) uses period 7 (eight closes, seven changes).
 */
export function efficiencyRatio(closes: readonly number[], period = 7): (number | null)[] {
  if (!Number.isInteger(period) || period < 1) throw new Error("period must be a positive integer");
  return closes.map((close, i) => {
    if (i < period) return null;
    let path = 0;
    for (let j = i - period + 1; j <= i; j += 1) path += Math.abs(closes[j] - closes[j - 1]);
    return path === 0 ? 0 : Math.abs(close - closes[i - period]) / path;
  });
}

/**
 * Loudness from closeness: 1 when price sits on the line, fading to 0 at `fadeAtr` average
 * ranges away. `curve` above 1 makes the fade steeper near the edge.
 */
export function proximity(distance: number, avgRange: number, fadeAtr: number, curve: number): number {
  if (!(avgRange > 0) || !(fadeAtr > 0) || !Number.isFinite(distance)) return 0;
  return Math.pow(Math.max(0, 1 - Math.abs(distance) / (fadeAtr * avgRange)), curve);
}

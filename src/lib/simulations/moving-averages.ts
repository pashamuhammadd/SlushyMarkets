/**
 * Moving averages as pure functions. Each returns one value per input, with `null`
 * until there are enough values for the period, so a chart can line results up
 * with candles by index.
 */

export type Series = (number | null)[];

function assertPeriod(period: number) {
  if (!Number.isInteger(period) || period < 1) throw new Error("period must be a positive integer");
}

/** EMA smoothing factor: alpha = 2 / (period + 1). Period 10 gives 2 / 11, about 0.18. */
export function emaAlpha(period: number): number {
  assertPeriod(period);
  return 2 / (period + 1);
}

/**
 * Simple moving average: the plain mean of the last `period` values.
 * Uses a running sum, so each step is O(1).
 */
export function sma(values: readonly number[], period: number): Series {
  assertPeriod(period);
  const out: Series = [];
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

/**
 * Exponential moving average.
 * Seeded with the SMA of the first `period` values (a common convention), then
 * EMA_today = alpha * value_today + (1 - alpha) * EMA_yesterday.
 */
export function ema(values: readonly number[], period: number): Series {
  assertPeriod(period);
  const alpha = emaAlpha(period);
  const out: Series = [];
  let previous: number | null = null;
  let seedSum = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (i < period - 1) {
      seedSum += values[i];
      out.push(null);
    } else if (i === period - 1) {
      seedSum += values[i];
      previous = seedSum / period;
      out.push(previous);
    } else {
      previous = alpha * values[i] + (1 - alpha) * (previous as number);
      out.push(previous);
    }
  }
  return out;
}

/**
 * How much each input value contributes to the SMA at `index`.
 * Returns one weight per value up to `index`; the weights sum to 1.
 */
export function smaWeights(count: number, period: number): number[] {
  assertPeriod(period);
  const weights = new Array<number>(count).fill(0);
  if (count < period) return weights;
  for (let i = count - period; i < count; i += 1) weights[i] = 1 / period;
  return weights;
}

/**
 * How much each input value contributes to the EMA computed over `count` values.
 * Unrolling the recursion: the newest value gets alpha, the one before alpha * (1 - alpha),
 * and so on. What is left over belongs to the SMA seed, spread evenly over the first `period`
 * values. The weights sum to 1, and the dot product with the values equals the EMA.
 */
export function emaWeights(count: number, period: number): number[] {
  assertPeriod(period);
  const weights = new Array<number>(count).fill(0);
  if (count < period) return weights;
  const alpha = emaAlpha(period);
  const steps = count - period; // values added after the seed
  for (let k = 0; k < steps; k += 1) weights[count - 1 - k] = alpha * (1 - alpha) ** k;
  const seedShare = (1 - alpha) ** steps;
  for (let i = 0; i < period; i += 1) weights[i] += seedShare / period;
  return weights;
}

/**
 * First index at or after `from` where the series is lower than one step before.
 * Used to show which average reacts first after a price peak. Null if it never falls.
 */
export function firstTurnDown(series: Series, from: number): number | null {
  for (let i = Math.max(from, 1); i < series.length; i += 1) {
    const a = series[i - 1];
    const b = series[i];
    if (a !== null && b !== null && b < a) return i;
  }
  return null;
}

/** How many times the series changes direction (up to down or down to up) between two indexes. */
export function directionChanges(series: Series, from: number, to: number): number {
  let changes = 0;
  let lastSign = 0;
  for (let i = Math.max(from, 1); i <= Math.min(to, series.length - 1); i += 1) {
    const a = series[i - 1];
    const b = series[i];
    if (a === null || b === null || a === b) continue;
    const sign = b > a ? 1 : -1;
    if (lastSign !== 0 && sign !== lastSign) changes += 1;
    lastSign = sign;
  }
  return changes;
}

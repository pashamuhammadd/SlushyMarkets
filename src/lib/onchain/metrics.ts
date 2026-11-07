import { createRng } from "@/lib/simulations/trades";

/**
 * Teaching versions of two common on-chain metrics, as pure functions.
 * Inputs are small invented examples, never live blockchain data.
 */

/** One spent output: what it was worth when it was created, and what it was worth when it was spent. */
export type SpentOutput = { createdUsd: number; spentUsd: number };

/**
 * SOPR (Spent Output Profit Ratio) for a group of outputs spent in the same period:
 * total USD value when spent / total USD value when created.
 * Above 1: on average the spent coins were worth more than when they were created.
 * Below 1: worth less. `null` when there is nothing to divide by.
 */
export function sopr(outputs: readonly SpentOutput[]): number | null {
  const created = outputs.reduce((sum, o) => sum + o.createdUsd, 0);
  const spent = outputs.reduce((sum, o) => sum + o.spentUsd, 0);
  return created > 0 ? spent / created : null;
}

export type SoprZone = "profit" | "loss" | "break-even";

/** Reading of a SOPR value. Values within `tolerance` of 1.0 count as break even. */
export function soprZone(value: number, tolerance = 0.005): SoprZone {
  if (Math.abs(value - 1) <= tolerance) return "break-even";
  return value > 1 ? "profit" : "loss";
}

/** A coin (or output) with the BTC price at the moment it last moved on chain. */
export type Coin = { id: string; label: string; amountBtc: number; lastMovedPriceUsd: number };

/** Market value: every coin priced at today's price. */
export function marketValue(coins: readonly Coin[], priceUsd: number): number {
  return coins.reduce((sum, c) => sum + c.amountBtc * priceUsd, 0);
}

/** Realized value: every coin priced at the price when it last moved. */
export function realizedValue(coins: readonly Coin[]): number {
  return coins.reduce((sum, c) => sum + c.amountBtc * c.lastMovedPriceUsd, 0);
}

/** MVRV = market value / realized value. `null` when realized value is zero. */
export function mvrv(coins: readonly Coin[], priceUsd: number): number | null {
  const realized = realizedValue(coins);
  return realized > 0 ? marketValue(coins, priceUsd) / realized : null;
}

/** Moving a coin on chain resets its last moved price to the current price. Returns new coins. */
export function moveCoin(coins: readonly Coin[], id: string, priceUsd: number): Coin[] {
  return coins.map((c) => (c.id === id ? { ...c, lastMovedPriceUsd: priceUsd } : { ...c }));
}

export type Crossing = { index: number; direction: "up" | "down" };

/**
 * Where a series crosses a level, comparing each value with the one before it.
 * Touching the level exactly does not count until the series ends up on the other side.
 */
export function crossings(series: readonly number[], level = 1): Crossing[] {
  const out: Crossing[] = [];
  let side = 0;
  series.forEach((value, index) => {
    const now = value > level ? 1 : value < level ? -1 : 0;
    if (now === 0) return;
    if (side !== 0 && now !== side) out.push({ index, direction: now > 0 ? "up" : "down" });
    side = now;
  });
  return out;
}

/**
 * Invented daily SOPR values for the timeline demo: a seeded, mean reverting walk around 1.0
 * with calm and nervous spells, so the line crosses 1.0 a few times. Rounded to 3 decimals.
 */
export function syntheticSoprSeries(seed: number, days = 60): number[] {
  const rand = createRng(seed);
  const out: number[] = [];
  let level = 1.02;
  let drift = 0.004;
  for (let day = 0; day < days; day += 1) {
    if (day % 12 === 0) drift = (rand() - 0.5) * 0.035;
    level += drift + (1 - level) * 0.12 + (rand() - 0.5) * 0.03;
    level = Math.min(Math.max(level, 0.86), 1.16);
    out.push(Math.round(level * 1000) / 1000);
  }
  return out;
}

/** Maps a dollar value onto two octaves above 220 Hz, so a higher value sounds higher. */
export function valueToHz(value: number, min: number, max: number): number {
  const t = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0.5;
  return 220 * 2 ** (2 * t);
}

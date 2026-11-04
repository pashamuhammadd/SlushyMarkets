import { buildCandles } from "@/lib/simulations/ohlc";
import { createRng, sortTrades } from "@/lib/simulations/trades";
import type { Candle, Trade } from "@/lib/simulations/types";

/**
 * Candle Builder: a short game that practices lesson 1.
 * Each round shows the trades of one simulated minute in shuffled order. The player picks the
 * trade that sets the open, the high, the low and the close. Answers come from `buildCandles`,
 * the same function the lessons use, so the game can never disagree with the lesson.
 * Everything is synthetic and deterministic for a given seed.
 */

export const CANDLE_ROLES = ["open", "high", "low", "close"] as const;
export type CandleRole = (typeof CANDLE_ROLES)[number];

export const ROLE_LABEL: Record<CandleRole, string> = { open: "Open", high: "High", low: "Low", close: "Close" };

/** Trades per round. Rounds get a little harder as the game goes on. */
export const ROUND_SIZES = [5, 6, 7, 8, 9] as const;
export const ROUNDS_PER_GAME = ROUND_SIZES.length;
export const MAX_SCORE = ROUNDS_PER_GAME * CANDLE_ROLES.length;

const MINUTE_MS = 60_000;
/** Fixed, clearly invented clock so every round reads as one minute of trading. */
const ROUND_ORIGIN_MS = Date.UTC(2026, 0, 5, 9, 30, 0);

export type CandleRound = {
  /** Trades in the order they are shown to the player (shuffled, never already sorted by time). */
  trades: Trade[];
  /** The candle built from these trades. */
  candle: Candle;
  /** The trade id that defines each value. */
  answer: Record<CandleRole, string>;
};

export type RoundPicks = Partial<Record<CandleRole, string>>;

export type RoundResult = {
  correct: Record<CandleRole, boolean>;
  points: number;
};

/** Combines a game seed and a round number into one 32 bit seed. */
export function roundSeed(gameSeed: number, round: number): number {
  return (Math.imul(gameSeed ^ 0x9e3779b9, 0x85ebca6b) + Math.imul(round + 1, 0xc2b2ae35)) >>> 0;
}

export function generateRound(seed: number, tradeCount: number): CandleRound {
  if (!Number.isInteger(tradeCount) || tradeCount < 4 || tradeCount > 40) throw new Error("tradeCount must be 4 to 40");
  const rng = createRng(seed);

  // Distinct seconds inside the minute, sorted, so trades have a clear time order.
  const seconds = new Set<number>();
  while (seconds.size < tradeCount) seconds.add(1 + Math.floor(rng() * 58));
  const times = [...seconds].sort((a, b) => a - b);

  // Distinct prices: a random walk that never repeats a value, so each role has exactly one answer.
  const used = new Set<number>();
  let price = 63_000 + Math.round(rng() * 1_500);
  const trades: Trade[] = times.map((second, i) => {
    let next = i === 0 ? price : price + Math.round((rng() - 0.5) * 90);
    while (used.has(next)) next += 1;
    used.add(next);
    price = next;
    return {
      id: `r${i + 1}`,
      timestampMs: ROUND_ORIGIN_MS + second * 1_000,
      priceUsd: next,
      quantityBtc: Math.round((0.02 + rng() * 0.6) * 10_000) / 10_000,
    };
  });

  // Fisher Yates shuffle; rotate if it happens to come out in time order.
  const shown = [...trades];
  for (let i = shown.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shown[i], shown[j]] = [shown[j], shown[i]];
  }
  if (shown.every((t, i) => t.id === trades[i].id)) shown.push(shown.shift() as Trade);

  const [candle] = buildCandles(trades, { candleMs: MINUTE_MS, originMs: ROUND_ORIGIN_MS });
  const byTime = sortTrades(trades);
  const answer: Record<CandleRole, string> = {
    open: byTime[0].id,
    close: byTime[byTime.length - 1].id,
    high: trades.find((t) => t.priceUsd === candle.high)!.id,
    low: trades.find((t) => t.priceUsd === candle.low)!.id,
  };

  return { trades: shown, candle, answer };
}

/** All rounds of one game. */
export function generateGame(gameSeed: number): CandleRound[] {
  return ROUND_SIZES.map((size, i) => generateRound(roundSeed(gameSeed, i), size));
}

/** One point per role picked correctly. */
export function scoreRound(round: CandleRound, picks: RoundPicks): RoundResult {
  const correct = Object.fromEntries(CANDLE_ROLES.map((role) => [role, picks[role] === round.answer[role]])) as Record<
    CandleRole,
    boolean
  >;
  return { correct, points: CANDLE_ROLES.filter((role) => correct[role]).length };
}

/** Explains why a trade is the answer for a role, in plain English. */
export function explainRole(role: CandleRole): string {
  switch (role) {
    case "open":
      return "The open is the first trade by time, not the first row in the list.";
    case "close":
      return "The close is the last trade by time inside the minute.";
    case "high":
      return "The high is the highest price of any trade in the minute.";
    case "low":
      return "The low is the lowest price of any trade in the minute.";
  }
}

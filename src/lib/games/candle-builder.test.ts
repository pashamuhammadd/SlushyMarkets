import { describe, expect, it } from "vitest";
import { buildCandles } from "@/lib/simulations/ohlc";
import { sortTrades } from "@/lib/simulations/trades";
import {
  CANDLE_ROLES,
  MAX_SCORE,
  ROUND_SIZES,
  explainRole,
  generateGame,
  generateRound,
  roundSeed,
  scoreRound,
} from "./candle-builder";

describe("generateRound", () => {
  it("is deterministic for a seed", () => {
    expect(generateRound(42, 7)).toEqual(generateRound(42, 7));
    expect(generateRound(42, 7)).not.toEqual(generateRound(43, 7));
  });

  it("makes every round answerable with exactly one trade per role", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      for (const size of ROUND_SIZES) {
        const round = generateRound(seed, size);
        expect(round.trades).toHaveLength(size);
        expect(new Set(round.trades.map((t) => t.priceUsd)).size).toBe(size);
        expect(new Set(round.trades.map((t) => t.timestampMs)).size).toBe(size);
        // Every trade is in the same one minute candle.
        expect(buildCandles(round.trades, { candleMs: 60_000, originMs: round.candle.startMs })).toHaveLength(1);
      }
    }
  });

  it("agrees with the lesson's OHLC function", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const round = generateRound(seed, 8);
      const byId = new Map(round.trades.map((t) => [t.id, t]));
      const sorted = sortTrades(round.trades);
      expect(byId.get(round.answer.open)!.priceUsd).toBe(round.candle.open);
      expect(byId.get(round.answer.close)!.priceUsd).toBe(round.candle.close);
      expect(byId.get(round.answer.high)!.priceUsd).toBe(round.candle.high);
      expect(byId.get(round.answer.low)!.priceUsd).toBe(round.candle.low);
      expect(round.answer.open).toBe(sorted[0].id);
      expect(round.answer.close).toBe(sorted.at(-1)!.id);
    }
  });

  it("never shows the trades already sorted by time", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const round = generateRound(seed, 5);
      const sortedIds = sortTrades(round.trades).map((t) => t.id);
      expect(round.trades.map((t) => t.id)).not.toEqual(sortedIds);
    }
  });

  it("rejects silly sizes", () => {
    expect(() => generateRound(1, 2)).toThrow();
  });
});

describe("game and scoring", () => {
  it("builds five rounds that grow in size", () => {
    const game = generateGame(123);
    expect(game.map((r) => r.trades.length)).toEqual([...ROUND_SIZES]);
    expect(MAX_SCORE).toBe(20);
    expect(roundSeed(1, 0)).not.toBe(roundSeed(1, 1));
  });

  it("gives one point per correct role", () => {
    const round = generateRound(7, 6);
    expect(scoreRound(round, round.answer).points).toBe(4);
    expect(scoreRound(round, {}).points).toBe(0);
    const wrongOpen = round.trades.find((t) => t.id !== round.answer.open)!.id;
    const result = scoreRound(round, { ...round.answer, open: wrongOpen });
    expect(result.points).toBe(3);
    expect(result.correct.open).toBe(false);
  });

  it("explains every role without em or en dashes", () => {
    for (const role of CANDLE_ROLES) expect(explainRole(role)).not.toMatch(/[–—]/);
  });
});

import { describe, expect, it } from "vitest";
import type { Bar } from "@/lib/sonification/market";
import {
  PRACTICE_CONFIG,
  advanceRound,
  closePosition,
  combineResults,
  createAccount,
  createRound,
  equity,
  markToMarket,
  openPosition,
  practiceSeeds,
  practiceSeries,
  summarize,
  tradeRound,
  visibleBars,
} from "./practice";

const FEE = 0.001;
const flatBar = (close: number): Bar => ({ open: close, high: close, low: close, close });
const balanced = (a: ReturnType<typeof createAccount>) => a.startingBalance + a.realizedPnl - a.fees;

describe("long and short P&L", () => {
  it("long earns when price rises, after both fees", () => {
    const opened = openPosition(createAccount(10_000), "long", 100, FEE);
    const notional = 10_000 / 1.001;
    expect(opened.fees).toBeCloseTo(notional * FEE, 8);
    const closed = closePosition(opened, 110, FEE);
    const qty = notional / 100;
    expect(closed.realizedPnl).toBeCloseTo(qty * 10, 8);
    expect(closed.fees).toBeCloseTo(notional * FEE + qty * 110 * FEE, 8);
    expect(closed.balance).toBeCloseTo(balanced(closed), 8);
    expect(closed.transactions).toBe(2);
  });

  it("short earns when price falls and loses when it rises", () => {
    const short = openPosition(createAccount(10_000), "short", 100, 0);
    expect(closePosition(short, 90, 0).balance).toBeCloseTo(11_000, 8);
    expect(closePosition(short, 110, 0).balance).toBeCloseTo(9_000, 8);
  });

  it("round trip at the same price loses only the fees", () => {
    const closed = closePosition(openPosition(createAccount(10_000), "long", 100, FEE), 100, FEE);
    expect(closed.realizedPnl).toBe(0);
    expect(closed.balance).toBeCloseTo(10_000 - closed.fees, 8);
    expect(closed.fees).toBeGreaterThan(0);
  });

  it("ignores a repeat on the same side, and reverses with two transactions", () => {
    const long = openPosition(createAccount(), "long", 100, FEE);
    expect(openPosition(long, "long", 120, FEE)).toBe(long);
    const short = openPosition(long, "short", 120, FEE);
    expect(short.position?.side).toBe("short");
    expect(short.transactions).toBe(3);
    expect(short.balance).toBeCloseTo(balanced(short), 8);
  });

  it("does nothing for bad prices or when flat", () => {
    const account = createAccount();
    expect(closePosition(account, 100)).toBe(account);
    expect(openPosition(account, "long", 0)).toBe(account);
    expect(openPosition(account, "long", Number.NaN)).toBe(account);
    expect(markToMarket(account, -5)).toBe(account);
  });
});

describe("drawdown and zero floor", () => {
  it("measures the largest fall from a peak", () => {
    let a = openPosition(createAccount(10_000), "long", 100, 0);
    for (const price of [120, 90, 110]) a = markToMarket(a, price, 0);
    expect(a.peakEquity).toBeCloseTo(12_000, 8);
    expect(a.maxDrawdown).toBeCloseTo(0.25, 8);
  });

  it("never lets an account go below zero", () => {
    const short = openPosition(createAccount(10_000), "short", 100, FEE);
    expect(equity(short, 500)).toBe(0);
    const marked = markToMarket(short, 500, FEE);
    expect(marked.position).toBeNull();
    expect(marked.balance).toBe(0);
    expect(marked.maxDrawdown).toBe(1);
    expect(openPosition(marked, "long", 100, FEE)).toBe(marked);
  });
});

describe("round flow", () => {
  const bars = [100, 110, 120, 130].map(flatBar);

  it("fills at the latest revealed bar and closes at the end", () => {
    let s = advanceRound(createRound(), bars, 1);
    s = tradeRound(s, bars, "long");
    expect(s.account.position?.entryPrice).toBe(110);
    s = advanceRound(s, bars, 3);
    expect(s.finished).toBe(true);
    expect(s.account.position).toBeNull();
    expect(s.account.realizedPnl).toBeGreaterThan(0);
    expect(tradeRound(s, bars, "short")).toBe(s);
  });

  it("cannot move backwards and cannot show future bars", () => {
    const s = advanceRound(createRound(), bars, 2);
    expect(advanceRound(s, bars, 1).bar).toBe(2);
    expect(visibleBars(bars, 2)).toHaveLength(3);
    expect(visibleBars(bars, 0)).toEqual([bars[0]]);
  });

  it("summarizes results", () => {
    const account = closePosition(openPosition(createAccount(10_000), "long", 100, 0), 110, 0);
    const result = summarize(account);
    expect(result.netPnl).toBeCloseTo(1_000, 8);
    expect(result.returnPct).toBeCloseTo(10, 8);
    const total = combineResults([result, { ...result, netPnl: -400, maxDrawdownPct: 7, transactions: 4, fees: 3 }]);
    expect(total.netPnl).toBeCloseTo(600, 8);
    expect(total.returnPct).toBeCloseTo(3, 8);
    expect(total.maxDrawdownPct).toBe(7);
    expect(total.transactions).toBe(6);
  });
});

describe("practice charts", () => {
  it("are deterministic, the right length, positive and differ by attempt", () => {
    expect(practiceSeries(7)).toEqual(practiceSeries(7));
    expect(practiceSeries(7)).toHaveLength(PRACTICE_CONFIG.warmupBars + PRACTICE_CONFIG.barsPerRound);
    expect(PRACTICE_CONFIG.barsPerRound * PRACTICE_CONFIG.barSeconds).toBe(60);
    expect(new Set([...practiceSeeds(0), ...practiceSeeds(1)]).size).toBe(6);
    for (let seed = 20261200; seed < 20261260; seed += 1) {
      for (const bar of practiceSeries(seed)) expect(bar.low).toBeGreaterThan(0);
    }
  });
});

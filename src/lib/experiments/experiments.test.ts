import { describe, expect, it } from "vitest";
import { EXPERIMENT_SETTINGS, accountEquity, advanceBar, createPaperAccount, experimentResult, queueOrder, type PaperBar } from "./engine";
import { BTC_2025_VERSION, poolStats, statsGroups, validateRoundSubmission, type RoundStatsRow } from "./rounds";
import { barSoundEvents, dotCount, entryChimes, experimentPeriod, experimentYear, releaseClashes, speedLevel, squeezeBars, squeezeMeters, type RawCandle, type SqueezeBar } from "./squeeze";

const bar = (date: string, o: number, c = o): PaperBar => ({ date, o, c });

describe("experiment engine", () => {
  it("uses Slushy's costs", () => {
    expect(EXPERIMENT_SETTINGS).toEqual({ initial: 10_000, notional: 2_000, fee: 0.0005, slippage: 0.0002, commission: 0 });
  });

  it("fills a queued long at the next open with slippage and fee", () => {
    let a = queueOrder(createPaperAccount(), 1);
    a = advanceBar(a, bar("d1", 100, 105));
    const entry = 100 * 1.0002;
    expect(a.position?.entry).toBeCloseTo(entry, 10);
    expect(a.position?.quantity).toBeCloseTo(2_000 / entry, 10);
    expect(a.balance).toBeCloseTo(10_000 - 1, 10);
    expect(a.pending).toBeNull();
  });

  it("calculates a long round trip after all costs", () => {
    let a = advanceBar(queueOrder(createPaperAccount(), 1), bar("d1", 100));
    a = advanceBar(queueOrder(a, 0), bar("d2", 110));
    const entry = 100.02;
    const quantity = 2_000 / entry;
    const exit = 110 * 0.9998;
    const net = quantity * (exit - entry) - 1 - quantity * exit * 0.0005;
    expect(a.trades[0].net).toBeCloseTo(net, 8);
    expect(a.balance).toBeCloseTo(10_000 + net, 8);
  });

  it("charges slippage against a short on both sides", () => {
    let a = advanceBar(queueOrder(createPaperAccount(), -1), bar("d1", 100));
    expect(a.position?.entry).toBeCloseTo(99.98, 10);
    a = advanceBar(queueOrder(a, 0), bar("d2", 90));
    expect(a.trades[0].exit).toBeCloseTo(90.018, 10);
    expect(a.trades[0].net).toBeGreaterThan(0);
  });

  it("flips by closing and reopening, and ignores the same side", () => {
    let a = advanceBar(queueOrder(createPaperAccount(), 1), bar("d1", 100));
    const same = advanceBar(queueOrder(a, 1), bar("d2", 101));
    expect(same.fills).toHaveLength(1);
    a = advanceBar(queueOrder(a, -1), bar("d2", 101));
    expect(a.position?.side).toBe(-1);
    expect(a.trades).toHaveLength(1);
    expect(a.fills).toHaveLength(3);
  });

  it("does not fill until a bar arrives, and force closes at the last close", () => {
    let a = queueOrder(createPaperAccount(), 1);
    expect(a.position).toBeNull();
    a = advanceBar(a, bar("d1", 100, 100));
    a = advanceBar(a, bar("d2", 100, 120), true);
    expect(a.position).toBeNull();
    expect(a.trades[0].forced).toBe(true);
    expect(a.trades[0].exit).toBeCloseTo(120 * 0.9998, 10);
  });

  it("tracks drawdown at daily closes", () => {
    let a = advanceBar(queueOrder(createPaperAccount(), 1), bar("d1", 100, 200));
    const peak = accountEquity(a, 200);
    a = advanceBar(a, bar("d2", 200, 100));
    expect(a.maxDrawdown).toBeCloseTo((peak - accountEquity(a, 100)) / peak, 10);
  });

  it("summarizes results and handles no trades and no losses", () => {
    expect(experimentResult(createPaperAccount())).toMatchObject({ netPnl: 0, tradeCount: 0, wins: 0, profitFactor: null });
    let a = advanceBar(queueOrder(createPaperAccount(), 1), bar("d1", 100));
    a = advanceBar(a, bar("d2", 150), true);
    const r = experimentResult(a);
    expect(r.wins).toBe(1);
    expect(r.profitFactor).toBe(Infinity);
    expect(r.winningPnl - r.losingPnl).toBeCloseTo(r.netPnl, 8);
  });
});

const day = 86_400;
const start = Date.UTC(2024, 9, 1) / 1000;
function candles(count: number, close: (i: number) => number, range = 1): RawCandle[] {
  return Array.from({ length: count }, (_, i) => {
    const c = close(i);
    const o = i ? close(i - 1) : c;
    return [start + i * day, Math.min(o, c) - range, Math.max(o, c) + range, o, c, 1];
  });
}

describe("squeeze indicators", () => {
  it("starts on the 14th candle and matches the formulas", () => {
    const raw = candles(20, (i) => 100 + i);
    const bars = squeezeBars(raw);
    expect(bars).toHaveLength(7);
    const first = bars[0];
    const closes = raw.slice(0, 14).map((r) => r[4]);
    const mean = closes.reduce((a, b) => a + b) / 14;
    const sd = Math.sqrt(closes.reduce((a, b) => a + (b - mean) ** 2, 0) / 14);
    expect(first.bbH).toBeCloseTo(mean + 2 * sd, 10);
    expect(first.bbL).toBeCloseTo(mean - 2 * sd, 10);
  });

  it("detects entry and release from a quiet market that breaks out", () => {
    const close = (i: number) => (i < 40 ? 100 + (i % 2) * 0.1 : 100 + (i - 39) * 8);
    const bars = squeezeBars(candles(60, close, 5));
    expect(bars.some((b) => b.squeeze)).toBe(true);
    const release = bars.find((b) => b.release);
    expect(release?.squeeze).toBe(false);
    expect(release?.prior).toBeGreaterThan(0);
    expect(release?.age).toBe(1);
  });

  it("requires a complete, continuous year", () => {
    const n = 92 + 365;
    const raw = candles(n, (i) => 100 + Math.sin(i / 5) * 3);
    const year = experimentYear(raw, 2025);
    expect(year?.days).toHaveLength(365);
    expect(year?.days[0].date).toBe("2025-01-01");
    expect(year?.all[year.startIndex].date).toBe("2025-01-01");
    expect(experimentYear(raw.slice(0, -1), 2025)).toBeNull();
    expect(experimentYear(raw.filter((_, i) => i !== 200), 2025)).toBeNull();
    expect(experimentYear([], 2025)).toBeNull();
  });
});

describe("experiment sound mapping", () => {
  const base: SqueezeBar = { time: 0, date: "", o: 1, h: 1, l: 1, c: 1, ema14: 1, bbL: 1, bbH: 1, kcL: 1, kcH: 1, direction: 1, squeeze: false, release: false, entry: false, prior: 0, age: 1 };

  it("uses the level tables", () => {
    expect([1, 5, 6, 10, 11, 19].map(speedLevel)).toEqual([1, 1, 2, 3, 3, 5]);
    expect([5, 6, 12, 13, 19, 20, 26, 27].map(entryChimes)).toEqual([1, 2, 2, 3, 3, 4, 4, 5]);
    expect([1, 6, 19].map(releaseClashes)).toEqual([1, 2, 4]);
  });

  it("plays the right voice for each state", () => {
    expect(barSoundEvents({ ...base, entry: true, squeeze: true, prior: 13 })).toHaveLength(3);
    expect(barSoundEvents({ ...base, release: true, prior: 19 }).every((e) => e.kind === "cymbal")).toBe(true);
    expect(barSoundEvents({ ...base, squeeze: true, age: 6 }).map((e) => e.kind)).toEqual(["drum", "drum"]);
    expect(barSoundEvents({ ...base, direction: 1 })[0]).toMatchObject({ kind: "chime", hz: 1050 });
    expect(barSoundEvents({ ...base, direction: -1 })[0]).toMatchObject({ kind: "chime", hz: 520 });
    expect(barSoundEvents({ ...base, direction: 0 })).toEqual([]);
  });
});

describe("shared rounds", () => {
  const valid = {
    submissionId: "2f1c9d3a-7b4e-4a51-9c2d-1e5f6a7b8c9d",
    experiment: "btc-2025",
    experimentVersion: BTC_2025_VERSION,
    round: 1,
    sound: "on",
    netPnl: 50,
    drawdownPct: 4.2,
    tradeCount: 3,
    wins: 2,
    fees: 6,
    winningPnl: 80,
    losingPnl: 30,
  };

  it("accepts a consistent summary and drops unknown fields", () => {
    const result = validateRoundSubmission({ ...valid, name: "Sam", email: "a@b.c" });
    expect(result).toEqual(valid);
    expect(result).not.toHaveProperty("email");
  });

  it.each([
    { submissionId: "abc" },
    { experiment: "practice" },
    { sound: "loud" },
    { wins: 4 },
    { round: 0 },
    { drawdownPct: 101 },
    { netPnl: 500 },
    { fees: -1 },
    { netPnl: Number.NaN },
    { tradeCount: 1.5 },
  ])("rejects %o", (change) => {
    expect(validateRoundSubmission({ ...valid, ...change })).toBeNull();
  });

  it("rejects non objects", () => {
    expect(validateRoundSubmission(null)).toBeNull();
    expect(validateRoundSubmission([])).toBeNull();
  });

  const row = (sound: RoundStatsRow["sound"], rounds: number, net: number, wins: number, trades: number, up: number, down: number): RoundStatsRow => ({
    experiment_version: "v",
    sound,
    rounds,
    total_net_pnl: net,
    total_drawdown_pct: 10 * rounds,
    total_trades: trades,
    total_wins: wins,
    total_fees: 2 * rounds,
    total_winning_pnl: up,
    total_losing_pnl: down,
  });

  it("pools totals instead of averaging each round's ratios", () => {
    const stats = poolStats([row("on", 2, 100, 3, 10, 300, 200), row("off", 2, 0, 1, 10, 100, 100)]);
    expect(stats).toEqual({ rounds: 4, averageNet: 25, averageDrawdown: 10, averageFees: 2, totalTrades: 20, winRate: 20, profitFactor: 400 / 300 });
  });

  it("handles empty groups, no trades and no losses", () => {
    expect(poolStats([])).toBeNull();
    expect(poolStats([row("on", 1, 0, 0, 0, 0, 0)])).toMatchObject({ winRate: null, profitFactor: null });
    expect(poolStats([row("on", 1, 5, 1, 1, 5, 0)])?.profitFactor).toBeNull();
  });

  it("reports sound settings separately", () => {
    const groups = statsGroups([row("on", 1, 5, 1, 1, 5, 0)]);
    expect(groups.map((g) => g.stats?.rounds ?? 0)).toEqual([1, 1, 0, 0]);
  });
});

describe("bonus periods and dot meters", () => {
  const day = 86_400;
  const start2020 = Date.UTC(2020, 3, 10) / 1000;
  const mk = (n: number, from: number): RawCandle[] =>
    Array.from({ length: n }, (_, i) => {
      const c = 100 + Math.sin(i / 4) * 5;
      return [from + i * day, c - 3, c + 3, c, c, 1];
    });

  it("handles a year that starts inside the history and one still in progress", () => {
    const raw = mk(200, start2020);
    const p = experimentPeriod(raw, 2020)!;
    expect(p.startIndex).toBe(1);
    expect(p.days[0].date).toBe(p.all[1].date);
    expect(p.days.at(-1)!.date).toBe(new Date((start2020 + 199 * day) * 1000).toISOString().slice(0, 10));
    expect(experimentYear(raw, 2020)).toBeNull();
    expect(experimentPeriod(raw, 2030)).toBeNull();
  });

  it("counts dots out of 20 like the prototype", () => {
    expect(dotCount(0, 19)).toBe(0);
    expect(dotCount(-5, 100)).toBe(0);
    expect(dotCount(0.1, 100)).toBe(1);
    expect(dotCount(19, 19)).toBe(20);
    expect(dotCount(50, 19)).toBe(20);
  });

  it("builds the five meters", () => {
    const base: SqueezeBar = { time: 0, date: "", o: 1, h: 1, l: 1, c: 1, ema14: 100, bbL: 90, bbH: 110, kcL: 95, kcH: 105, direction: 1, squeeze: false, release: false, entry: false, prior: 0, age: 6 };
    const m = squeezeMeters(base);
    expect(m.map((x) => x.id)).toEqual(["gap", "compressed", "outside", "chimes", "drums"]);
    expect(m[0]).toMatchObject({ value: "100", dots: 20 });
    expect(m[2]).toMatchObject({ value: "6", dots: 6 });
    expect(m[3]).toMatchObject({ value: "4.0", dots: 8 });
    expect(m[4].dots).toBe(0);
    const squeezed = squeezeMeters({ ...base, squeeze: true, bbL: 96, bbH: 104 });
    expect(squeezed[0].dots).toBe(0);
    expect(squeezed[4].value).toBe("4.0");
  });
});

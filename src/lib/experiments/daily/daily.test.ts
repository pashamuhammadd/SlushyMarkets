import { describe, expect, it } from "vitest";
import { advanceBar, createPaperAccount, leverageReview, marginRisk, queueOrder, setLeverage, type PaperBar } from "../engine";
import type { RawCandle } from "../squeeze";
import { CYCLE_MS, barsFor, cycleOf, nextRefresh, pickWindows } from "./cycle";
import { dailyBars, emaGain, indexBars } from "./indicators";
import { efficiencyNotes, emaNotes, presetNotes, volumeNotes } from "./sound";

const bar = (date: string, o: number, c = o): PaperBar => ({ date, o, c });

describe("Arcade leverage", () => {
  it("doubles exposure and fees for the next entry only", () => {
    let a = setLeverage(createPaperAccount(), 2);
    a = advanceBar(queueOrder(a, 1), bar("d1", 100));
    expect(a.position?.leverage).toBe(2);
    expect(a.position!.quantity * a.position!.entry).toBeCloseTo(4_000, 8);
    expect(a.fees).toBeCloseTo(2, 8);
    expect(setLeverage(a, 9).leverage).toBe(2);
    expect(setLeverage(a, 0).leverage).toBe(1);
  });

  it("closes at the daily close when the margin threshold is reached", () => {
    let a = advanceBar(queueOrder(setLeverage(createPaperAccount(), 2), 1), bar("d1", 100));
    expect(marginRisk(a, 80).ratio).toBeLessThan(1);
    a = advanceBar(a, bar("d2", 100, 40));
    expect(a.position).toBeNull();
    expect(a.trades[0].marginClose).toBe(true);
  });

  it("has no margin rule at 1x", () => {
    let a = advanceBar(queueOrder(createPaperAccount(), 1), bar("d1", 100));
    a = advanceBar(a, bar("d2", 100, 40));
    expect(a.position).not.toBeNull();
  });

  it("compares leveraged trades with the same trades at 1x", () => {
    let a = advanceBar(queueOrder(setLeverage(createPaperAccount(), 2), 1), bar("d1", 100));
    a = advanceBar(a, bar("d2", 110), true);
    const r = leverageReview(a);
    let b = advanceBar(queueOrder(createPaperAccount(), 1), bar("d1", 100));
    b = advanceBar(b, bar("d2", 110), true);
    expect(r.used).toBe(true);
    expect(r.allOneX).toBeCloseTo(b.trades[0].net, 6);
    expect(r.effect).toBeCloseTo(r.actual - r.allOneX, 10);
    expect(leverageReview(b)).toMatchObject({ used: false });
    expect(leverageReview(b).effect).toBeCloseTo(0, 8);
  });
});

const start = Date.UTC(2024, 0, 1) / 1000;
const raw = (n: number, close: (i: number) => number): RawCandle[] =>
  Array.from({ length: n }, (_, i) => {
    const c = close(i);
    const o = i ? close(i - 1) : c;
    return [start + i * 86_400, Math.min(o, c) - 1, Math.max(o, c) + 1, o, c, 100 + (i % 7) * 10];
  });

describe("daily indicators", () => {
  const candles = raw(120, (i) => 100 + 10 * Math.sin(i / 6) + i * 0.2);
  const bars = dailyBars(candles, candles.map((r) => r[5] * 0.6));

  it("matches ER14 and its channel", () => {
    const b = bars[10];
    const c = candles.map((r) => r[4]);
    let path = 0;
    for (let k = b.index - 13; k <= b.index; k += 1) path += Math.abs(c[k] - c[k - 1]);
    expect(b.er).toBeCloseTo(Math.abs(c[b.index] - c[b.index - 14]) / path, 12);
    expect(b.erChannelH - b.erChannelL).toBeCloseTo(path, 10);
    const outside = b.c > b.erChannelH || b.c < b.erChannelL;
    expect(outside).toBe(b.er > 0.5);
  });

  it("uses the prototype's EMA gain curves", () => {
    expect(emaGain(100, 100, 2, 1, 2.5)).toBe(1);
    expect(emaGain(102, 100, 2, 1, 2.5)).toBe(0);
    expect(emaGain(101, 100, 2, 1, 2.5)).toBeCloseTo(0.5 ** 2.5, 12);
    expect(emaGain(103, 100, 2, 3, 1.5)).toBeCloseTo(0.5 ** 1.5, 12);
  });

  it("counts ER and dominance streaks and volume ratio", () => {
    for (let i = 1; i < bars.length; i += 1) {
      const same = bars[i].er > 0.5 === bars[i - 1].er > 0.5;
      expect(bars[i].erAge).toBe(same ? bars[i - 1].erAge + 1 : 1);
    }
    expect(bars[0].buyShare).toBeCloseTo(0.6, 10);
    expect(bars[5].dominanceAge).toBe(6);
    expect(dailyBars(candles)[0].buyShare).toBeNull();
  });

  it("indexes prices to 100 and hides dates without changing ratios", () => {
    const indexed = indexBars(bars.slice(0, 3), bars[0].c);
    expect(indexed[0].c).toBeCloseTo(100, 10);
    expect(indexed[0].date).toBe("Bar 001");
    expect(indexed[1].er).toBe(bars[1].er);
    expect(indexed[1].h / indexed[1].l).toBeCloseTo(bars[1].h / bars[1].l, 12);
  });
});

describe("12-hour cycles", () => {
  it("changes at 00:00 and 12:00 UTC", () => {
    const noon = Date.UTC(2026, 10, 10, 12);
    expect(cycleOf(noon) - cycleOf(noon - 1)).toBe(1);
    expect(nextRefresh(noon - 1)).toBe(noon);
    expect(nextRefresh(noon)).toBe(noon + CYCLE_MS);
  });

  it("picks the same non overlapping windows for everyone in a cycle", () => {
    const lengths = [450, 900];
    const a = pickWindows(4000, lengths)!;
    expect(a).toEqual(pickWindows(4000, lengths));
    expect(a).toHaveLength(4);
    a.forEach((w, r) => expect(w.start + 20 + barsFor(r)).toBeLessThanOrEqual(lengths[w.series]));
    for (let i = 0; i < a.length; i += 1)
      for (let j = i + 1; j < a.length; j += 1)
        if (a[i].series === a[j].series) expect(a[i].start + 20 + barsFor(i) <= a[j].start || a[j].start + 20 + barsFor(j) <= a[i].start).toBe(true);
    expect(pickWindows(4001, lengths)).not.toEqual(a);
    expect(pickWindows(1, [100])).toBeNull();
  });
});

describe("daily sound presets", () => {
  const b = { ...dailyBars(raw(80, (i) => 100 + i))[5] };

  it("efficiency: chimes when efficient, drums when not, faster with age", () => {
    expect(efficiencyNotes({ ...b, er: 0.8, erAge: 1 }, 0.5).every((n) => n.kind === "bell")).toBe(true);
    expect(efficiencyNotes({ ...b, er: 0.3, erAge: 1 }, 0.5).every((n) => n.kind === "drum")).toBe(true);
    expect(efficiencyNotes({ ...b, er: 0.3, erAge: 40 }, 0.5)).toHaveLength(8);
    expect(efficiencyNotes({ ...b, er: 0.3, erAge: 40 }, 0.25)).toHaveLength(4);
  });

  it("volume: dominant side drums faster, channels sound near the edges", () => {
    const buy = volumeNotes({ ...b, buyShare: 0.8, dominanceAge: 5, volumeRatio: 1, c: b.kcH + 1 }, 0.5);
    const buyDrums = buy.filter((n) => n.kind === "drum" && n.hz === 220).length;
    const sellDrums = buy.filter((n) => n.kind === "drum" && n.hz === 110).length;
    expect(buyDrums).toBeGreaterThan(sellDrums);
    expect(buy.some((n) => n.kind === "bell")).toBe(true);
    expect(volumeNotes({ ...b, buyShare: null }, 0.5).every((n) => n.kind !== "drum")).toBe(true);
  });

  it("ema and chart only", () => {
    expect(emaNotes({ ...b, g7: 1, g20: 0, g50: 0 }, 0).map((n) => n.kind)).toEqual(["wood"]);
    expect(emaNotes({ ...b, g7: 1, g20: 0, g50: 0 }, 1)).toEqual([]);
    expect(presetNotes("none", b, 0, 0.5)).toEqual([]);
  });
});

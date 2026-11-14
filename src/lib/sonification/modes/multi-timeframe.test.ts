import { describe, expect, it } from "vitest";
import { aggregateBars, buildMarket, VISIBLE_BARS, type Bar } from "../market";
import {
  analyzeMultiTimeframe,
  lastCompletedClose,
  MTF_SOUND,
  multiTimeframeChart,
  multiTimeframeEvents,
  multiTimeframeMode,
  multiTimeframeReadout,
  PENTATONIC,
  pricePitch,
  SLOW_FACTORS,
  SLOW_PULSE_BARS,
} from "./multi-timeframe";

const flat = (close: number): Bar => ({ open: close, high: close, low: close, close });

describe("Two or three timeframes", () => {
  const series = buildMarket(21, "15m");
  const a = analyzeMultiTimeframe(series);

  it("uses only completed slow candles, never one still forming", () => {
    const bars = Array.from({ length: 8 }, (_, i) => flat(i));
    const slow = aggregateBars(bars, 4);
    expect(lastCompletedClose(slow, 4, 2)).toBeNull();
    expect(lastCompletedClose(slow, 4, 3)).toBe(3);
    expect(lastCompletedClose(slow, 4, 6)).toBe(3);
    expect(lastCompletedClose(slow, 4, 7)).toBe(7);
  });

  it("matches the aggregated closes for every visible bar", () => {
    const start = series.length - VISIBLE_BARS;
    const slow = aggregateBars(series, SLOW_FACTORS.slow);
    a.slowClose.forEach((c, i) => expect(c).toBe(lastCompletedClose(slow, SLOW_FACTORS.slow, start + i)));
    expect(a.bars).toHaveLength(VISIBLE_BARS);
  });

  it("maps price onto the pentatonic scale across the visible range", () => {
    expect(pricePitch(10, 10, 20, 220)).toBe(220);
    expect(pricePitch(20, 10, 20, 220)).toBeCloseTo(880);
    expect(pricePitch(15, 10, 20, 220)).toBeCloseTo(220 * 2 ** (PENTATONIC[5] / 12));
    expect(pricePitch(99, 10, 20, 110)).toBeCloseTo(440);
  });

  it("plays the chart price every bar and the slow layers every 4 bars", () => {
    expect(multiTimeframeEvents("fast", 3, a)).toHaveLength(1);
    expect(multiTimeframeEvents("slow", 0, a)[0].hz).toBe(pricePitch(a.slowClose[0], a.low, a.high, MTF_SOUND.organHz));
    expect(multiTimeframeEvents("slow", 1, a)).toEqual([]);
    expect(multiTimeframeEvents("mid", SLOW_PULSE_BARS, a)).toHaveLength(1);
  });

  it("drums only while ER(5) is below 0.5 and knocks only on MACD crosses", () => {
    a.er.forEach((er, i) => expect(multiTimeframeEvents("choppy", i, a).length).toBe(er < 0.5 ? 1 : 0));
    a.macdCross.forEach((c, i) => expect(multiTimeframeEvents("macd", i, a).length).toBe(c !== 0 ? 1 : 0));
    expect(multiTimeframeChart(a).markers).toHaveLength(a.macdCross.filter((c) => c !== 0).length);
  });

  it("keeps indicators off in the default preset and covers every layer in each preset", () => {
    const ids = multiTimeframeMode.layers.map((l) => l.id).sort();
    for (const p of multiTimeframeMode.presets) expect(Object.keys(p.layers).sort()).toEqual(ids);
    const slushy = multiTimeframeMode.presets[0].layers;
    expect([slushy.fast.mute, slushy.slow.mute, slushy.mid.mute, slushy.choppy.mute, slushy.macd.mute]).toEqual([false, false, true, true, true]);
    expect(multiTimeframeReadout(5, a).map((r) => r.id).sort()).toEqual(ids);
  });
});

import { describe, expect, it } from "vitest";
import { ema } from "@/lib/simulations/moving-averages";
import { averageRange, efficiencyRatio, proximity } from "./indicators";
import { aggregateBars, buildMarket, generateBaseBars, TIMEFRAME_OPTIONS, VISIBLE_BARS, WARMUP_BARS, type Bar } from "./market";
import { applyPulseRate, audibleGain, BAR_SECONDS, hasSolo } from "./mixer";
import {
  analyzeEmaSonar,
  describeEmaRelation,
  EMA_SONAR_LAYERS,
  EMA_SONAR_PRESETS,
  emaLoudness,
  emaSonarEvents,
  emaSonarMode,
} from "./modes/ema-sonar";
import { MODE_LISTINGS } from "./modes";
import type { LayerSettings, SonicEvent } from "./types";
import { VOICE_IDS } from "./voices";

const flat = (price: number, range = 1): Bar => ({ open: price, close: price, high: price + range / 2, low: price - range / 2 });

describe("synthetic market", () => {
  it("is deterministic for a seed and differs between seeds", () => {
    expect(generateBaseBars(7, 50)).toEqual(generateBaseBars(7, 50));
    expect(generateBaseBars(7, 50)).not.toEqual(generateBaseBars(8, 50));
  });

  it("produces valid OHLC bars where each bar opens at the previous close", () => {
    const bars = generateBaseBars(42, 2000);
    bars.forEach((b, i) => {
      expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close));
      expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close));
      for (const v of [b.open, b.high, b.low, b.close]) expect(Number.isFinite(v)).toBe(true);
      if (i > 0) expect(b.open).toBe(bars[i - 1].close);
    });
  });

  it("aggregates complete groups only, with first open, last close, max high and min low", () => {
    const base: Bar[] = [
      { open: 10, high: 12, low: 9, close: 11 },
      { open: 11, high: 15, low: 10, close: 14 },
      { open: 14, high: 14.5, low: 8, close: 9 },
      { open: 9, high: 10, low: 7, close: 8 },
      { open: 8, high: 9, low: 7.5, close: 8.5 },
    ];
    expect(aggregateBars(base, 4)).toEqual([{ open: 10, high: 15, low: 7, close: 8 }]);
    expect(aggregateBars(base, 1)).toEqual(base);
    expect(() => aggregateBars(base, 0)).toThrow();
  });

  it("builds every timeframe with the same length and the same final close", () => {
    const closes = TIMEFRAME_OPTIONS.map((t) => {
      const bars = buildMarket(99, t.id);
      expect(bars).toHaveLength(VISIBLE_BARS + WARMUP_BARS);
      return bars[bars.length - 1].close;
    });
    expect(new Set(closes).size).toBe(1);
  });
});

describe("indicators", () => {
  it("smooths the bar range like the prototype ATR(7)", () => {
    const bars = [flat(100, 1), flat(100, 1), flat(100, 8)];
    const atr = averageRange(bars, 7);
    expect(atr[0]).toBe(1);
    expect(atr[1]).toBe(1);
    expect(atr[2]).toBeCloseTo(1 + 7 / 7, 10);
  });

  it("computes the efficiency ratio over N changes", () => {
    expect(efficiencyRatio([1, 2, 3, 4], 3)).toEqual([null, null, null, 1]);
    // up 2, down 1, up 2: net 3 over a path of 5
    expect(efficiencyRatio([0, 2, 1, 3], 3)[3]).toBeCloseTo(0.6, 10);
    expect(efficiencyRatio([5, 5, 5, 5], 3)[3]).toBe(0);
    for (const v of efficiencyRatio(generateBaseBars(3, 300).map((b) => b.close), 7)) {
      if (v !== null) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("maps distance to loudness: full on the line, silent at the fade distance", () => {
    expect(proximity(0, 2, 3, 1.5)).toBe(1);
    expect(proximity(6, 2, 3, 1.5)).toBe(0);
    expect(proximity(-9, 2, 3, 1.5)).toBe(0);
    expect(proximity(3, 2, 3, 1)).toBeCloseTo(0.5, 10);
    expect(proximity(1, 0, 3, 1)).toBe(0);
    expect(proximity(Number.NaN, 1, 3, 1)).toBe(0);
  });
});

describe("EMA Sonar", () => {
  const analysis = analyzeEmaSonar(buildMarket(20261108, "15m"));

  it("keeps Slushy's prototype parameters", () => {
    expect(EMA_SONAR_LAYERS.map((l) => [l.period, l.hz, l.fadeAtr, l.curve])).toEqual([
      [7, 495, 2, 2.5],
      [20, 330, 3, 1.5],
      [50, 165, 3, 1.5],
    ]);
    expect(EMA_SONAR_PRESETS[0].layers).toMatchObject({
      ema7: { voice: "tuned-wood", rate: 1 },
      ema20: { voice: "organ", rate: 2 },
      ema50: { voice: "organ", rate: 4 },
    });
  });

  it("returns exactly the visible bars with EMAs taken from the full series", () => {
    const series = buildMarket(20261108, "15m");
    expect(analysis.bars).toHaveLength(VISIBLE_BARS);
    expect(analysis.atr).toHaveLength(VISIBLE_BARS);
    const full = ema(series.map((b) => b.close), 50);
    expect(analysis.emas.ema50[0]).toBe(full[WARMUP_BARS]);
    expect(analysis.bars[VISIBLE_BARS - 1]).toEqual(series[series.length - 1]);
  });

  it("produces only finite, non negative, in range notes inside each bar", () => {
    for (const layer of EMA_SONAR_LAYERS) {
      for (let i = 0; i < VISIBLE_BARS; i += 1) {
        const loud = emaLoudness(layer.id, i, analysis);
        expect(loud).toBeGreaterThanOrEqual(0);
        expect(loud).toBeLessThanOrEqual(1);
        for (const e of emaSonarEvents(layer.id, i, analysis)) {
          expect(e.amp).toBeGreaterThan(0);
          expect(e.offsetSec + e.durationSec).toBeLessThan(BAR_SECONDS);
          expect(e.hz).toBe(layer.hz);
        }
      }
    }
  });

  it("is silent when price is far from a line and loudest on it", () => {
    const bars = Array.from({ length: 60 }, () => flat(100));
    const far = { bars, atr: bars.map(() => 1), emas: { ema7: bars.map(() => 110), ema20: bars.map(() => 100), ema50: bars.map(() => 102.9) } };
    expect(emaSonarEvents("ema7", 0, far)).toEqual([]);
    expect(emaSonarEvents("ema20", 0, far)[0].amp).toBe(1);
    expect(emaSonarEvents("ema50", 0, far)[0].amp).toBeGreaterThan(0);
    expect(emaSonarEvents("ema50", 0, far)[0].amp).toBeLessThan(0.01);
  });

  it("describes crossings, approaching and moving away", () => {
    const bars = [flat(98), flat(99), flat(101), flat(104)];
    const fake = { bars, atr: bars.map(() => 1), emas: { ema7: bars.map(() => 100), ema20: bars.map(() => 100), ema50: bars.map(() => 100) } };
    expect(describeEmaRelation("ema20", 1, fake)).toMatchObject({ side: "below", motion: "approaching" });
    expect(describeEmaRelation("ema20", 2, fake)).toMatchObject({ side: "above", motion: "crossed" });
    expect(describeEmaRelation("ema20", 3, fake)).toMatchObject({ side: "above", motion: "moving away" });
    expect(describeEmaRelation("ema20", 3, fake).distanceAtr).toBeCloseTo(4, 10);
  });

  it("has presets for every layer with valid voices", () => {
    for (const preset of emaSonarMode.presets) {
      expect(Object.keys(preset.layers).sort()).toEqual(EMA_SONAR_LAYERS.map((l) => l.id).sort());
      for (const s of Object.values(preset.layers)) expect(VOICE_IDS).toContain(s.voice);
    }
  });

  it("lists exactly one live mode, the one that is implemented", () => {
    expect(MODE_LISTINGS.filter((m) => m.status === "live").map((m) => m.id)).toEqual([emaSonarMode.id]);
  });
});

describe("mixer", () => {
  const note: SonicEvent = { offsetSec: 0.1, hz: 330, amp: 0.5, durationSec: 0.17 };

  it("applies pulse speeds: 1 skips odd bars, 4 doubles notes half a bar later", () => {
    expect(applyPulseRate([note], 1, 3)).toEqual([]);
    expect(applyPulseRate([note], 1, 4)).toEqual([note]);
    expect(applyPulseRate([note], 2, 3)).toEqual([note]);
    const fast = applyPulseRate([note], 4, 3);
    expect(fast).toHaveLength(2);
    expect(fast[1]).toEqual({ ...note, offsetSec: 0.1 + BAR_SECONDS / 2, durationSec: 0.12 });
    expect(applyPulseRate([{ ...note, amp: 0 }], 2, 0)).toEqual([]);
  });

  it("resolves mute and solo", () => {
    const layer = (extra: Partial<LayerSettings>): LayerSettings => ({ voice: "organ", rate: 2, gain: 0.6, mute: false, solo: false, ...extra });
    expect(audibleGain(layer({}), false)).toBe(0.6);
    expect(audibleGain(layer({ mute: true }), false)).toBe(0);
    expect(audibleGain(layer({}), true)).toBe(0);
    expect(audibleGain(layer({ solo: true }), true)).toBe(0.6);
    expect(audibleGain(layer({ solo: true, mute: true }), true)).toBe(0);
    expect(audibleGain(layer({ gain: 3 }), false)).toBe(1);
    expect(hasSolo({ a: layer({}), b: layer({ solo: true }) })).toBe(true);
  });
});

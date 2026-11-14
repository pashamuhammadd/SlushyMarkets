import { describe, expect, it } from "vitest";
import { ema } from "@/lib/simulations/moving-averages";
import { averageRange, efficiencyRatio, proximity } from "./indicators";
import { aggregateBars, buildMarket, generateBaseBars, TIMEFRAME_OPTIONS, VISIBLE_BARS, WARMUP_BARS, type Bar } from "./market";
import { applyPulseRate, audibleGain, BAR_SECONDS, hasSolo, notesForBar } from "./mixer";
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
import { analyzeErDrums, ER_DRUM, erDrumsChart, erDrumsEvents, erDrumsMode, erDrumsReadout, lowEfficiencyZones } from "./modes/er-drums";
import {
  analyzeSonarBands,
  BAND_ATR_MULTIPLIER,
  bandLoudness,
  bandState,
  midlineHz,
  OUTSIDE_LOUDNESS,
  sonarBandsChart,
  sonarBandsEvents,
  sonarBandsMode,
  sonarBandsReadout,
  type SonarBandsAnalysis,
} from "./modes/sonar-bands";
import { resolveOptions, type LayerDefinition, type LayerSettings, type SonicEvent } from "./types";
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

  it("lists exactly the implemented modes as live, each with a page", () => {
    const live = MODE_LISTINGS.filter((m) => m.status === "live");
    expect(live.map((m) => m.id)).toEqual([emaSonarMode.id, sonarBandsMode.id, erDrumsMode.id, "sonar-volume", "multi-timeframe", "fractals"]);
    expect(live.every((m) => m.href)).toBe(true);
  });

  it("describes every layer in the readout and chart", () => {
    const items = emaSonarMode.readout(10, analysis, {});
    expect(items.map((i) => i.id)).toEqual(["ema7", "ema20", "ema50"]);
    expect(emaSonarMode.chart(analysis).lines).toHaveLength(3);
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

/** Small hand made channel: midline 100, ATR 1, bands at 98.3 and 101.7. */
function fakeBands(closes: number[]): SonarBandsAnalysis {
  const lower = closes.map(() => 100 - BAND_ATR_MULTIPLIER);
  const upper = closes.map(() => 100 + BAND_ATR_MULTIPLIER);
  const state = closes.map((c, i) => bandState(c, lower[i], upper[i]));
  const prev = (i: number) => (i > 0 ? i - 1 : i);
  return {
    bars: closes.map((c) => flat(c)),
    atr: closes.map(() => 1),
    mid: closes.map(() => 100),
    upper,
    lower,
    state,
    breakout: state.map((v, i) => (v !== 0 && v !== state[prev(i)] ? v : 0)),
    returned: state.map((v, i) => (v === 0 && state[prev(i)] !== 0 ? state[prev(i)] : 0)),
    motion: {
      lower: closes.map((c, i) => Math.abs(c - lower[i]) - Math.abs(closes[prev(i)] - lower[prev(i)])),
      upper: closes.map((c, i) => Math.abs(c - upper[i]) - Math.abs(closes[prev(i)] - upper[prev(i)])),
    },
    low: Math.min(...lower) - 1,
    high: Math.max(...upper) + 1,
  };
}

describe("Sonar Bands", () => {
  const series = buildMarket(20261108, "15m");
  const analysis = analyzeSonarBands(series);

  it("builds the channel as EMA(10) plus or minus 1.7 x ATR(7) from the full series", () => {
    const mid = ema(series.map((b) => b.close), 10);
    const atr = averageRange(series, 7);
    const i = series.length - 1;
    expect(analysis.mid[VISIBLE_BARS - 1]).toBe(mid[i]);
    expect(analysis.upper[VISIBLE_BARS - 1]).toBeCloseTo((mid[i] as number) + 1.7 * atr[i], 10);
    expect(analysis.lower[VISIBLE_BARS - 1]).toBeCloseTo((mid[i] as number) - 1.7 * atr[i], 10);
    expect(analysis.bars).toHaveLength(VISIBLE_BARS);
  });

  it("detects breakouts and returns only on the first bar of each change", () => {
    const a = analyzeSonarBands(series);
    a.state.forEach((s, i) => {
      if (a.breakout[i] !== 0) expect(a.breakout[i]).toBe(s);
      if (a.returned[i] !== 0) expect(s).toBe(0);
      if (i > 0 && s === a.state[i - 1]) {
        expect(a.breakout[i]).toBe(0);
        expect(a.returned[i]).toBe(0);
      }
    });
  });

  it("plays the prototype loudness: squared fade inside, extra loud outside", () => {
    const a = fakeBands([100, 101.2, 102, 101]);
    expect(bandLoudness("upper", 0, a)).toBe(0);
    expect(bandLoudness("upper", 1, a)).toBeCloseTo(0.5 ** 2, 10);
    expect(bandLoudness("upper", 2, a)).toBe(OUTSIDE_LOUDNESS);
    expect(bandLoudness("lower", 2, a)).toBe(0);
  });

  it("uses rising pairs when approaching and falling pairs when moving away", () => {
    const a = fakeBands([100.9, 101.4, 100.9]);
    const approach = sonarBandsEvents("upper", 1, a, { motion: true });
    expect(approach).toHaveLength(2);
    expect(approach[1].hz).toBeGreaterThan(approach[0].hz);
    const away = sonarBandsEvents("upper", 2, a, { motion: true });
    expect(away[1].hz).toBeLessThan(away[0].hz);
    expect(sonarBandsEvents("upper", 1, a, { motion: false })).toHaveLength(1);
  });

  it("chimes on breakouts and knocks on returns, in the right direction", () => {
    const a = fakeBands([100, 102, 102.5, 100, 98, 100]);
    expect(sonarBandsEvents("breakout", 1, a, {}).map((e) => e.hz)).toEqual([880, 1174.66]);
    expect(sonarBandsEvents("breakout", 2, a, {})).toEqual([]);
    expect(sonarBandsEvents("return", 3, a, {})).toHaveLength(2);
    expect(sonarBandsEvents("breakout", 4, a, {}).map((e) => e.hz)).toEqual([660, 440]);
    expect(sonarBandsEvents("return", 5, a, {})).toHaveLength(2);
    expect(sonarBandsChart(a).markers.map((m) => m.kind)).toEqual(["up", "return", "down", "return"]);
    expect(sonarBandsReadout(1, a)[2].text).toMatch(/Breakout above/);
  });

  it("keeps the midline pitch inside two octaves", () => {
    expect(midlineHz(0, 0, 10)).toBe(220);
    expect(midlineHz(10, 0, 10)).toBe(880);
    expect(midlineHz(99, 0, 10)).toBe(880);
    expect(midlineHz(5, 5, 5)).toBeCloseTo(440, 10);
  });

  it("produces finite notes for every layer on generated charts", () => {
    for (const seed of [1, 2, 3]) {
      const a = analyzeSonarBands(buildMarket(seed, "1h"));
      for (const layer of sonarBandsMode.layers) {
        for (let i = 0; i < VISIBLE_BARS; i += 1) {
          for (const e of sonarBandsEvents(layer.id, i, a, { motion: true })) {
            expect(Number.isFinite(e.hz) && e.hz > 0).toBe(true);
            expect(e.amp).toBeGreaterThanOrEqual(0);
            expect(e.amp).toBeLessThanOrEqual(OUTSIDE_LOUDNESS);
            expect(e.offsetSec + e.durationSec).toBeLessThan(BAR_SECONDS);
          }
        }
      }
    }
    expect(() => sonarBandsEvents("nope", 0, analysis, {})).toThrow();
  });

  it("has presets for every layer and sets the motion switch", () => {
    for (const preset of sonarBandsMode.presets) {
      expect(Object.keys(preset.layers).sort()).toEqual(sonarBandsMode.layers.map((l) => l.id).sort());
      expect(resolveOptions(sonarBandsMode.toggles, preset)).toHaveProperty("motion");
    }
    expect(resolveOptions(sonarBandsMode.toggles, sonarBandsMode.presets[1])).toEqual({ motion: false });
    expect(resolveOptions(sonarBandsMode.toggles)).toEqual({ motion: true });
  });
});

describe("event layers", () => {
  const note: SonicEvent = { offsetSec: 0, hz: 880, amp: 1, durationSec: 0.16 };
  const slow: LayerSettings = { voice: "chime", rate: 1, gain: 0.7, mute: false, solo: false };
  const layer = (kind: LayerDefinition["kind"]): LayerDefinition => ({ id: "x", label: "X", color: "#fff", describes: "", detail: "", previewHz: 880, kind });

  it("never drops an event because of a slow pulse speed", () => {
    expect(notesForBar(layer("event"), slow, [note], 3)).toEqual([note]);
    expect(notesForBar(layer("continuous"), slow, [note], 3)).toEqual([]);
    expect(notesForBar(layer("event"), { ...slow, rate: 4 }, [note], 2)).toEqual([note]);
  });
});

describe("ER drums", () => {
  const series = buildMarket(20261108, "15m");
  const analysis = analyzeErDrums(series);

  it("matches the worked examples on the page", () => {
    const fromMoves = (moves: number[]) => moves.reduce<number[]>((acc, m) => [...acc, acc[acc.length - 1] + m], [100]);
    expect(efficiencyRatio(fromMoves([1, 1, 1, 1, 1, 1, 1]), 7)[7]).toBe(1);
    expect(efficiencyRatio(fromMoves([2, -1, 2, -1, 2, -1, 2]), 7)[7]).toBeCloseTo(5 / 11, 10);
    expect(efficiencyRatio(fromMoves([1, -1, 1, -1, 1, -1, 1]), 7)[7]).toBeCloseTo(1 / 7, 10);
  });

  it("computes ER(7) from the full series for every visible bar", () => {
    const full = efficiencyRatio(series.map((b) => b.close), 7);
    expect(analysis.er).toHaveLength(VISIBLE_BARS);
    expect(analysis.er[0]).toBe(full[WARMUP_BARS]);
    expect(analysis.er[VISIBLE_BARS - 1]).toBe(full[full.length - 1]);
  });

  it("plays three drum hits only while ER(7) is below 0.5", () => {
    let played = 0;
    let rested = 0;
    analysis.er.forEach((er, i) => {
      const notes = erDrumsEvents("erDrums", i, analysis, {});
      if (er < 0.5) {
        played += 1;
        expect(notes.map((n) => n.offsetSec)).toEqual([0, 0.15, 0.3]);
        expect(notes.every((n) => n.hz === ER_DRUM.hz && n.offsetSec + n.durationSec < BAR_SECONDS)).toBe(true);
      } else {
        rested += 1;
        expect(notes).toEqual([]);
      }
    });
    expect(played).toBeGreaterThan(0);
    expect(rested).toBeGreaterThan(0);
  });

  it("reuses the Sonar Bands channel with motion off by default", () => {
    expect(erDrumsEvents("upper", 5, analysis, {})).toEqual(sonarBandsEvents("upper", 5, analysis, { motion: false }));
    expect(resolveOptions(erDrumsMode.toggles)).toEqual({ motion: false });
    expect(erDrumsMode.layers.map((l) => l.id)).toEqual(["erDrums", ...sonarBandsMode.layers.map((l) => l.id)]);
  });

  it("shades each run of low efficiency bars once", () => {
    expect(lowEfficiencyZones([0.6, 0.3, 0.2, 0.7, 0.4]).map(({ from, to }) => [from, to])).toEqual([
      [1, 2],
      [4, 4],
    ]);
    expect(lowEfficiencyZones([0.9, 0.5])).toEqual([]);
    const zones = erDrumsChart(analysis).zones ?? [];
    const shaded = zones.reduce((n, z) => n + z.to - z.from + 1, 0);
    expect(shaded).toBe(analysis.er.filter((v) => v < 0.5).length);
  });

  it("explains the ER value in the readout", () => {
    const item = erDrumsReadout(10, analysis).find((x) => x.id === "erDrums");
    expect(item?.text).toContain(analysis.er[10].toFixed(2));
  });

  it("has presets for every layer", () => {
    for (const preset of erDrumsMode.presets) {
      expect(Object.keys(preset.layers).sort()).toEqual(erDrumsMode.layers.map((l) => l.id).sort());
    }
  });
});

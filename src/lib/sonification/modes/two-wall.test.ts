import { describe, expect, it } from "vitest";
import { buildMarket, type Bar } from "../market";
import { analyzeTwoWall, rangePosition, twoWallChart, twoWallEvents, twoWallMode, twoWallReadout, WALL_SOUND, wallLoudness } from "./two-wall";
import { annotateSwings } from "./fractals";
import { hitRms, hitScale, VOICES } from "../voices";

describe("Two-wall sonar", () => {
  const series = buildMarket(15, "15m");
  const a = analyzeTwoWall(series);

  it("crossfades the two tones like the concept video", () => {
    expect(wallLoudness("low", 0)).toBe(1);
    expect(wallLoudness("high", 0)).toBeCloseTo(WALL_SOUND.floor);
    expect(wallLoudness("low", 0.5)).toBeCloseTo(0.57);
    expect(wallLoudness("high", 0.5)).toBeCloseTo(0.57);
    expect(rangePosition(15, 10, 20)).toBe(0.5);
    expect(rangePosition(25, 10, 20)).toBe(1);
    expect(rangePosition(5, 10, 20)).toBe(0);
  });

  it("plays the low tone at the bar start and the high tone 0.19 s later, every bar", () => {
    for (let i = 0; i < a.bars.length; i += 1) {
      const [low] = twoWallEvents("low", i, a);
      const [high] = twoWallEvents("high", i, a);
      expect([low.offsetSec, low.hz, high.offsetSec, high.hz]).toEqual([0, 210, 0.19, 420]);
      expect(low.amp + high.amp).toBeCloseTo(WALL_SOUND.amp * (1 + WALL_SOUND.floor));
    }
  });

  it("moves walls only on bars where a swing is confirmed, never earlier", () => {
    const start = series.length - a.bars.length;
    const { events } = annotateSwings(series);
    for (let i = 1; i < a.bars.length; i += 1) {
      const confirmed = events[start + i].some((e) => e.stage === "confirm");
      if (a.upper[i] !== a.upper[i - 1] || a.lower[i] !== a.lower[i - 1]) expect(confirmed).toBe(true);
      if (a.moved[i]) expect(confirmed).toBe(true);
    }
    expect(a.lower.every((l, i) => l <= a.upper[i])).toBe(true);
  });

  it("chimes once when a close goes beyond a wall", () => {
    const closes = [10, 10.1, 9.9, 10, 10.1, 15, 15.5, 16];
    const bars: Bar[] = closes.map((c) => ({ open: c, high: c + 0.1, low: c - 0.1, close: c }));
    const b = analyzeTwoWall(bars);
    expect(b.breakout).toEqual([0, 0, 0, 0, 0, 1, 0, 0]);
    expect(twoWallEvents("breakout", 5, b).map((e) => e.hz)).toEqual([880, 1174.66]);
    expect(twoWallEvents("breakout", 6, b)).toEqual([]);
    expect(b.position[5]).toBe(1);
  });

  it("uses a wall wood voice with the measured shape, and full presets", () => {
    const v = VOICES["wall-wood"];
    expect(hitRms(v.hit!, v.partials, 210) * hitScale(v, 210)).toBeCloseTo(0.048, 6);
    const ids = twoWallMode.layers.map((l) => l.id).sort();
    for (const p of twoWallMode.presets) expect(Object.keys(p.layers).sort()).toEqual(ids);
    expect(twoWallReadout(4, a).map((r) => r.id).sort()).toEqual(ids);
    expect(twoWallChart(a).lines.every((l) => l.step)).toBe(true);
  });
});

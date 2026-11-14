import { describe, expect, it } from "vitest";
import { buildMarket } from "../market";
import { resolveOptions } from "../types";
import { sonarBandsEvents, sonarBandsMode } from "./sonar-bands";
import { flowSeed, simulateFlow, sonarVolumeChart, sonarVolumeEvents, sonarVolumeMode, sonarVolumeReadout, volumeEvents, VOLUME_DRUM } from "./sonar-volume";

describe("Sonar Channels and volume", () => {
  const series = buildMarket(7, "15m");
  const a = sonarVolumeMode.analyze(series);

  it("simulates volume like the prototype: 1 to 5 units, buyer share 0.08 to 0.92", () => {
    const flow = simulateFlow(500, 42);
    for (const f of flow) {
      expect(f.units).toBeGreaterThanOrEqual(1);
      expect(f.units).toBeLessThanOrEqual(5);
      expect(f.buyShare).toBeGreaterThanOrEqual(0.08);
      expect(f.buyShare).toBeLessThanOrEqual(0.92);
      expect(f.buyerHits).toBe(Math.round(f.units * f.buyShare));
      expect(f.buyerHits + f.sellerHits).toBe(f.units);
    }
    expect(new Set(flow.map((f) => f.units)).size).toBe(5);
  });

  it("is deterministic per chart and changes with the chart", () => {
    expect(sonarVolumeMode.analyze(series).flow).toEqual(a.flow);
    expect(flowSeed(buildMarket(8, "15m"))).not.toBe(flowSeed(series));
    expect(a.flow).toHaveLength(a.bars.length);
  });

  it("plays buyers first at 220 Hz, then sellers at 110 Hz, inside the first quarter second", () => {
    const f = { units: 4, buyShare: 0.6, buyerHits: 2, sellerHits: 2 };
    const buy = volumeEvents("buyer", f);
    const sell = volumeEvents("seller", f);
    expect(buy.map((e) => e.offsetSec)).toEqual([0.02, 0.02 + 0.22 / 4]);
    expect(sell.map((e) => e.offsetSec)).toEqual([0.02 + (2 * 0.22) / 4, 0.02 + (3 * 0.22) / 4]);
    expect(buy.every((e) => e.hz === VOLUME_DRUM.buyerHz && e.amp === 1.1)).toBe(true);
    expect(sell.every((e) => e.hz === VOLUME_DRUM.sellerHz)).toBe(true);
    expect(volumeEvents("seller", { units: 3, buyShare: 0.9, buyerHits: 3, sellerHits: 0 })).toEqual([]);
  });

  it("reuses the Sonar Bands channel with motion off and the midline muted", () => {
    expect(sonarVolumeEvents("upper", 5, a, {})).toEqual(sonarBandsEvents("upper", 5, a, { motion: false }));
    expect(resolveOptions(sonarVolumeMode.toggles)).toEqual({ motion: false });
    expect(sonarVolumeMode.layers.map((l) => l.id)).toEqual(["buyerVolume", "sellerVolume", ...sonarBandsMode.layers.map((l) => l.id)]);
    for (const p of sonarVolumeMode.presets) {
      expect(Object.keys(p.layers).sort()).toEqual(sonarVolumeMode.layers.map((l) => l.id).sort());
      expect(p.layers.midline.mute).toBe(true);
    }
  });

  it("labels the volume as simulated in the chart and readout", () => {
    const chart = sonarVolumeChart(a);
    expect(chart.volume?.label).toMatch(/Simulated/);
    expect(chart.volume?.buyer).toHaveLength(a.bars.length);
    const items = sonarVolumeReadout(3, a);
    expect(items[0].label).toMatch(/simulated/);
    expect(items[0].text).toContain(`${a.flow[3].buyerHits} of ${a.flow[3].units}`);
  });
});

import { describe, expect, it } from "vitest";
import { buildMarket } from "./market";
import { duckLevel, PLAYGROUND_OUTPUT_BOOST } from "./mixer";
import { emaSonarMode } from "./modes/ema-sonar";
import { erDrumsMode } from "./modes/er-drums";
import { bandLoudness, sonarBandsMode } from "./modes/sonar-bands";
import { sonarVolumeMode, VOLUME_DUCKING } from "./modes/sonar-volume";
import type { LayerSettings } from "./types";
import { hitRms, hitScale, ROUNDED_WOOD, VOICES } from "./voices";

const db = (gain: number) => 20 * Math.log10(gain);
const layer = (extra: Partial<LayerSettings> = {}): LayerSettings => ({ voice: "speaker-organ", rate: 2, gain: 0.7, mute: false, solo: false, ...extra });

describe("Speaker mix from Slushy's comparison", () => {
  it("boosts the playground output 3.5 times", () => {
    expect(PLAYGROUND_OUTPUT_BOOST).toBe(3.5);
  });

  it("gives the speaker organ stronger harmonics but keeps the original organ", () => {
    expect(VOICES["speaker-organ"].partials).toEqual([[1, 0.8], [2, 0.55], [3, 0.35], [4, 0.2]]);
    expect(VOICES.organ.partials).toEqual([[1, 1], [2, 0.3], [3, 0.15]]);
  });

  it("normalizes a rounded wood hit to 0.048 RMS at 1.8 times the source pitch", () => {
    const voice = VOICES["rounded-wood"];
    for (const hz of [110, 220]) {
      expect(hitRms(ROUNDED_WOOD, voice.partials, hz) * hitScale(voice, hz)).toBeCloseTo(0.048, 6);
    }
    expect(110 * ROUNDED_WOOD.pitchRatio).toBeCloseTo(198);
    expect(220 * ROUNDED_WOOD.pitchRatio).toBeCloseTo(396);
    expect(ROUNDED_WOOD.lengthSec).toBe(0.115);
  });

  it("ducks the volume drums 6, 8.5 and 12 dB for silent, half and full sonar", () => {
    const fixed = (s: number) => ({ ...VOLUME_DUCKING, strength: () => s });
    const layers = { lower: layer(), upper: layer() };
    expect(db(duckLevel(fixed(0), 0, null as never, layers))).toBeCloseTo(-6.02, 1);
    expect(db(duckLevel(fixed(0.5), 0, null as never, layers))).toBeCloseTo(-8.52, 1);
    expect(db(duckLevel(fixed(1), 0, null as never, layers))).toBeCloseTo(-12.04, 1);
    expect(duckLevel(fixed(1.35), 0, null as never, layers)).toBe(0.25);
  });

  it("only lets audible channel organs duck the drums", () => {
    const loud = { ...VOLUME_DUCKING, strength: () => 1 };
    expect(duckLevel(loud, 0, null as never, { lower: layer({ mute: true }), upper: layer({ mute: true }) })).toBe(0.5);
    expect(duckLevel(loud, 0, null as never, { lower: layer(), upper: layer(), buyerVolume: layer({ solo: true }) })).toBe(0.5);
    expect(duckLevel(loud, 0, null as never, { lower: layer({ solo: true }), upper: layer() })).toBe(0.25);
  });

  it("uses the channel loudness of the chart itself", () => {
    const a = sonarVolumeMode.analyze(buildMarket(9, "15m"));
    const layers = sonarVolumeMode.presets[0].layers;
    for (let i = 0; i < 60; i += 1) {
      const s = Math.min(1, Math.max(bandLoudness("lower", i, a), bandLoudness("upper", i, a)));
      expect(duckLevel(VOLUME_DUCKING, i, a, layers)).toBeCloseTo(0.5 * (1 - 0.5 * s));
    }
  });

  it("uses the new voices in the default mixes, with ER drums unducked", () => {
    const slushy = sonarVolumeMode.presets[0].layers;
    expect([slushy.buyerVolume.voice, slushy.sellerVolume.voice]).toEqual(["rounded-wood", "rounded-wood"]);
    expect([slushy.lower.voice, slushy.upper.voice]).toEqual(["speaker-organ", "speaker-organ"]);
    for (const mode of [sonarBandsMode, erDrumsMode, emaSonarMode, sonarVolumeMode]) {
      for (const p of mode.presets) for (const s of Object.values(p.layers)) expect(s.voice).not.toBe("organ");
    }
    // Rounded wood carries far more energy above 300 Hz than the old 110 Hz drum, so it can be heard on phones.
    expect(erDrumsMode.presets[0].layers.erDrums.voice).toBe("rounded-wood");
    expect(erDrumsMode.ducking).toBeUndefined();
  });
});

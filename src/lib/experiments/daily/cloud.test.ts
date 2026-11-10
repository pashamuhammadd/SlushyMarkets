import { describe, expect, it } from "vitest";
import { adaptiveCloud, cloudPlan, cloudState } from "./cloud";
import closes from "./fixtures/synthetic_closes.json";
import expectedCloud from "./fixtures/expected_cloud.json";
import expectedSound from "./fixtures/expected_sound.json";

type Row = { i: number; c: number; cloudH: number | null; cloudL: number | null; cloudCenter: number | null; cloudAnchor: number | null; cloudEr: number | null; cloudVote: number; state: string };

describe("Adaptive Cloud v1.0 matches Slushy's handoff fixtures", () => {
  const cloud = adaptiveCloud(closes);
  const rows = expectedCloud as Row[];

  it("matches every expected row to 1e-10", () => {
    expect(cloud).toHaveLength(rows.length);
    rows.forEach((row, i) => {
      const got = cloud[i];
      if (row.cloudH === null) {
        expect(got, `row ${i}`).toBeNull();
        return;
      }
      for (const key of ["cloudH", "cloudL", "cloudCenter", "cloudAnchor", "cloudEr"] as const) expect(Math.abs(got![key] - (row[key] as number)), `${key} ${i}`).toBeLessThan(1e-10);
      expect(got!.cloudVote).toBe(row.cloudVote);
      expect(cloudState({ c: closes[i], cloudL: got!.cloudL, cloudH: got!.cloudH })).toBe(row.state);
    });
  });

  it("starts at index 101 and never uses future candles", () => {
    expect(cloud[100]).toBeNull();
    expect(cloud[101]).not.toBeNull();
    expect(adaptiveCloud(closes.slice(0, 140))).toEqual(cloud.slice(0, 140));
  });

  it("is scale invariant", () => {
    const scaled = adaptiveCloud(closes.map((c) => c * 10));
    cloud.forEach((p, i) => {
      if (p) expect(Math.abs(scaled[i]!.cloudH / 10 - p.cloudH)).toBeLessThan(1e-9);
    });
  });

  it("plays the expected states and pitches", () => {
    for (const x of expectedSound as Array<{ name: string; bar: { c: number; cloudL: number | null; cloudH: number | null }; i: number; state: string; notes: number[] }>) {
      const got = cloudPlan(x.bar, x.i);
      expect(got.state, x.name).toBe(x.state);
      expect(got.notes).toHaveLength(x.notes.length);
      got.notes.forEach((n, j) => expect(Math.abs(n - x.notes[j])).toBeLessThan(1e-9));
    }
  });
});

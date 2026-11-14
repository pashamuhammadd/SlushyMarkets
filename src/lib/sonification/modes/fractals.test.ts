import { describe, expect, it } from "vitest";
import { buildMarket, VISIBLE_BARS, type Bar } from "../market";
import { analyzeFractals, annotateSwings, fractalsChart, fractalsEvents, fractalsMode, fractalsReadout } from "./fractals";

const bar = (high: number, low: number): Bar => ({ open: (high + low) / 2, close: (high + low) / 2, high, low });

describe("Fractals: confirm or reject", () => {
  it("finds a candidate high above the two previous highs and confirms it two bars later", () => {
    const bars = [bar(10, 9), bar(11, 9.5), bar(13, 10), bar(12, 10.5), bar(12.5, 10.6)];
    const { events } = annotateSwings(bars);
    expect(events[2]).toContainEqual({ stage: "candidate", direction: 1, pivot: 2, level: 13 });
    expect(events[3].filter((e) => e.direction === 1)).toEqual([]);
    expect(events[4]).toContainEqual({ stage: "confirm", direction: 1, pivot: 2, level: 13 });
  });

  it("rejects a candidate high when a later bar reaches its level, even an exact match", () => {
    const bars = [bar(10, 9), bar(11, 9.5), bar(13, 10), bar(13, 10.5)];
    const { events } = annotateSwings(bars);
    expect(events[3]).toContainEqual({ stage: "reject", direction: 1, pivot: 2, level: 13 });
    expect(events[3].some((e) => e.stage === "candidate" && e.direction === 1)).toBe(false);
  });

  it("handles lows the mirror way and lists the fate of old candidates before new ones", () => {
    const bars = [bar(10, 9), bar(10, 8.5), bar(10, 8), bar(10, 7.5)];
    const { events } = annotateSwings(bars);
    expect(events[2]).toEqual([{ stage: "candidate", direction: -1, pivot: 2, level: 8 }]);
    expect(events[3].map((e) => e.stage)).toEqual(["reject", "candidate"]);
  });

  it("every candidate ends exactly once, confirmed or rejected, unless still waiting at the end", () => {
    const series = buildMarket(11, "1h");
    const { events, pending } = annotateSwings(series);
    const flat = events.flat();
    const candidates = flat.filter((e) => e.stage === "candidate");
    const ended = flat.filter((e) => e.stage !== "candidate");
    expect(ended.length + pending.at(-1)!.length).toBe(candidates.length);
    for (const e of flat.filter((e) => e.stage === "confirm")) {
      expect(flat.filter((x) => x.pivot === e.pivot && x.direction === e.direction && x.stage !== "candidate")).toHaveLength(1);
    }
  });

  it("plays the prototype sounds", () => {
    const a = analyzeFractals(buildMarket(5, "15m"));
    const i = a.events.findIndex((list) => list.some((e) => e.stage === "confirm" && e.direction === 1));
    const j = a.events.findIndex((list) => list.some((e) => e.stage === "confirm" && e.direction === -1));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(j).toBeGreaterThanOrEqual(0);
    expect(fractalsEvents("confirm", i, a).slice(0, 2).map((e) => [e.offsetSec, e.hz])).toEqual([[0, 600], [0.12, 800]]);
    const low = a.events[j].filter((e) => e.stage === "confirm");
    const lowNotes = fractalsEvents("confirm", j, a);
    expect(lowNotes).toHaveLength(low.length * 2);
    if (low[0].direction === -1) expect(lowNotes.slice(0, 2).map((e) => e.hz)).toEqual([440, 330]);
    const r = a.events.findIndex((list) => list.some((e) => e.stage === "reject"));
    expect(fractalsEvents("reject", r, a)[0]).toEqual({ offsetSec: 0, hz: 110, amp: 0.85, durationSec: 0.1 });
    expect(fractalsEvents("unknown", r, a)).toEqual([]);
  });

  it("maps visible bars, reveals confirmed swings only at the confirming bar, and describes each bar", () => {
    const a = analyzeFractals(buildMarket(3, "4h"));
    expect(a.bars).toHaveLength(VISIBLE_BARS);
    const chart = fractalsChart(a);
    const swings = chart.markers.filter((m) => m.kind === "swing-high" || m.kind === "swing-low");
    expect(swings.length).toBeGreaterThan(0);
    for (const m of swings) expect(m.revealAt).toBe(m.index + 2);
    expect(fractalsReadout(0, a).map((r) => r.id)).toEqual(fractalsMode.layers.map((l) => l.id));
    for (const p of fractalsMode.presets) expect(Object.keys(p.layers).sort()).toEqual(["candidate", "confirm", "reject"]);
  });
});

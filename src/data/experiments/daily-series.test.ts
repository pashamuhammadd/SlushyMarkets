import { describe, expect, it } from "vitest";
import { pickWindows } from "@/lib/experiments/daily/cycle";
import { dailyBars } from "@/lib/experiments/daily/indicators";
import { DAILY_SERIES } from "./daily-series";

describe("daily experiment data", () => {
  const lengths = DAILY_SERIES.map((s) => dailyBars(s.candles, s.buyVolume).length);

  it("has continuous daily candles in every series", () => {
    for (const s of DAILY_SERIES) {
      for (let i = 1; i < s.candles.length; i += 1) expect(s.candles[i][0] - s.candles[i - 1][0]).toBe(86_400);
    }
  });

  it("can build four separate charts for a year of 12-hour sets", () => {
    const start = Math.floor(Date.UTC(2026, 10, 1) / (12 * 3600 * 1000));
    for (let cycle = start; cycle < start + 730; cycle += 1) expect(pickWindows(cycle, lengths)).not.toBeNull();
  });
});

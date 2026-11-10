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

describe("BTC experiment bonus rounds", () => {
  it("has a full 2021 and every SOL year from 2020 to 2026", async () => {
    const { experimentPeriod, experimentYear } = await import("@/lib/experiments/squeeze");
    const { BTC_USD_DAILY_2020 } = await import("./btc-usd-daily-2020");
    const { SOL_USD_DAILY } = await import("./sol-usd-daily");
    expect(experimentYear(BTC_USD_DAILY_2020, 2021)?.days).toHaveLength(365);
    for (const year of [2020, 2021, 2022, 2023, 2024, 2025, 2026]) expect(experimentPeriod(SOL_USD_DAILY, year), String(year)).not.toBeNull();
    expect(experimentPeriod(SOL_USD_DAILY, 2020)!.days[0].date).toBe("2020-04-24");
  });
});

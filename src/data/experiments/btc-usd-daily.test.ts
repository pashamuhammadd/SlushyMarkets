import { describe, expect, it } from "vitest";
import { experimentYear } from "@/lib/experiments/squeeze";
import { BTC_USD_DAILY } from "./btc-usd-daily";

describe("BTC experiment data", () => {
  it("is a complete, continuous 2025 with 2024 warm up", () => {
    const year = experimentYear(BTC_USD_DAILY, 2025);
    expect(year).not.toBeNull();
    expect(year!.days).toHaveLength(365);
    expect(year!.days[0].date).toBe("2025-01-01");
    expect(year!.days.at(-1)!.date).toBe("2025-12-31");
    expect(year!.all[0].date).toBe("2024-10-14");
  });
});

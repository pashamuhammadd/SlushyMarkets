import { BTC_USD_DAILY } from "@/data/experiments/btc-usd-daily";
import { experimentYear } from "./squeeze";

/**
 * The BTC experiment stays off until its data is added, checks out as a complete 2025,
 * and EXPERIMENT_BTC_2025_ENABLED is set to "true" once the data source is cleared.
 */
export function isBtcExperimentEnabled(): boolean {
  return process.env.EXPERIMENT_BTC_2025_ENABLED === "true" && experimentYear(BTC_USD_DAILY, 2025) !== null;
}

/** Same rule for the daily mystery experiment, with EXPERIMENT_DAILY_ENABLED. */
export function isDailyExperimentEnabled(): boolean {
  return process.env.EXPERIMENT_DAILY_ENABLED === "true";
}

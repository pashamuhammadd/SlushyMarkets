import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { DAILY_SERIES } from "@/data/experiments/daily-series";
import { CONTEXT_BARS, barsFor, cycleOf, pickWindows, secondsPerBar } from "./cycle";
import { dailyBars, indexBars, type DailyBar } from "./indicators";

/** Server side chart sets. The browser only ever receives bars it is allowed to see. */

const prepared = DAILY_SERIES.map((s) => ({ ...s, bars: dailyBars(s.candles, s.buyVolume) }));

export type DailyRound = {
  cycle: number;
  round: number;
  context: DailyBar[];
  bars: DailyBar[];
  hasVolume: boolean;
  identity: { asset: string; source: string; start: string; end: string };
};

export function dailyRound(cycle: number, round: number): DailyRound | null {
  const windows = pickWindows(cycle, prepared.map((s) => s.bars.length));
  const w = windows?.[round];
  if (!w) return null;
  const series = prepared[w.series];
  const slice = series.bars.slice(w.start, w.start + CONTEXT_BARS + barsFor(round));
  const indexed = indexBars(slice, slice[0].c);
  return {
    cycle,
    round,
    context: indexed.slice(0, CONTEXT_BARS),
    bars: indexed.slice(CONTEXT_BARS),
    hasVolume: slice.every((b) => b.buyShare !== null),
    identity: { asset: series.asset, source: series.source, start: slice[CONTEXT_BARS].date, end: slice.at(-1)!.date },
  };
}

export const dailyChartsAvailable = () => pickWindows(cycleOf(Date.now()), prepared.map((s) => s.bars.length)) !== null;

function signingKey(): string | null {
  return process.env.EXPERIMENT_SIGNING_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

const sign = (key: string, payload: string) => createHmac("sha256", key).update(`daily-v2:${payload}`).digest("hex");

/** Proof that a round's bars were issued at `issuedAt`. Not secret data, just tamper evident. */
export function beginToken(cycle: number, round: number, issuedAt: number): string | null {
  const key = signingKey();
  return key ? sign(key, `${cycle}:${round}:${issuedAt}`) : null;
}

/** The market is revealed only once the round could have finished. */
export function canReveal(cycle: number, round: number, issuedAt: number, token: string, now: number): boolean {
  const expected = beginToken(cycle, round, issuedAt);
  if (!expected || typeof token !== "string" || token.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return false;
  return now >= issuedAt + barsFor(round) * secondsPerBar(round) * 1000 && now - issuedAt < 7 * 24 * 3600 * 1000;
}

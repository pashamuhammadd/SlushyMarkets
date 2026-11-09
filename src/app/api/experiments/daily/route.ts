import { NextResponse } from "next/server";
import { isDailyExperimentEnabled } from "@/lib/experiments/availability";
import { beginToken, canReveal, dailyRound } from "@/lib/experiments/daily/charts";
import { DAILY_ROUNDS, barsFor, cycleOf, nextRefresh, secondsPerBar } from "@/lib/experiments/daily/cycle";

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const roundOf = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < DAILY_ROUNDS ? v : null);

/** GET ?round=n: context candles only. Nothing tradable is sent before the round starts. */
export async function GET(request: Request) {
  if (!isDailyExperimentEnabled()) return json({ ok: false, error: "unavailable" }, 404);
  const round = roundOf(Number(new URL(request.url).searchParams.get("round")));
  if (round === null) return json({ ok: false, error: "invalid" }, 400);
  const now = Date.now();
  const r = dailyRound(cycleOf(now), round);
  if (!r) return json({ ok: false, error: "no_charts" }, 503);
  return json({ ok: true, cycle: r.cycle, round, serverNow: now, nextRefresh: nextRefresh(now), context: r.context, bars: barsFor(round), secondsPerBar: secondsPerBar(round), hasVolume: r.hasVolume }, 200);
}

/** POST { action: "begin", cycle, round } returns the tradable bars. { action: "reveal", ... } names the market after the round. */
export async function POST(request: Request) {
  if (!isDailyExperimentEnabled()) return json({ ok: false, error: "unavailable" }, 404);
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 1_000) return json({ ok: false, error: "too_large" }, 413);
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }
  const round = roundOf(body.round);
  const cycle = typeof body.cycle === "number" && Number.isInteger(body.cycle) ? body.cycle : null;
  const now = Date.now();
  if (round === null || cycle === null || cycle > cycleOf(now) || cycle < cycleOf(now) - 14) return json({ ok: false, error: "invalid" }, 400);
  const r = dailyRound(cycle, round);
  if (!r) return json({ ok: false, error: "no_charts" }, 503);

  if (body.action === "begin") {
    if (cycle !== cycleOf(now)) return json({ ok: false, error: "expired" }, 409);
    const token = beginToken(cycle, round, now);
    return json({ ok: true, bars: r.bars, issuedAt: now, token }, 200);
  }
  if (body.action === "reveal") {
    const issuedAt = typeof body.issuedAt === "number" ? body.issuedAt : 0;
    if (!canReveal(cycle, round, issuedAt, String(body.token ?? ""), now)) return json({ ok: false, error: "not_yet" }, 403);
    return json({ ok: true, identity: r.identity }, 200);
  }
  return json({ ok: false, error: "invalid" }, 400);
}

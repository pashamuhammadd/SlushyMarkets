import { NextResponse } from "next/server";
import { isBtcExperimentEnabled } from "@/lib/experiments/availability";
import { EXPERIMENTS, statsGroups, validateRoundSubmission, type ExperimentId } from "@/lib/experiments/rounds";
import { readExperimentStats, storeExperimentRound } from "@/lib/server/experiment-store";
import { rateLimit } from "@/lib/server/rate-limit";

const MAX_BODY_BYTES = 2_000;

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

const unavailable = () => json({ ok: false, error: "unavailable" }, 404);

/** GET ?experiment=btc-2025 returns pooled results. Only finished, opted-in rounds exist in the data. */
export async function GET(request: Request) {
  if (!isBtcExperimentEnabled()) return unavailable();
  const experiment = new URL(request.url).searchParams.get("experiment") as ExperimentId;
  if (!EXPERIMENTS.includes(experiment)) return json({ ok: false, error: "invalid" }, 400);
  const rows = await readExperimentStats(experiment);
  if (!rows) return json({ ok: false, error: "storage_failed" }, 502);
  return json({ ok: true, groups: statsGroups(rows) }, 200);
}

/** POST one opted-in round summary. 201 only after it is stored. */
export async function POST(request: Request) {
  if (!isBtcExperimentEnabled()) return unavailable();
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ ok: false, error: "unsupported_type" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);

  const ip = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`experiment:${ip}`);
  if (!limit.allowed) return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": String(limit.retryAfterSec) });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }
  const round = validateRoundSubmission(body);
  if (!round) return json({ ok: false, error: "invalid" }, 400);

  const stored = await storeExperimentRound(round);
  if (!stored.ok) return json({ ok: false, error: stored.reason }, stored.reason === "not_configured" ? 503 : 502);
  return json({ ok: true }, 201);
}

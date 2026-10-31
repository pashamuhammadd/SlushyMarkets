import { NextResponse } from "next/server";
import { storeFeedback } from "@/lib/server/feedback-store";
import { rateLimit } from "@/lib/server/rate-limit";
import { validateFeedback } from "@/lib/validation/feedback";

const MAX_BODY_BYTES = 10_000;

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * POST /api/feedback
 * 201 { ok: true } only after the row is really stored.
 * 400 validation errors, 413 too large, 415 wrong type, 429 rate limited,
 * 503 storage not configured, 502 storage failed.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "unsupported_type", message: "Send JSON." }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "too_large", message: "That message is too long." }, 413);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return json(
      { ok: false, error: "rate_limited", message: "Too many messages in a short time. Please try again in a few minutes." },
      429,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "invalid_json", message: "We could not read that request." }, 400);
  }

  const result = validateFeedback(body);
  if (!result.ok) {
    return json(
      {
        ok: false,
        error: result.spam ? "rejected" : "invalid",
        message: result.spam ? result.errors.form : "Please fix the highlighted fields.",
        fields: result.spam ? undefined : result.errors,
      },
      400,
    );
  }

  const stored = await storeFeedback(result.data, { userAgent: request.headers.get("user-agent") });
  if (!stored.ok) {
    return stored.reason === "not_configured"
      ? json({ ok: false, error: "not_configured", message: "Feedback storage is not set up yet, so nothing was saved." }, 503)
      : json({ ok: false, error: "storage_failed", message: "We could not save your feedback right now. Please try again later." }, 502);
  }

  return json({ ok: true }, 201);
}

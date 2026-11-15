import { after, connection, NextResponse } from "next/server";
import { notifyFeedback } from "@/lib/server/discord";
import { FLOOD_LIMIT, recentFeedbackCount, storeFeedback } from "@/lib/server/feedback-store";
import { checkFormToken, formTokensEnabled, issueFormToken, markFormTokenUsed } from "@/lib/server/form-token";
import { rateLimit } from "@/lib/server/rate-limit";
import { sameOrigin } from "@/lib/server/same-origin";
import { validateFeedback } from "@/lib/validation/feedback";

const MAX_BODY_BYTES = 10_000;

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

const TOKEN_MESSAGES = {
  too_fast: "That was quick! Please wait a moment and send again.",
  expired: "This form was open for a long time. Please reload the page and send again.",
  reused: "This message was already sent. Reload the page to send another one.",
  invalid: "We could not accept this submission. Please reload the page and try again.",
} as const;

/** GET /api/feedback: a signed form token, fetched when someone starts writing. */
export async function GET() {
  await connection();
  return json({ ok: true, token: issueFormToken() }, 200);
}

/**
 * POST /api/feedback
 * 201 { ok: true } only after the row is really stored.
 * 400 validation errors or a bad form token, 403 other origin, 413 too large, 415 wrong type, 429 rate limited,
 * 503 storage not configured, 502 storage failed.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: "forbidden", message: "We could not accept this submission." }, 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "unsupported_type", message: "Send JSON." }, 415);
  }

  // Reject oversized bodies from the declared length before reading them into memory.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return json({ ok: false, error: "too_large", message: "That message is too long." }, 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "too_large", message: "That message is too long." }, 413);
  }

  // On Vercel, x-real-ip is set by the platform. x-forwarded-for is the fallback for other hosts.
  const ip =
    request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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

  const token = formTokensEnabled() ? checkFormToken((body as Record<string, unknown>).token) : null;
  if (token && !token.ok) {
    return json({ ok: false, error: token.reason === "too_fast" ? "too_fast" : "rejected", message: TOKEN_MESSAGES[token.reason] }, 400);
  }

  const recent = await recentFeedbackCount();
  if (recent !== null && recent >= FLOOD_LIMIT) {
    return json(
      { ok: false, error: "busy", message: "We are receiving a lot of messages right now. Nothing was saved, please try again in a few minutes." },
      429,
      { "Retry-After": "600" },
    );
  }

  const stored = await storeFeedback(result.data, { userAgent: request.headers.get("user-agent") });
  if (!stored.ok) {
    return stored.reason === "not_configured"
      ? json({ ok: false, error: "not_configured", message: "Feedback storage is not set up yet, so nothing was saved." }, 503)
      : json({ ok: false, error: "storage_failed", message: "We could not save your feedback right now. Please try again later." }, 502);
  }

  if (token?.ok) markFormTokenUsed(token.id);
  // Tell the team on Discord after the response is sent, so the visitor never waits for it.
  const saved = result.data;
  after(() => notifyFeedback(saved));
  return json({ ok: true }, 201);
}

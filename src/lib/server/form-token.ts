import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { MIN_FILL_MS } from "@/lib/validation/feedback";

/**
 * Signed form tokens for the feedback form. The server, not the browser, records when the
 * form was opened, so a script cannot fake the "took long enough to write" check by sending
 * its own start time. A token is valid from MIN_FILL_MS after it was issued until
 * FORM_TOKEN_MAX_AGE_MS, and each token is accepted once per server instance.
 *
 * Signed with EXPERIMENT_SIGNING_SECRET, or the Supabase service key when that is not set
 * (the same key choice as the daily experiment). Without either, tokens are not required.
 */
export const FORM_TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function signingKey(): string | null {
  return process.env.EXPERIMENT_SIGNING_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export const formTokensEnabled = () => signingKey() !== null;

const sign = (key: string, payload: string) => createHmac("sha256", key).update(`feedback-v1:${payload}`).digest("base64url");

export function issueFormToken(now: number = Date.now(), key = signingKey()): string | null {
  if (!key) return null;
  const payload = `${now}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(key, payload)}`;
}

export type TokenCheck = { ok: true; id: string } | { ok: false; reason: "invalid" | "too_fast" | "expired" | "reused" };

const used = new Map<string, number>();

export function checkFormToken(token: unknown, now: number = Date.now(), key = signingKey()): TokenCheck {
  if (!key || typeof token !== "string" || token.length > 200) return { ok: false, reason: "invalid" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid" };
  const [issued, nonce, signature] = parts;
  const expected = Buffer.from(sign(key, `${issued}.${nonce}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "invalid" };
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt)) return { ok: false, reason: "invalid" };
  if (now - issuedAt < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  if (now - issuedAt > FORM_TOKEN_MAX_AGE_MS) return { ok: false, reason: "expired" };
  if (used.has(nonce)) return { ok: false, reason: "reused" };
  return { ok: true, id: nonce };
}

/** Call only after the submission was stored, so a failed save can be retried with the same token. */
export function markFormTokenUsed(id: string, now: number = Date.now()) {
  used.set(id, now);
  if (used.size > 5000) for (const [k, t] of used) if (now - t > FORM_TOKEN_MAX_AGE_MS) used.delete(k);
}

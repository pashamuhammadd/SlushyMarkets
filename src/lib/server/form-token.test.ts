import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { checkFormToken, FORM_TOKEN_MAX_AGE_MS, issueFormToken, markFormTokenUsed } = await import("./form-token");
const { MIN_FILL_MS } = await import("@/lib/validation/feedback");

const key = "test-key";
const t0 = 1_700_000_000_000;

describe("feedback form tokens", () => {
  it("accepts a token between the minimum fill time and the maximum age", () => {
    const token = issueFormToken(t0, key)!;
    expect(checkFormToken(token, t0 + MIN_FILL_MS - 1, key)).toEqual({ ok: false, reason: "too_fast" });
    expect(checkFormToken(token, t0 + MIN_FILL_MS, key).ok).toBe(true);
    expect(checkFormToken(token, t0 + FORM_TOKEN_MAX_AGE_MS + 1, key)).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a forged start time, a wrong key and garbage", () => {
    const token = issueFormToken(t0, key)!;
    const [, nonce, sig] = token.split(".");
    expect(checkFormToken(`${t0 - 60_000}.${nonce}.${sig}`, t0 + 5000, key)).toEqual({ ok: false, reason: "invalid" });
    expect(checkFormToken(token, t0 + 5000, "other-key")).toEqual({ ok: false, reason: "invalid" });
    expect(checkFormToken("nope", t0, key)).toEqual({ ok: false, reason: "invalid" });
    expect(checkFormToken(undefined, t0, key)).toEqual({ ok: false, reason: "invalid" });
    expect(issueFormToken(t0, null)).toBeNull();
  });

  it("accepts each token once after it is marked used", () => {
    const token = issueFormToken(t0, key)!;
    const first = checkFormToken(token, t0 + 5000, key);
    expect(first.ok).toBe(true);
    expect(checkFormToken(token, t0 + 6000, key).ok).toBe(true);
    if (first.ok) markFormTokenUsed(first.id, t0 + 6000);
    expect(checkFormToken(token, t0 + 7000, key)).toEqual({ ok: false, reason: "reused" });
  });
});

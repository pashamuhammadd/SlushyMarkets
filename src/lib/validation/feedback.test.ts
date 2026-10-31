import { describe, expect, it } from "vitest";
import { MIN_FILL_MS, validateFeedback } from "./feedback";

const now = 1_000_000;
const base = {
  topic: "lesson-clarity",
  rating: 4,
  message: "The volume buckets made it click for me.",
  email: "",
  contactConsent: false,
  page: "/learn/candlesticks-and-volume",
  website: "",
  startedAt: now - 10_000,
};

describe("validateFeedback", () => {
  it("accepts a valid submission and normalizes it", () => {
    const result = validateFeedback({ ...base, message: "  Clear and fun lesson!  " }, now);
    expect(result).toEqual({
      ok: true,
      data: {
        topic: "lesson-clarity",
        rating: 4,
        message: "Clear and fun lesson!",
        email: null,
        contactConsent: false,
        page: "/learn/candlesticks-and-volume",
      },
    });
  });

  it("allows an empty rating", () => {
    const result = validateFeedback({ ...base, rating: null }, now);
    expect(result.ok && result.data.rating).toBe(null);
  });

  it("rejects bad topic, rating and short message with field errors", () => {
    const result = validateFeedback({ ...base, topic: "prizes", rating: 9, message: "short" }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.spam).toBe(false);
      expect(Object.keys(result.errors).sort()).toEqual(["message", "rating", "topic"]);
    }
  });

  it("requires consent when an email is given", () => {
    const result = validateFeedback({ ...base, email: "Learner@Example.com" }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.contactConsent).toBeDefined();

    const ok = validateFeedback({ ...base, email: "Learner@Example.com", contactConsent: true }, now);
    expect(ok.ok && ok.data.email).toBe("learner@example.com");
  });

  it("rejects invalid emails", () => {
    const result = validateFeedback({ ...base, email: "not-an-email", contactConsent: true }, now);
    expect(!result.ok && result.errors.email).toBeTruthy();
  });

  it("flags a filled honeypot or an instant submission as spam", () => {
    const honey = validateFeedback({ ...base, website: "http://spam.example" }, now);
    expect(!honey.ok && honey.spam).toBe(true);
    const fast = validateFeedback({ ...base, startedAt: now - MIN_FILL_MS + 1 }, now);
    expect(!fast.ok && fast.spam).toBe(true);
  });

  it("strips control characters and drops unsafe page values", () => {
    const result = validateFeedback({ ...base, message: "Nice\u0000 lesson here", page: "//evil.example" }, now);
    expect(result.ok && result.data.message).toBe("Nice lesson here");
    expect(result.ok && result.data.page).toBe(null);
  });

  it("handles non object input", () => {
    expect(validateFeedback("nope", now).ok).toBe(false);
    expect(validateFeedback(null, now).ok).toBe(false);
  });
});

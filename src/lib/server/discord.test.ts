import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { feedbackWebhookPayload, feedbackWebhookUrl, notifyFeedback } = await import("./discord");

const base = { topic: "bug" as const, rating: 4, message: "The chart froze @everyone <@123>", email: "a@b.co", contactConsent: true, page: "/learn" };

describe("Discord feedback notifications", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("only accepts real Discord webhook URLs", () => {
    expect(feedbackWebhookUrl({ DISCORD_FEEDBACK_WEBHOOK_URL: "https://discord.com/api/webhooks/123/abc_DEF-1" })).not.toBeNull();
    expect(feedbackWebhookUrl({ DISCORD_FEEDBACK_WEBHOOK_URL: "https://evil.example/api/webhooks/123/abc" })).toBeNull();
    expect(feedbackWebhookUrl({ DISCORD_FEEDBACK_WEBHOOK_URL: "http://discord.com/api/webhooks/123/abc" })).toBeNull();
    expect(feedbackWebhookUrl({})).toBeNull();
  });

  it("never sends the email and never lets user text ping anyone", () => {
    const payload = feedbackWebhookPayload(base, new Date(0));
    const text = JSON.stringify(payload);
    expect(text).not.toContain("a@b.co");
    expect(payload.allowed_mentions.parse).toEqual([]);
    expect(payload.embeds[0].fields[1].value).toBe("Yes, email in Supabase");
    expect(payload.embeds[0].title).toBe("New feedback: Bug");
    expect(payload.embeds[0].fields[0].value).toBe("★★★★☆");
    expect(payload.embeds[0].fields[2].value).toBe("https://slushymarkets.com/learn");
    expect(feedbackWebhookPayload({ ...base, email: null, contactConsent: false, rating: null }).embeds[0].fields.map((f) => f.value).slice(0, 2)).toEqual(["No rating", "No"]);
  });

  it("cuts long messages to Discord's limits", () => {
    const payload = feedbackWebhookPayload({ ...base, message: "x".repeat(5000) });
    expect(payload.embeds[0].description.length).toBe(3500);
  });

  it("does nothing without a URL and never throws when Discord fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await notifyFeedback(base, null)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await notifyFeedback(base, "https://discord.com/api/webhooks/1/a")).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await notifyFeedback(base, "https://discord.com/api/webhooks/1/a")).toBe(true);
  });
});

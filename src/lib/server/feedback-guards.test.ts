import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseContentRangeTotal } = await import("./feedback-store");
const { sameOrigin } = await import("./same-origin");

const req = (headers: Record<string, string>) => new Request("https://slushymarkets.com/api/feedback", { method: "POST", headers });

describe("feedback guards", () => {
  it("reads the total from a Content-Range header", () => {
    expect(parseContentRangeTotal("0-24/57")).toBe(57);
    expect(parseContentRangeTotal("*/0")).toBe(0);
    expect(parseContentRangeTotal("*/*")).toBeNull();
    expect(parseContentRangeTotal(null)).toBeNull();
  });

  it("blocks browsers posting from another site, but not requests without an Origin", () => {
    expect(sameOrigin(req({ host: "slushymarkets.com", origin: "https://slushymarkets.com" }))).toBe(true);
    expect(sameOrigin(req({ host: "slushymarkets.com", origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(req({ host: "slushymarkets.com" }))).toBe(true);
    expect(sameOrigin(req({ host: "slushymarkets.com", origin: "null" }))).toBe(false);
  });
});

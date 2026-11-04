import { describe, expect, it } from "vitest";
import { isNewBest, parseBest } from "./use-local-best";

describe("local best score", () => {
  it("parses stored values and ignores malformed data", () => {
    expect(parseBest('{"score":14,"max":20,"achievedAt":"2026-11-04T00:00:00.000Z"}')).toEqual({
      score: 14,
      max: 20,
      achievedAt: "2026-11-04T00:00:00.000Z",
    });
    expect(parseBest("not json")).toBeNull();
    expect(parseBest('{"score":"14"}')).toBeNull();
    expect(parseBest(null)).toBeNull();
  });

  it("only replaces the best with a higher score", () => {
    const best = { score: 12, max: 20, achievedAt: "x" };
    expect(isNewBest(null, 0)).toBe(true);
    expect(isNewBest(best, 12)).toBe(false);
    expect(isNewBest(best, 13)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { DRILL_CHOICES, ECHO, closeHz, describePosition, echoDemoCandles, echoNotes, echoPosition, echoZone } from "./echo-bands";

describe("Echo Bands", () => {
  it("measures position between the bands", () => {
    expect(echoPosition(110, 100, 120)).toBe(0.5);
    expect(echoPosition(95, 100, 120)).toBe(-0.25);
    expect(echoPosition(110, 120, 100)).toBeNaN();
  });

  it("matches the pitches heard in Slushy's video", () => {
    expect(closeHz(0)).toBeCloseTo(ECHO.lowerHz, 6);
    expect(closeHz(1)).toBeCloseTo(ECHO.upperHz, 6);
    expect(closeHz(0.25)).toBeCloseTo(381, 0);
    expect(closeHz(0.5)).toBeCloseTo(440, 0);
    expect(closeHz(0.75)).toBeCloseTo(508, 0);
    expect(closeHz(-0.5)).toBeCloseTo(247, 0);
    expect(closeHz(-5)).toBe(closeHz(-0.5));
  });

  it("places the close in time like it is placed in price", () => {
    const notes = echoNotes(0.5);
    expect(notes.map((n) => n.role)).toEqual(["lower", "close", "upper"]);
    expect(notes[1].offset).toBeCloseTo(ECHO.bandGapSec / 2, 10);
    expect(echoNotes(0.25)[1].offset).toBeCloseTo(ECHO.bandGapSec / 4, 10);
  });

  it("merges the close into a band when it sits on it", () => {
    expect(echoNotes(0)).toHaveLength(2);
    expect(echoNotes(1.01)).toHaveLength(2);
    expect(echoZone(0.01)).toBe("on-lower");
  });

  it("plays the close first outside the channel, with pitch telling the side", () => {
    const below = echoNotes(-0.4);
    const above = echoNotes(1.4);
    expect(below[0].role).toBe("close");
    expect(above[0].role).toBe("close");
    expect(below[0].hz).toBeLessThan(ECHO.lowerHz);
    expect(above[0].hz).toBeGreaterThan(ECHO.upperHz);
    expect(below[1].offset).toBe(ECHO.leadSec);
  });

  it("describes positions and has a deterministic demo", () => {
    expect(describePosition(0.5)).toContain("50%");
    expect(describePosition(-1)).toBe("Below the channel");
    expect(echoNotes(Number.NaN)).toEqual([]);
    expect(echoDemoCandles()).toEqual(echoDemoCandles());
    const zones = new Set(echoDemoCandles().map((c) => echoZone(echoPosition(c.c, 100, 120))));
    expect(zones.has("below")).toBe(true);
    expect(zones.has("above")).toBe(true);
    expect(zones.has("inside")).toBe(true);
    expect(new Set(DRILL_CHOICES.map((c) => echoZone(c.position))).size).toBe(3);
  });
});

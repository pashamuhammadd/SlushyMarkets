/**
 * Echo Bands, from Slushy's video of 10 November 2026. Each candle plays three short notes:
 * the lower band, the candle close and the upper band. The close is placed between the band
 * notes in both pitch and time, in proportion to where it closes between the bands.
 *
 * Measured from the video's audio: lower band about 330 Hz, upper band about 587 Hz, and the
 * close pitch follows a log (musical) scale between them (quarter about 381 Hz, half 440 Hz,
 * three quarters 508 Hz). Below the channel the close was about 247 Hz. Timing: band notes
 * 0.32 s apart; outside the channel the close leads both bands by 0.16 s.
 * Provisional until Slushy confirms the exact rules and how the bands are drawn on real charts.
 */

export const ECHO = {
  lowerHz: 329.63,
  upperHz: 587.33,
  bandGapSec: 0.32,
  leadSec: 0.16,
  candleSec: 0.95,
  /** Positions this close to a band count as on it, so the two notes merge. */
  mergeTolerance: 0.02,
  /** Outside the channel the pitch keeps moving, but no further than half a channel. */
  maxOutside: 0.5,
} as const;

/** 0 at the lower band, 1 at the upper band, below 0 or above 1 outside the channel. */
export function echoPosition(close: number, lower: number, upper: number): number {
  if (!Number.isFinite(close) || !(upper > lower)) return Number.NaN;
  return (close - lower) / (upper - lower);
}

export type EchoZone = "below" | "on-lower" | "inside" | "on-upper" | "above";

export function echoZone(position: number): EchoZone {
  const t = ECHO.mergeTolerance;
  if (position < -t) return "below";
  if (position <= t) return "on-lower";
  if (position < 1 - t) return "inside";
  if (position <= 1 + t) return "on-upper";
  return "above";
}

/** Close pitch on a musical (log) scale between the band notes. */
export function closeHz(position: number): number {
  const p = Math.min(1 + ECHO.maxOutside, Math.max(-ECHO.maxOutside, position));
  return ECHO.lowerHz * (ECHO.upperHz / ECHO.lowerHz) ** p;
}

export type EchoNote = { role: "lower" | "close" | "upper"; hz: number; offset: number };

/** The notes of one candle, in time order. Two notes when the close sits on a band. */
export function echoNotes(position: number): EchoNote[] {
  if (!Number.isFinite(position)) return [];
  const zone = echoZone(position);
  const gap = ECHO.bandGapSec;
  if (zone === "on-lower") return [{ role: "lower", hz: ECHO.lowerHz, offset: 0 }, { role: "upper", hz: ECHO.upperHz, offset: gap }];
  if (zone === "on-upper") return [{ role: "lower", hz: ECHO.lowerHz, offset: 0 }, { role: "upper", hz: ECHO.upperHz, offset: gap }];
  if (zone === "inside") {
    return [
      { role: "lower", hz: ECHO.lowerHz, offset: 0 },
      { role: "close", hz: closeHz(position), offset: position * gap },
      { role: "upper", hz: ECHO.upperHz, offset: gap },
    ];
  }
  return [
    { role: "close", hz: closeHz(position), offset: 0 },
    { role: "lower", hz: ECHO.lowerHz, offset: ECHO.leadSec },
    { role: "upper", hz: ECHO.upperHz, offset: ECHO.leadSec + gap },
  ];
}

export const ZONE_LABEL: Record<EchoZone, string> = {
  below: "Below the channel",
  "on-lower": "On the lower band",
  inside: "Inside the channel",
  "on-upper": "On the upper band",
  above: "Above the channel",
};

/** Plain words for a position, for labels and screen readers. */
export function describePosition(position: number): string {
  const zone = echoZone(position);
  if (zone !== "inside") return ZONE_LABEL[zone];
  return `${Math.round(position * 100)}% of the way from the lower band to the upper band`;
}

export type EchoCandle = { o: number; h: number; l: number; c: number };

/** Invented candles moving through, below and above a channel from 100 to 120. Deterministic. */
export const ECHO_LOWER = 100;
export const ECHO_UPPER = 120;

export function echoDemoCandles(count = 28, seed = 11): EchoCandle[] {
  let s = seed;
  const random = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  // A path that starts inside, drifts down through the lower band, climbs above, then settles.
  const targets = [110, 104, 101, 97, 95, 99, 103, 108, 112, 116, 119, 122, 125, 121, 117, 113, 110];
  const out: EchoCandle[] = [];
  let close = targets[0];
  for (let i = 0; i < count; i += 1) {
    const goal = targets[Math.min(targets.length - 1, Math.floor((i / count) * targets.length))];
    const open = close;
    close = Math.round((open + (goal - open) * 0.55 + (random() - 0.5) * 2.4) * 100) / 100;
    const wick = 0.4 + random() * 1.6;
    out.push({ o: open, c: close, h: Math.max(open, close) + wick, l: Math.min(open, close) - wick * 0.8 });
  }
  return out;
}

/** Listening drill answers. */
export const DRILL_CHOICES = [
  { id: "below", label: "Below the channel", position: -0.35 },
  { id: "low", label: "Near the lower band", position: 0.15 },
  { id: "middle", label: "Middle", position: 0.5 },
  { id: "high", label: "Near the upper band", position: 0.85 },
  { id: "above", label: "Above the channel", position: 1.35 },
] as const;

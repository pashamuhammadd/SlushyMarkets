/**
 * Adaptive Regime Cloud v1.0, by Slushy. Ported from the handoff's portable reference
 * (adaptive_cloud.py) and checked against its fixtures to 1e-10.
 *
 * On log closes: ER(20) blends the smoothing speed of an adaptive center between EMA55 and EMA10,
 * an EMA100 anchor sits beside it, and a buffer of 0.5 x population SD of 20 log returns x sqrt(10)
 * widens both sides. Values exist from index 99 and are shown two candles later, so the first
 * cloud appears at index 101. The current close is compared with the cloud from two candles ago.
 */

export type CloudPoint = { cloudH: number; cloudL: number; cloudCenter: number; cloudAnchor: number; cloudEr: number; cloudVote: number };

export const CLOUD_FIRST_INDEX = 101;

/** Lagged cloud for each close, in the closes' own units. Null during warm-up. */
export function adaptiveCloud(closes: readonly number[]): Array<CloudPoint | null> {
  const logs = closes.map((c) => Math.log(c));
  let center = logs[0];
  let anchor = logs[0];
  let vote = 0;
  const history: Array<CloudPoint | null> = [];
  const out: Array<CloudPoint | null> = [];
  logs.forEach((x, i) => {
    let movement = 0;
    const returns: number[] = [];
    if (i >= 20) {
      for (let j = i - 19; j <= i; j += 1) {
        movement += Math.abs(logs[j] - logs[j - 1]);
        returns.push(logs[j] - logs[j - 1]);
      }
    }
    const er = movement > 0 ? Math.min(1, Math.max(0, Math.abs(x - logs[i - 20]) / movement)) : 0;
    const alpha = 2 / 56 + er * (2 / 11 - 2 / 56);
    center += (x - center) * alpha;
    anchor += ((x - anchor) * 2) / 101;
    const mean = returns.length ? returns.reduce((a, b) => a + b, 0) / 20 : 0;
    const sigma = returns.length ? Math.sqrt(returns.reduce((a, v) => a + (v - mean) ** 2, 0) / 20) : 0;
    const buffer = 0.5 * sigma * Math.sqrt(10);
    const upper = Math.exp(Math.max(center, anchor) + buffer);
    const lower = Math.exp(Math.min(center, anchor) - buffer);
    if (i >= 99) {
      if (x >= Math.log(upper)) vote = 1;
      else if (x <= Math.log(lower)) vote = -1;
      history.push({ cloudH: upper, cloudL: lower, cloudCenter: Math.exp(center), cloudAnchor: Math.exp(anchor), cloudEr: er, cloudVote: vote });
    } else history.push(null);
    out.push(i >= CLOUD_FIRST_INDEX ? history[i - 2] : null);
  });
  return out;
}

export type CloudState = "warmup" | "inside" | "above" | "below";

/** Price location against the lagged cloud. Touching a boundary counts as inside. Not the vote. */
export function cloudState(b: { c: number; cloudL: number | null; cloudH: number | null }): CloudState {
  if (b.cloudL === null || b.cloudH === null || !Number.isFinite(b.cloudL) || !Number.isFinite(b.cloudH)) return "warmup";
  return b.c > b.cloudH ? "above" : b.c < b.cloudL ? "below" : "inside";
}

const SCALE = [261.63, 293.66, 329.63, 392, 440];
const PATTERN = [0, 1, 2, 4, 3, 2, 1, 0];

/** Two chimes per candle: an octave up and rising above the cloud, lower and reversed below it. */
export function cloudPlan(b: { c: number; cloudL: number | null; cloudH: number | null }, replayIndex: number): { state: CloudState; notes: number[] } {
  const state = cloudState(b);
  if (state === "warmup" || state === "inside") return { state, notes: [] };
  const step = state === "above" ? replayIndex : 7 - replayIndex;
  return { state, notes: [0, 1].map((j) => SCALE[PATTERN[(((step + j) % 8) + 8) % 8]] * (state === "above" ? 2 : 1)) };
}

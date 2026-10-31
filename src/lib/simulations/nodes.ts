import type { VolumeProfile } from "./types";

export type NodeKind = "poc" | "high" | "low" | "normal" | "empty";

export type NodeRules = {
  /** A band is a high volume node at or above this share of the busiest band. */
  highRatio: number;
  /** A traded band is a low volume node at or below this share of the busiest band. */
  lowRatio: number;
};

/** Simple, explainable thresholds used in the lessons. Not a trading rule. */
export const DEFAULT_NODE_RULES: NodeRules = { highRatio: 0.6, lowRatio: 0.15 };

/**
 * Labels each band of a volume profile.
 * - poc: the point of control (busiest band)
 * - high: high volume node
 * - low: low volume node, only between the lowest and highest traded band
 * - empty: outside the traded range, or nothing traded yet
 */
export function classifyVolumeNodes(profile: VolumeProfile, rules: NodeRules = DEFAULT_NODE_RULES): NodeKind[] {
  const max = Math.max(0, ...profile.bands.map((b) => b.volumeBtc));
  const traded = profile.bands.flatMap((b, i) => (b.tradeCount > 0 ? [i] : []));
  const first = traded[0] ?? -1;
  const last = traded[traded.length - 1] ?? -1;

  return profile.bands.map((band, i) => {
    if (max === 0 || i < first || i > last) return "empty";
    if (i === profile.pocBandIndex) return "poc";
    if (band.volumeBtc >= max * rules.highRatio) return "high";
    if (band.volumeBtc <= max * rules.lowRatio) return "low";
    return "normal";
  });
}

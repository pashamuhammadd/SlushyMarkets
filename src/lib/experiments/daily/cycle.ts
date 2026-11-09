/** 12-hour chart sets that change at 00:00 and 12:00 UTC. Same charts for everyone in a cycle. */

export const CYCLE_MS = 12 * 60 * 60 * 1000;
export const CONTEXT_BARS = 20;
export const ROUND_BARS = 120;
export const ARCADE_BARS = 240;
export const DAILY_ROUNDS = 4; // three regular rounds, then the Arcade bonus

export const cycleOf = (now: number) => Math.floor(now / CYCLE_MS);
export const nextRefresh = (now: number) => (cycleOf(now) + 1) * CYCLE_MS;
export const barsFor = (round: number) => (round === 3 ? ARCADE_BARS : ROUND_BARS);
export const secondsPerBar = (round: number) => (round === 3 ? 0.25 : 0.5);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Window = { series: number; start: number };

/**
 * Picks where each round's chart starts. `lengths` are the usable bar counts of each series.
 * Deterministic for a cycle. Rounds in the same cycle never share bars from the same series.
 */
export function pickWindows(cycle: number, lengths: readonly number[]): Window[] | null {
  const random = mulberry32(cycle * 2654435761);
  const picked: Window[] = [];
  for (let round = 0; round < DAILY_ROUNDS; round += 1) {
    const span = CONTEXT_BARS + barsFor(round);
    let found: Window | null = null;
    for (let attempt = 0; attempt < 200 && !found; attempt += 1) {
      const series = Math.floor(random() * lengths.length);
      const room = lengths[series] - span;
      if (room < 0) continue;
      const start = Math.floor(random() * (room + 1));
      const clash = picked.some((w, r) => w.series === series && start < w.start + CONTEXT_BARS + barsFor(r) && w.start < start + span);
      if (!clash) found = { series, start };
    }
    if (!found) return null;
    picked.push(found);
  }
  return picked;
}

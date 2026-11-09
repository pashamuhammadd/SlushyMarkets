/** Shared, opt-in experiment results: what may be sent, and how groups are pooled. */

export const EXPERIMENTS = ["btc-2025", "daily-mystery"] as const;
export type ExperimentId = (typeof EXPERIMENTS)[number];
export const SOUND_SETTINGS = ["on", "off", "mixed"] as const;
export type SoundSetting = (typeof SOUND_SETTINGS)[number];

export const BTC_2025_VERSION = "sonar-bbkc14-cymbals4-ema14-v1";

export type RoundSubmission = {
  submissionId: string;
  experiment: ExperimentId;
  experimentVersion: string;
  round: number;
  sound: SoundSetting;
  netPnl: number;
  drawdownPct: number;
  tradeCount: number;
  wins: number;
  fees: number;
  winningPnl: number;
  losingPnl: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERSION = /^[a-z0-9.-]{1,60}$/i;
const num = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const int = (v: unknown, min: number, max: number): v is number => num(v, min, max) && Number.isInteger(v);

/** Consistency checks only. It cannot prove a round was really played. */
export function validateRoundSubmission(input: unknown): RoundSubmission | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const r = input as Record<string, unknown>;
  if (typeof r.submissionId !== "string" || !UUID.test(r.submissionId)) return null;
  if (!EXPERIMENTS.includes(r.experiment as ExperimentId) || !SOUND_SETTINGS.includes(r.sound as SoundSetting)) return null;
  if (typeof r.experimentVersion !== "string" || !VERSION.test(r.experimentVersion)) return null;
  if (!int(r.round, 1, 20) || !int(r.tradeCount, 0, 1000) || !int(r.wins, 0, 1000) || r.wins > r.tradeCount) return null;
  if (!num(r.netPnl, -10_000, 10_000_000) || !num(r.drawdownPct, 0, 100) || !num(r.fees, 0, 1_000_000)) return null;
  if (!num(r.winningPnl, 0, 10_000_000) || !num(r.losingPnl, 0, 10_000_000)) return null;
  if (Math.abs(r.winningPnl - r.losingPnl - r.netPnl) > 0.05) return null;
  if (r.tradeCount === 0 && (r.netPnl !== 0 || r.fees !== 0)) return null;
  return {
    submissionId: r.submissionId,
    experiment: r.experiment as ExperimentId,
    experimentVersion: r.experimentVersion,
    round: r.round,
    sound: r.sound as SoundSetting,
    netPnl: r.netPnl,
    drawdownPct: r.drawdownPct,
    tradeCount: r.tradeCount,
    wins: r.wins,
    fees: r.fees,
    winningPnl: r.winningPnl,
    losingPnl: r.losingPnl,
  };
}

/** One row of the experiment_round_stats view. */
export type RoundStatsRow = {
  experiment_version: string;
  sound: SoundSetting;
  rounds: number;
  total_net_pnl: number;
  total_drawdown_pct: number;
  total_trades: number;
  total_wins: number;
  total_fees: number;
  total_winning_pnl: number;
  total_losing_pnl: number;
};

export type PooledStats = {
  rounds: number;
  averageNet: number;
  averageDrawdown: number;
  averageFees: number;
  totalTrades: number;
  /** Winning trades / all trades, in percent. Null with no trades. */
  winRate: number | null;
  /** All winning P&L / all losing P&L. Null when there are no losses, since a ratio is not defined. */
  profitFactor: number | null;
};

export function poolStats(rows: readonly RoundStatsRow[]): PooledStats | null {
  const sum = (pick: (r: RoundStatsRow) => number) => rows.reduce((total, r) => total + pick(r), 0);
  const rounds = sum((r) => r.rounds);
  if (rounds === 0) return null;
  const totalTrades = sum((r) => r.total_trades);
  const losing = sum((r) => r.total_losing_pnl);
  return {
    rounds,
    averageNet: sum((r) => r.total_net_pnl) / rounds,
    averageDrawdown: sum((r) => r.total_drawdown_pct) / rounds,
    averageFees: sum((r) => r.total_fees) / rounds,
    totalTrades,
    winRate: totalTrades > 0 ? (sum((r) => r.total_wins) / totalTrades) * 100 : null,
    profitFactor: losing > 0 ? sum((r) => r.total_winning_pnl) / losing : null,
  };
}

export type StatsGroup = { label: string; stats: PooledStats | null };

/** Everything together, then each sound setting on its own. */
export function statsGroups(rows: readonly RoundStatsRow[]): StatsGroup[] {
  const labels: Record<SoundSetting, string> = { on: "Sound on", off: "Chart only", mixed: "Mixed" };
  return [
    { label: "All shared rounds", stats: poolStats(rows) },
    ...SOUND_SETTINGS.map((sound) => ({ label: labels[sound], stats: poolStats(rows.filter((r) => r.sound === sound)) })),
  ];
}

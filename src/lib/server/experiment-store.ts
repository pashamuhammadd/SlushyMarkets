import "server-only";
import type { ExperimentId, RoundStatsRow, RoundSubmission } from "@/lib/experiments/rounds";
import { getSupabaseConfig } from "./feedback-store";
import { supabaseAuthHeaders } from "./supabase-headers";

/** Opt-in experiment summaries in Supabase. Server only, like feedback storage. */

export type RoundStoreResult = { ok: true } | { ok: false; reason: "not_configured" | "storage_failed" };

const money = (v: number) => Math.round(v * 100) / 100;

export async function storeExperimentRound(input: RoundSubmission): Promise<RoundStoreResult> {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, reason: "not_configured" };
  try {
    const response = await fetch(`${config.url}/rest/v1/experiment_rounds?on_conflict=submission_id`, {
      method: "POST",
      // A repeated submission id is ignored, so a retry cannot count twice.
      headers: { ...supabaseAuthHeaders(config.serviceKey), Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        submission_id: input.submissionId,
        experiment: input.experiment,
        experiment_version: input.experimentVersion,
        round: input.round,
        sound: input.sound,
        net_pnl: money(input.netPnl),
        drawdown_pct: money(input.drawdownPct),
        trade_count: input.tradeCount,
        wins: input.wins,
        fees: money(input.fees),
        winning_pnl: money(input.winningPnl),
        losing_pnl: money(input.losingPnl),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? { ok: true } : { ok: false, reason: "storage_failed" };
  } catch {
    return { ok: false, reason: "storage_failed" };
  }
}

const COLUMNS = "experiment_version,sound,rounds,total_net_pnl,total_drawdown_pct,total_trades,total_wins,total_fees,total_winning_pnl,total_losing_pnl";

export async function readExperimentStats(experiment: ExperimentId): Promise<RoundStatsRow[] | null> {
  const config = getSupabaseConfig();
  if (!config) return null;
  try {
    const response = await fetch(`${config.url}/rest/v1/experiment_round_stats?experiment=eq.${experiment}&select=${COLUMNS}`, {
      headers: supabaseAuthHeaders(config.serviceKey),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? ((await response.json()) as RoundStatsRow[]) : null;
  } catch {
    return null;
  }
}

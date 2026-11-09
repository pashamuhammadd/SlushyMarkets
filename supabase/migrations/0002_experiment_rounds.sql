-- SlushyMarkets shared experiment results. Opt-in summaries only.
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Holds no names, emails, wallets, IP addresses or individual trades.

create table if not exists public.experiment_rounds (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id uuid not null unique,
  experiment text not null check (experiment in ('btc-2025', 'daily-mystery')),
  experiment_version text not null check (char_length(experiment_version) between 1 and 60),
  round smallint not null check (round between 1 and 20),
  sound text not null check (sound in ('on', 'off', 'mixed')),
  net_pnl numeric(12, 2) not null,
  drawdown_pct numeric(6, 2) not null check (drawdown_pct between 0 and 100),
  trade_count integer not null check (trade_count between 0 and 1000),
  wins integer not null check (wins between 0 and trade_count),
  fees numeric(12, 2) not null check (fees >= 0),
  winning_pnl numeric(12, 2) not null check (winning_pnl >= 0),
  losing_pnl numeric(12, 2) not null check (losing_pnl >= 0)
);

create index if not exists experiment_rounds_group_idx on public.experiment_rounds (experiment, experiment_version, sound);

-- One row per experiment, version and sound setting. Pooled figures are calculated from these sums.
create or replace view public.experiment_round_stats with (security_invoker = true) as
select
  experiment,
  experiment_version,
  sound,
  count(*)::int as rounds,
  sum(net_pnl)::float8 as total_net_pnl,
  sum(drawdown_pct)::float8 as total_drawdown_pct,
  sum(trade_count)::int as total_trades,
  sum(wins)::int as total_wins,
  sum(fees)::float8 as total_fees,
  sum(winning_pnl)::float8 as total_winning_pnl,
  sum(losing_pnl)::float8 as total_losing_pnl
from public.experiment_rounds
group by experiment, experiment_version, sound;

-- Row Level Security on, with NO policies: only the server (service role key) can read or write.
alter table public.experiment_rounds enable row level security;
revoke all on table public.experiment_rounds from anon, authenticated;
revoke all on table public.experiment_round_stats from anon, authenticated;

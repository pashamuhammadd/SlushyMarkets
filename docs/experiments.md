# Historical experiments

Separate from Practice Mode. Results are stored and reported per experiment.

## Original BTC experiment: Watch 2024. Trade 2025.

Route `/experiments/btc-2025`, not linked, not in the sitemap, noindex. Rebuilt from Slushy's prototype (`app.js?v=simple-original7`, `engine.js`, `round-stats.js`, `community.js`), read on 10 November 2026.

- Engine `src/lib/experiments/engine.ts`: $10,000 start, $2,000 per trade, 0.05% fee and 0.02% adverse slippage per side, no commission. Orders queue for the next daily open. One position, flips close then reopen, final close is forced.
- Indicators and sound `src/lib/experiments/squeeze.ts`: BB SMA(14) +/- 2 population SD, KC EMA(14) +/- 1.5 Wilder ATR(14). Squeeze = BB inside KC. Drums, entry chimes, release cymbals and direction chimes as in the prototype.
- One attempt per browser (localStorage). 500 ms per day, 10 second countdown, no pause.
- Part 1 video must play to the end with no skipping.

## Turning it on

Every step is needed. Until then the page and API answer 404.

1. Add the data to `src/data/experiments/btc-usd-daily.ts`: Coinbase BTC-USD daily candles from 2024-10-01 to 2025-12-31 as `[unix seconds, low, high, open, close, volume]`. The page checks that 2025 has 365 continuous, valid days.
2. Add the 2024 training video as `public/experiments/training-2024.mp4`.
3. Run `supabase/migrations/0002_experiment_rounds.sql` in the Supabase SQL Editor.
4. Set `EXPERIMENT_BTC_2025_ENABLED=true` in Vercel, first for Preview, and for Production only after Slushy confirms the data and video are cleared. Then redeploy.

## Shared statistics

Opt in or private must be chosen before the round starts. Stored fields: submission id, experiment, version, round, sound (on, off, mixed), net P&L, drawdown, trade count, wins, fees, winning and losing trade P&L. Nothing else. The server validates consistency and ignores repeated submission ids. Pooled win rate = all wins / all trades. Pooled profit factor = all winning P&L / all losing P&L.

## Not built yet

2021 BTC bonus round, SOL year rounds, Dark Castle reward, trade log download, dot grids, and the daily mystery-market experiment.

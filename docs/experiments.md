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

## Daily mystery-market experiment (version 2)

Route `/experiments/daily`, not linked, noindex. Rebuilt from Slushy's `/practice` prototype (`practice.js?v=cyan-button1` and its modules), read on 10 November 2026.

- Three regular rounds of 120 candles at 0.5 s, then one Arcade bonus of 240 candles at 0.25 s with optional 2x leverage. Same costs as the BTC experiment.
- Chart sets change at 00:00 and 12:00 UTC (`src/lib/experiments/daily/cycle.ts`), identical for everyone in a cycle. One attempt per round per cycle in each browser.
- The server sends only 20 context candles before a round, the tradable candles on start, and names the market only after a signed, timed reveal (`EXPERIMENT_SIGNING_SECRET`, falling back to the Supabase key).
- Prices are indexed so the first context close is 100.
- Presets: Squeeze Sonar, Efficiency Rhythm (ER14), Volume Pulse + Sonar Channels, EMA Sonar 7/20/50, Chart Only. ER14, the ER channel and the EMA gains were checked against the prototype's preview data and match exactly. Volume Pulse is offered only for charts with taker buy volume.
- 2x positions close at a daily close when the loss including the entry fee reaches entry notional / leverage. The result compares the same trades at 1x.
- Shared statistics: regular rounds only, version `daily-v2-<preset>`, grouped by preset. Arcade stays on the device.

### Turning it on

1. Add more history to `src/data/experiments/daily-series.ts`. With only BTC 2024 to 2025 there are not enough candles for four separate charts, so the API answers 503 until more series are added (SOL from Slushy's `sol-data.js`, BTC 2020 to 2021 from `bonus-data.js`, and Binance taker buy volume for Volume Pulse).
2. Optional: set `EXPERIMENT_SIGNING_SECRET` in Vercel to a long random string.
3. Set `EXPERIMENT_DAILY_ENABLED=true`, Preview first.

### Adaptive Cloud v1.0 (added 10 November 2026)

From Slushy's handoff package (`Adaptive_Cloud_v1_Nimia_Handoff.zip`). The calculation is ported to `src/lib/experiments/daily/cloud.ts` and tested against the package's fixtures (`fixtures/expected_cloud.json` to 1e-10, `fixtures/expected_sound.json` exactly). The cloud is computed from the first candle of each series, appears from index 101 and is shown two candles late; the close is compared with the lagged cloud, touching counts as inside. The vote is kept but not used for sound.

Sound: two pentatonic chimes per candle above (octave up) or below (reversed); inside plays the recorded rain loop with thunder at most every max(6 s, 0.65 x its length), with a procedural rumble if the files fail. Recordings: `public/experiments/cloud-rain.mp3` and `cloud-thunder.mp3`, Thunder & rain by iscence (Freesound #817640), CC0, checksums match the package. Integration change: the files are served from `/experiments/` instead of the site root.

### Left out of the daily experiment

Flames, siren and speech effects, the Dark Castle song in this experiment, and the prototype's server-side first-attempt check. TradingView rendering of the Pine reference was not tested.

## BTC experiment unlocks (Slushy, 10 November 2026)

- Finishing 2025 unlocks a secret 2021 BTC round (Coinbase data, one attempt).
- Finishing 2021 unlocks the Dark Castle theme (`public/experiments/dark-castle.mp3`, made with ChatGPT for Slushy, cleared by him) and SOL/USD years 2020 to 2026 (Yahoo Finance, one attempt each). SOL 2020 starts on 24 April and SOL 2026 stops at the last candle in the file.
- Bonus rounds stay on the device and are not added to the shared statistics.
- Every round shows the prototype's five numbers with 20 dot grids: gap to compression, compression candles, outside compression, chime pulses and drum pulses (`squeezeMeters`).
- Bonus data is loaded only after the unlock, so the first page load stays small.

Not built yet: trade log download.

# Practice Mode: technical design

Route: `/games/practice`. Engine: `src/lib/trading/practice.ts` (pure functions, unit tested). UI: `src/components/games/PracticeGame.tsx`.

## What is built

- Three rounds, 120 bars at 0.5 seconds, so one minute each.
- Virtual $10,000 per round, Long, Short, Close. Reversing closes then opens, which is two transactions.
- Fills at the close of the latest revealed bar. Open positions close at the end of the round.
- Balance = start + realized P&L - fees, never below zero.
- Drawdown is measured from the peak of account value on every bar.
- Sound is optional: Silent, or an EMA Sonar preset with the existing mapping. One clock drives the chart, account and notes.
- No future data on screen: candles, lines and the price scale use revealed bars only.
- Results are shown on screen only. Nothing is stored or sent.

## Provisional, needs Slushy

- Charts are simulated with the Sound Playground generator and labeled so. Historical BTC needs a verified source, timestamps, OHLC checks and confirmed usage rights.
- Costs follow Slushy: 0.05% fee and 0.02% slippage per side.
- Optional leverage (reported: unlocks after $200 virtual profit, up to 5x, black and white candles) is not built, because the rules could not be checked against the prototype in this session.

## Experiment versus practice

The first-attempt research experiment is separate and not built. It needs a consent step, one attempt enforced on the server, a separate table from practice, no public leaderboard from research data, and no required personal data. Practice results must never enter that table.

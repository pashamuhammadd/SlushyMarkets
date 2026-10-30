# SlushyMarkets

Interactive trading education website for beginners. Learn how charts form through visuals, sound and short exercises, guided by the official LiquiditySlushy mascot.

Commissioned by Slushy, developed by Nimia Studio. Education only: no wallet connection, tokens, signals or trading advice.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation, design system, navigation, homepage, lesson directory | Done |
| 2 | Full Candlesticks and Volume lesson with quiz | Next |
| 3 | Three Trends, One Piano audio prototype, feedback form with Supabase | Planned |
| 4 | Polish, QA, SEO, deployment | Planned |

## Run locally

Requirements: Node.js 20.9 or newer (22 LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core web vitals and TypeScript rules) |
| `npm run test` | Vitest unit tests for the simulation math |
| `npm run check` | All of the above in sequence |

## Stack

- Next.js 16 App Router, React 19, TypeScript strict mode, typed routes
- Tailwind CSS 4 with design tokens in `src/app/globals.css`
- lucide-react icons
- Vitest for pure function tests
- Fonts self hosted from `src/app/fonts` (Fredoka for headings, Geist for text, both SIL Open Font License)
- Supabase is planned for Phase 3 feedback storage and is not installed yet

## Project structure

```text
src/
  app/                      routes (home, learn, lesson preview, explore, audio-lab, feedback, 404)
  components/
    audio/                  Three Trends tiles (illustrative, no sound yet)
    brand/                  Mascot and Logo
    layout/                 Header, footer, page header
    lessons/                Candle chart, volume profile chart, playback controls, preview
    marketing/              Homepage sections
    ui/                     Button, Badge, Section, StatusNotice
  data/
    demo-trades.ts          Deterministic synthetic trade fixture
    lessons.ts              Lesson catalog with honest status labels
  lib/
    simulations/            Pure TypeScript engine: trades, OHLC, volume by price, tests
    hooks/                  usePlayback (single simulation clock), useElementWidth
public/images/liquidity-slushy/   Mascot poses cropped from the official character sheet
```

## Technical decisions

- **Simulated data only.** `src/data/demo-trades.ts` generates 168 BTC-like trades from a fixed seed, so every build and every browser shows the same data. It is labeled "Simulated data" and "Not live market data" wherever it appears. The symbol is `SYN-BTC/USD` to avoid looking like a real market.
- **One clock, many views.** `usePlayback` owns a single cursor (number of trades revealed). The candle chart and volume profile are pure functions of the same trade prefix, so they cannot drift apart. Pause freezes both, restart resets both.
- **Deterministic math.** Trades are ordered by timestamp, then id. Quantities are summed as integer units of 0.0001 BTC to avoid floating point artifacts. Price bands include their lower edge. Empty time intervals produce no candle (shown as a gap). The point of control tie goes to the lower price band.
- **Node labels.** In the preview, a high volume node is a band with at least 60% of the busiest band, a low volume node is a traded band at or under 15%. These simple rules will be explained in the Phase 2 lesson.
- **Charts are custom SVG** sized to their real pixel width, so labels stay readable on a 360px phone. No chart library was needed yet.
- **Mascot assets** are crops of the supplied character sheet, with sheet labels removed. The hero image is the main illustration with the sheet title, tagline and color swatches cleaned off and edges faded. No character art was generated or redrawn.
- **Navigation includes Explore** at the client's request. It hosts the working demo and a beginner glossary, so it is a real page.
- **Honest placeholders.** Audio Lab and Feedback explain what is coming and do not show fake play buttons or fake forms.
- **Mockup features left out on purpose:** Connect Wallet (replaced by Start Learning), "Live Demo" label, timeframe switcher, invented track list, lesson progress counters, giveaway and PSG1 card, community join link.

## Pending decisions for Slushy

1. Sir, should the first lessons keep the synthetic BTC-like example, or switch to SOL/USD or a fictional ticker?
2. Sir, can you share the approved audio, composition or exact mapping rules for Daily, 4H and 15m?
3. Sir, would you like SMA vs EMA at the initial launch, or in the following update?
4. Sir, is there an official community link (Discord, X or Telegram) we may link from the site?
5. Sir, are there statements, logos or promotions you want reviewed before public launch?

## Environment variables

None are needed for Phase 1. See `.env.example` for what Phase 3 will use.

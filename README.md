# Slushy Markets - a Liquidity joke

Interactive trading education website for beginners. Learn how charts form through visuals, sound and short exercises, guided by the official LiquiditySlushy mascot. Short name: Slushy Markets. Live at https://slushymarkets.com.

Commissioned by Slushy, developed by Nimia Studio. Education only: no wallet connection, tokens, signals or trading advice.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation, design system, navigation, homepage, lesson directory | Done |
| 2 | Full Candlesticks and Volume lesson with quiz | Done |
| 3 | Three Trends, One Piano audio prototype, feedback form with Supabase | Done |
| 4 | Polish, QA, SEO, deployment | Done |
| P0 | Security review, production readiness, official branding, technical SEO | Done |
| P1 | SMA vs EMA lesson | Done |
| P1 | Renko Bricks lesson | In review |
| P1 | Lesson improvements from feedback | Next |

## Run locally

Requirements: Node.js 20.9 or newer (22 LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Everything works without environment variables, except that the feedback form shows a "not connected yet" notice until Supabase is configured.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core web vitals and TypeScript rules) |
| `npm run test` | Vitest unit tests (simulation math, audio mapping, feedback validation) |
| `npm run check` | All of the above in sequence |

## Feedback storage setup (Supabase)

1. Create a project at https://supabase.com (the free plan is enough).
2. In the Supabase dashboard open **SQL Editor > New query**, paste the contents of `supabase/migrations/0001_feedback.sql` and press **Run**. This creates the `feedback` table with Row Level Security on and no public access.
3. Copy two values:
   - **Project URL**: `https://<project-ref>.supabase.co`. The project ref is the id in the dashboard address `supabase.com/dashboard/project/<project-ref>`.
   - **Secret key**: in **Project Settings > API Keys**, under **Secret keys**, reveal and copy the key that starts with `sb_secret_`. (Older projects may show a legacy `service_role` key starting with `eyJ`; both work.) Never use the `sb_publishable_` key here.
4. In Vercel open **Project > Settings > Environment Variables** and add, for Production and Preview:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = the secret key (`sb_secret_...`)
5. Redeploy (Deployments > latest > Redeploy). The feedback page reads the configuration at build time.
6. Send a test message on `/feedback`, then check **Table Editor > feedback** in Supabase.

For local testing, put the same two variables in a `.env.local` file (ignored by git) and restart `npm run dev`.

Security notes:
- New `sb_secret_` keys are sent only in the `apikey` header (they are not JWTs). Legacy `eyJ` keys are also sent as `Authorization: Bearer`. See `src/lib/server/supabase-headers.ts` and its test.
- The secret key is only read in `src/lib/server/feedback-store.ts`, which is marked `server-only`. Never prefix it with `NEXT_PUBLIC_`.
- The browser never talks to Supabase directly. It posts to `/api/feedback`, which validates on the server and inserts through the Supabase REST API.
- Read submissions in the Supabase dashboard. There is no public admin page.

## Launch checklist

Before announcing slushymarkets.com publicly:

- [ ] Latest `main` is deployed on Vercel and the build is green
- [ ] `slushymarkets.com` is the primary domain, `www` redirects to it, HTTPS works
- [ ] Supabase table created from `supabase/migrations/0001_feedback.sql`
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in Vercel (Production and Preview), then redeployed
- [ ] A test message on `/feedback` appears in Supabase Table Editor, then delete the test row
- [ ] The Supabase secret key has never been committed (GitHub push protection will block it). Rotate it if it was ever pasted anywhere public
- [ ] Share a link in X, Telegram or Discord and check the preview card shows the mascot image
- [ ] Google Search Console: add a Domain property for `slushymarkets.com` (DNS TXT record), or a URL prefix property with the HTML tag method by setting `GOOGLE_SITE_VERIFICATION` in Vercel and redeploying
- [ ] Submit `https://slushymarkets.com/sitemap.xml` in Search Console and inspect the homepage URL
- [ ] Slushy has reviewed the copy, the mascot usage and the provisional audio label
- [ ] Quick manual pass on a real phone: lesson playback, Audio Lab sound with Mute, feedback form

## Quality checks done in Phase 4

- Automated accessibility audit (axe-core, WCAG 2.1 AA rules) on every page at 360px and 1280px: no violations
- Keyboard: skip link, visible focus ring on every control, mobile menu opens with Enter and closes with Escape and on navigation
- `prefers-reduced-motion` turns off page animations and smooth scrolling
- No horizontal scrolling at 360, 768, 1024 and 1280px on any page
- Error boundary tested with a forced error: friendly page with Try again, header stays usable
- Social preview, canonical URL, sitemap, robots and manifest verified in the built HTML
- JavaScript sent per page is about 195 KB gzipped, most of it React and Next.js; local LCP under 0.4s

## Stack

- Next.js 16 App Router, React 19, TypeScript strict mode, typed routes
- Tailwind CSS 4 with design tokens in `src/app/globals.css`
- lucide-react icons
- Web Audio API for all sound (no audio files, no audio library)
- Supabase (Postgres) for feedback, reached through its REST API with `fetch`, no client library
- Vitest for pure function tests
- Fonts self hosted from `src/app/fonts` (Fredoka for headings, Geist for text, both SIL Open Font License)

## Project structure

```text
src/
  app/
    api/feedback/route.ts   POST endpoint: rate limit, validation, storage
    ...                     routes: home, learn, lesson, explore, audio-lab, feedback, 404
  components/
    audio/                  Trend player, piano keyboard, sparklines, listening exercise
    brand/                  Mascot and Logo
    feedback/               Feedback form
    layout/                 Header, footer, page header
    lessons/                Candle chart, volume profile, volume buckets, playback controls, lesson player, quiz
    marketing/              Homepage sections
    ui/                     Button, Badge, Section, StatusNotice
  data/
    demo-trades.ts          Deterministic synthetic trade fixture
    lessons.ts              Lesson catalog with honest status labels
    lessons/                Lesson content (chapters and quiz questions) kept as plain data
  lib/
    audio/                  Trend scenario and provisional note mapping (pure), piano synth (Web Audio)
    hooks/                  usePlayback, useTrendPlayer, useElementWidth, useDeviceProgress
    server/                 Feedback storage and rate limit (server only)
    simulations/            Pure TypeScript engine: trades, OHLC, volume by price, nodes
    validation/             Feedback validation shared by server and form
supabase/migrations/        SQL to create the feedback table
public/images/liquidity-slushy/   Mascot poses cropped from the official character sheet
```

## Technical decisions

### Lessons and charts

- **Simulated data only.** `src/data/demo-trades.ts` generates 168 BTC-like trades from a fixed seed, so every build and every browser shows the same data. It is labeled "Simulated data" and "Not live market data" wherever it appears. The symbol is `SYN-BTC/USD` to avoid looking like a real market.
- **One clock, many views.** `usePlayback` owns a single cursor (number of trades revealed). The candle chart, volume profile and volume buckets are pure functions of the same trade prefix, so they cannot drift apart.
- **Deterministic math.** Trades are ordered by timestamp, then id. Quantities are summed as integer units of 0.0001 BTC to avoid floating point artifacts. Price bands include their lower edge. Empty time intervals produce no candle (shown as a gap). The point of control tie goes to the lower price band.
- **Node labels.** A high volume node is a band with at least 60% of the busiest band, a low volume node is a traded band at or under 15% (`src/lib/simulations/nodes.ts`). The lesson explains these are teaching thresholds, not a trading rule.
- **Guided lesson.** Five chapters are defined by cursor ranges in `src/data/lessons/candlesticks-and-volume.ts`. "Play this step" plays only that range and pauses at its end.
- **Volume buckets.** The cups group the same trades into $50 ranges while the profile uses $25 bands. A test checks that both always hold the identical total.
- **Quiz and progress.** Each question locks after the first answer and shows the correct option with an explanation. Completion is stored only in localStorage, with a note and a clear button.
- **Charts are custom SVG** sized to their real pixel width, so labels stay readable on a 360px phone.

### SMA vs EMA lesson

- **Pure math** in `src/lib/simulations/moving-averages.ts`: `sma`, `ema` (seeded with the SMA of the first N closes, alpha = 2 / (N + 1)), `smaWeights`, `emaWeights`, `firstTurnDown`, `directionChanges`.
- **Weights panel** unrolls the EMA recursion into one share per close. Tests check the shares sum to 1 and reproduce both averages exactly.
- **Synthetic story** in `src/data/ma-demo.ts`: 48 seeded hourly candles (climb, sharp reversal after candle 21, sideways chop from candle 30). Tests check the EMA turns before the SMA for periods 5, 10 and 20, and changes direction more in the range for periods 10 and 20. For period 5 they are equal, so the lesson shows live counts instead of a fixed claim.
- **One timeline:** `usePlayback` with one candle per event drives the chart, both lines, the weights panel, readouts and step narration. Period and line toggles recompute from the same data.
- **Accessibility:** the SMA is dashed and hatched, the EMA solid, so the lines differ by more than color.

### Renko Bricks lesson

- **Pure math** in `src/lib/simulations/renko.ts`: classic close based Renko. The grid is anchored at the first close rounded down to the box size. The next up brick needs one box above the last brick's top, the next down brick one box below its bottom, so a reversal automatically needs two boxes. One close can complete several bricks.
- **Shared generator** `src/lib/simulations/synthetic-candles.ts` builds seeded candles from target closes. The SMA vs EMA data was moved onto it with byte identical output.
- **Synthetic story** in `src/data/renko-demo.ts`: 58 hourly candles in five phases (climb, 16 quiet hours, 2 hour spike, slide, choppy finish). Tests check: no $100 or $200 bricks in the quiet range, several bricks from one spike candle, the first down brick only after a two box drop, and many $50 reversals but no new $100 or $200 bricks in the choppy finish.
- **Two charts, one timeline:** the candle chart (reusing the SMA vs EMA chart without lines) and the brick chart share the price scale. The candle that completed the newest brick is outlined. Brick slots are fixed per box size so nothing rescales during playback.
- **Accessibility:** up bricks are solid, down bricks hatched; the box size comparison is a real table.

### Audio Lab (provisional)

- **Only the registers come from Slushy's demo:** Daily low (C2 to C3), 4H middle (C4 to C5), 15m high (C6 to C7). Everything else is a placeholder isolated in `src/lib/audio/trend-scenario.ts` so it can be swapped once Slushy approves the real mapping.
- **Placeholder rules:** pitch follows the trend line inside each register, using a major pentatonic scale. Daily plays a note every 1.2s, 4H every 0.6s, 15m every 0.3s. The 48 step demo lasts about 14 seconds.
- **Original tones only.** `PianoSynth` builds piano-like notes from oscillators. No samples, recordings or existing songs.
- **Safety:** no autoplay, the AudioContext is created on the first Play click, master gain is capped, a compressor prevents peaks, Mute and Stop are always visible, sound stops when the tab is hidden or the page is left.
- **Accurate timing:** a look ahead scheduler queues notes on the AudioContext clock and moves the playhead with them.

### Feedback

- **Never fake success.** The form shows "saved" only when the API answers 201 after Supabase stored the row. Not configured returns 503, storage errors return 502, and the person keeps their text.
- **Spam defense:** hidden honeypot field, minimum time to fill (2.5s), server validation, best effort rate limit of 5 messages per 10 minutes per IP (in memory, per server instance), and database check constraints.
- **Privacy:** email is optional and needs an explicit consent tick. The page explains exactly what is stored.

### General

- **Branding:** the official name is "Slushy Markets - a Liquidity joke" (`site.fullName`). The short name "Slushy Markets" (`site.name`) is used in the navbar, title suffixes and tight spaces. Both live in `src/lib/site.ts`.
- **SEO:** every page has its own title, description, canonical URL and social preview. The root layout sets no canonical, so the 404 page never points at the homepage. JSON-LD (`src/lib/structured-data.ts`): EducationalOrganization and WebSite on every page, LearningResource on the lesson, demo and Audio Lab, BreadcrumbList on section pages. The preview image (`public/images/og-slushy-markets.jpg`) is built from the official hero artwork. `/api/` is excluded in robots.txt and the 404 page is `noindex`.
- **Security headers:** HSTS, nosniff, frame denial, strict referrer policy and a restrictive permissions policy (`next.config.ts`). A partial Content Security Policy (`base-uri`, `form-action`, `frame-ancestors`, `object-src`, `upgrade-insecure-requests`) is set because it needs no nonces. A `script-src` policy is not set yet because it needs per request nonces; consider it once analytics or third party scripts are added. Cross-Origin-Opener-Policy is `same-origin`.
- **Error handling:** `src/app/error.tsx` for page level errors and `src/app/global-error.tsx` as a last resort.
- **Navigation:** the full menu shows from 1024px; smaller screens use the menu button.
- **Mascot assets** are crops of the supplied character sheet, with sheet labels removed. No character art was generated or redrawn.
- **Navigation includes Explore** at the client's request. It hosts the working demo, links to every lesson and a beginner glossary.
- **Glossary** lives in `src/data/glossary.ts`, grouped by lesson. Every term has a stable anchor (for example `/explore#renko-brick`), each lesson links to its section, and the page publishes a schema.org `DefinedTermSet`. A test checks anchors are unique and lesson links exist.
- **Mockup features left out on purpose:** Connect Wallet (replaced by Start Learning), "Live Demo" label, timeframe switcher, invented track list, lesson progress counters, giveaway and PSG1 card, community join link.

## Pending decisions for Slushy

1. Sir, should the first lessons keep the synthetic BTC-like example, or switch to SOL/USD or a fictional ticker?
2. Sir, can you share the approved audio, composition or exact mapping rules for Daily, 4H and 15m? The current Audio Lab uses provisional rules.
3. Sir, is there an official community link (Discord, X or Telegram) we may link from the site?
4. Sir, are there statements, logos or promotions you want reviewed before public launch?

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | Server only | Supabase project URL for feedback storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, secret | Lets the server insert feedback. Never expose to the browser. |
| `GOOGLE_SITE_VERIFICATION` | Optional, not secret | Search Console HTML tag token. Renders `<meta name="google-site-verification">` |

See `.env.example`.

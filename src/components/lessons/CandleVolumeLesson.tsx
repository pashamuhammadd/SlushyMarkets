"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ChevronRight, FlaskConical, Play, RotateCcw } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { SpeechBubble } from "@/components/marketing/SpeechBubble";
import { Badge } from "@/components/ui/Badge";
import {
  DEMO_BAND_USD,
  DEMO_BUCKET_RANGE,
  DEMO_BUCKET_USD,
  DEMO_CANDLE_MS,
  DEMO_ORIGIN_MS,
  DEMO_PRICE_RANGE,
  DEMO_SYMBOL,
  DEMO_TRADES,
} from "@/data/demo-trades";
import { CHAPTERS, chapterIndexFor, chapterStart } from "@/data/lessons/candlesticks-and-volume";
import { cn } from "@/lib/cn";
import { formatBtc, formatClock, formatPrice, formatUsd } from "@/lib/format";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { usePlayback } from "@/lib/hooks/use-playback";
import { buildCandles } from "@/lib/simulations/ohlc";
import { buildVolumeProfile } from "@/lib/simulations/volume-profile";
import { CandleChart } from "./CandleChart";
import { PlaybackControls } from "./PlaybackControls";
import { VolumeBucketsChart } from "./VolumeBucketsChart";
import { NodeLegend, VolumeProfileChart } from "./VolumeProfileChart";

const SLOT_COUNT = 12;
const candleOptions = { candleMs: DEMO_CANDLE_MS, originMs: DEMO_ORIGIN_MS };
const profileOptions = { bandUsd: DEMO_BAND_USD, ...DEMO_PRICE_RANGE };
const bucketOptions = { bandUsd: DEMO_BUCKET_USD, ...DEMO_BUCKET_RANGE };

// Fixed maxima from the full series, so nothing rescales during playback.
const VOLUME_MAX = Math.max(...buildCandles(DEMO_TRADES, candleOptions).map((c) => c.volumeBtc));
const BAND_MAX = Math.max(...buildVolumeProfile(DEMO_TRADES, profileOptions).bands.map((b) => b.volumeBtc));
const BUCKET_MAX = Math.max(...buildVolumeProfile(DEMO_TRADES, bucketOptions).bands.map((b) => b.volumeBtc));

/**
 * The full Candlesticks and Volume lesson. One playback cursor drives the candle chart,
 * the volume profile, the volume buckets, the readouts and the chapter narration.
 */
export function CandleVolumeLesson() {
  const playback = usePlayback({ total: DEMO_TRADES.length, initialCursor: 0, eventsPerSecond: 10 });
  const { cursor, total, playing, seek, playRange } = playback;
  const [focus, setFocus] = useState(0);

  const [candleRef, candleWidth] = useElementWidth<HTMLDivElement>(560);
  const [profileRef, profileWidth] = useElementWidth<HTMLDivElement>(300);
  const [bucketRef, bucketWidth] = useElementWidth<HTMLDivElement>(880);

  // Right after jumping to a chapter, the cursor sits on the previous chapter's last trade.
  const chapterIndex = focus > 0 && cursor === chapterStart(focus) ? focus : chapterIndexFor(cursor);
  const chapter = CHAPTERS[chapterIndex];
  const isLast = chapterIndex === CHAPTERS.length - 1;
  const chapterDone = cursor >= chapter.end;

  const view = useMemo(() => {
    const prefix = DEMO_TRADES.slice(0, cursor);
    return {
      candles: buildCandles(prefix, candleOptions),
      profile: buildVolumeProfile(prefix, profileOptions),
      buckets: buildVolumeProfile(prefix, bucketOptions),
      lastTrade: prefix.length ? prefix[prefix.length - 1] : null,
    };
  }, [cursor]);

  const lastPrice = view.lastTrade?.priceUsd ?? null;
  const forming = cursor > 0 && cursor < total;
  const current = view.candles.length ? view.candles[view.candles.length - 1] : null;

  function goToChapter(index: number) {
    setFocus(index);
    seek(chapterStart(index));
  }

  function playChapter() {
    const start = chapterStart(chapterIndex);
    setFocus(chapterIndex);
    if (chapterDone) playRange(chapter.end, start);
    else playRange(chapter.end);
  }

  function nextChapter() {
    const next = chapterIndex + 1;
    setFocus(next);
    playRange(CHAPTERS[next].end, chapterStart(next));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Chapter stepper */}
      <nav aria-label="Lesson steps">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {CHAPTERS.map((c, i) => {
            const active = i === chapterIndex;
            const done = cursor >= c.end && !active;
            return (
              <li key={c.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goToChapter(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-sm font-medium ring-1 transition",
                    active ? "bg-cyan/15 text-ink ring-cyan/50" : "bg-navy-950/40 text-muted ring-white/10 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-xs font-bold",
                      active ? "bg-cyan text-navy-950" : done ? "bg-success/20 text-success" : "bg-white/5 text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className={cn(active ? "inline" : "hidden lg:inline")}>{c.short}</span>
                  <span className="sr-only">{done ? "(completed)" : ""}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Narration */}
      <section aria-labelledby="chapter-title" className="panel panel-glow grid gap-4 p-4 sm:p-5 md:grid-cols-[150px_1fr]">
        <div className="hidden flex-col items-center gap-2 md:flex">
          <SpeechBubble className="text-xs">{chapter.tip}</SpeechBubble>
          <Mascot pose={chapter.pose} sizes="130px" className="max-h-32 w-auto" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Step {chapterIndex + 1} of {CHAPTERS.length}
          </p>
          <h2 id="chapter-title" aria-live="polite" className="mt-1 text-2xl font-semibold text-ink">
            {chapter.title}
          </h2>
          <p className="mt-2 text-muted">{chapter.body}</p>
          <p className="mt-2 text-sm text-violet-soft md:hidden">{chapter.tip}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!chapterDone || !isLast ? (
              <button
                type="button"
                onClick={chapterDone && !isLast ? nextChapter : playChapter}
                disabled={playing}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-5 text-sm font-semibold text-navy-950 shadow-glow-cyan transition hover:brightness-110 disabled:opacity-60"
              >
                {chapterDone && !isLast ? (
                  <>
                    Next step <ChevronRight aria-hidden="true" className="size-4" />
                  </>
                ) : (
                  <>
                    <Play aria-hidden="true" className="size-4" /> {playing ? "Playing..." : "Play this step"}
                  </>
                )}
              </button>
            ) : (
              <a
                href="#quiz"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-5 text-sm font-semibold text-navy-950 shadow-glow-cyan transition hover:brightness-110"
              >
                Check your understanding <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            )}
            {chapterDone ? (
              <button
                type="button"
                onClick={() => {
                  setFocus(chapterIndex);
                  playRange(chapter.end, chapterStart(chapterIndex));
                }}
                disabled={playing}
                className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5 disabled:opacity-60"
              >
                <RotateCcw aria-hidden="true" className="size-4" /> Replay step
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="violet">
          <FlaskConical aria-hidden="true" className="size-3.5" />
          Simulated data
        </Badge>
        <span className="font-medium text-ink">{DEMO_SYMBOL}</span>
        <span aria-hidden="true">·</span>
        <span>1 minute candles</span>
        <span aria-hidden="true">·</span>
        <span>${DEMO_BAND_USD} profile bands</span>
        <span aria-hidden="true">·</span>
        <span>${DEMO_BUCKET_USD} buckets</span>
        <span className="basis-full text-subtle sm:ml-auto sm:basis-auto">Invented trades for teaching. Not live market data.</span>
      </div>

      {/* Candles + profile */}
      <div className="grid gap-3 lg:grid-cols-[1.65fr_1fr]">
        <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <figcaption className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">1. Candles from executed trades</span>
            <span className="text-xs tabular-nums text-muted">
              {current && forming ? `Forming ${formatClock(current.startMs)} UTC` : cursor === 0 ? "Waiting for trades" : "Complete"}
            </span>
          </figcaption>
          <div ref={candleRef} className="w-full">
            <CandleChart
              width={candleWidth}
              candles={view.candles}
              slotCount={SLOT_COUNT}
              originMs={DEMO_ORIGIN_MS}
              candleMs={DEMO_CANDLE_MS}
              range={DEMO_PRICE_RANGE}
              volumeMax={VOLUME_MAX}
              lastPrice={lastPrice}
              forming={forming}
              label={`Candlestick chart with ${view.candles.length} one minute candles from ${cursor} simulated trades.`}
            />
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
            {[
              ["Open", current ? formatPrice(current.open) : "-"],
              ["High", current ? formatPrice(current.high) : "-"],
              ["Low", current ? formatPrice(current.low) : "-"],
              ["Close", current ? formatPrice(current.close) : "-"],
              ["Volume", current ? `${current.volumeBtc.toFixed(4)}` : "-"],
              ["Trades", current ? String(current.tradeCount) : "-"],
            ].map(([term, value]) => (
              <div key={term} className="rounded-xl bg-navy-800/70 px-2.5 py-2 ring-1 ring-white/5">
                <dt className="text-subtle">{term}</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-1.5 text-xs text-subtle">Values for the latest candle. Volume in BTC.</p>
        </figure>

        <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <figcaption className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">2. Volume profile</span>
            <span className="text-xs text-muted">Same trades, grouped by price</span>
          </figcaption>
          <div ref={profileRef} className="w-full">
            <VolumeProfileChart
              width={profileWidth}
              profile={view.profile}
              range={DEMO_PRICE_RANGE}
              bandMax={BAND_MAX}
              lastPrice={lastPrice}
              nodes={chapter.nodes}
              label={`Volume profile: ${view.profile.totalVolumeBtc} BTC of simulated executed volume in ${DEMO_BAND_USD} dollar bands.`}
            />
          </div>
          <NodeLegend nodes={chapter.nodes} />
        </figure>
      </div>

      {/* Buckets */}
      <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
        <figcaption className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-ink">3. Volume buckets</span>
          <span className="text-xs text-muted">
            Each cup collects the BTC traded in a ${DEMO_BUCKET_USD} range. Total {view.buckets.totalVolumeBtc.toLocaleString("en-US", { maximumFractionDigits: 4 })} BTC.
          </span>
        </figcaption>
        <div ref={bucketRef} className="w-full">
          <VolumeBucketsChart
            width={bucketWidth}
            buckets={view.buckets}
            bucketMax={BUCKET_MAX}
            lastPrice={lastPrice}
            idPrefix="lesson-buckets"
            label={`Volume buckets for ${view.buckets.bands.length} price ranges of ${DEMO_BUCKET_USD} dollars, prices rising left to right.`}
          />
        </div>
        <p className="mt-1 text-xs text-subtle">
          Prices rise from left to right. Turn the cups on their side and you get the volume profile above.
        </p>
      </figure>

      {/* Controls */}
      <div className="z-10 rounded-2xl lg:sticky lg:bottom-3 bg-navy-900/90 p-3 ring-1 ring-white/10 backdrop-blur sm:p-4">
        <PlaybackControls playback={playback} />
        <p className="mt-2 min-h-5 text-sm text-muted" aria-live={playing ? "off" : "polite"}>
          {view.lastTrade ? (
            <>
              Trade {cursor}: <span className="font-semibold tabular-nums text-ink">{formatBtc(view.lastTrade.quantityBtc)}</span> at{" "}
              <span className="font-semibold tabular-nums text-ink">{formatUsd(view.lastTrade.priceUsd)}</span>.
            </>
          ) : (
            <>No trades yet. Press Play this step or step forward.</>
          )}
        </p>
      </div>
    </div>
  );
}


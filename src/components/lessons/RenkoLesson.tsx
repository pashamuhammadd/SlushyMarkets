"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ChevronRight, FlaskConical, Play, RotateCcw } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { SpeechBubble } from "@/components/marketing/SpeechBubble";
import { Badge } from "@/components/ui/Badge";
import {
  RENKO_BOX_SIZES,
  RENKO_DEFAULT_BOX,
  RENKO_DEMO_CANDLE_MS,
  RENKO_DEMO_CANDLES,
  RENKO_DEMO_CLOSES,
  RENKO_DEMO_ORIGIN_MS,
  RENKO_DEMO_PRICE_RANGE,
  RENKO_DEMO_SYMBOL,
  type RenkoBoxSize,
} from "@/data/renko-demo";
import { RENKO_CHAPTERS, renkoChapterIndexFor, renkoChapterStart } from "@/data/lessons/renko-bricks";
import { cn } from "@/lib/cn";
import { formatClock, formatPrice } from "@/lib/format";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { usePlayback } from "@/lib/hooks/use-playback";
import { buildRenko, renkoReversals } from "@/lib/simulations/renko";
import { MovingAverageChart } from "./MovingAverageChart";
import { PlaybackControls } from "./PlaybackControls";
import { RenkoChart, RenkoLegend } from "./RenkoChart";

const TOTAL = RENKO_DEMO_CANDLES.length;
const ID = "renko-lesson";

// Brick slots per box size from the full data, so the brick chart never rescales during playback.
const SLOTS = Object.fromEntries(RENKO_BOX_SIZES.map((box) => [box, buildRenko(RENKO_DEMO_CLOSES, box).bricks.length])) as Record<
  RenkoBoxSize,
  number
>;

/**
 * The Renko Bricks lesson. One playback cursor (candles revealed) drives the time based candle chart,
 * the brick chart, the readouts, the box size comparison and the step narration.
 */
export function RenkoLesson() {
  const playback = usePlayback({ total: TOTAL, initialCursor: 0, eventsPerSecond: 3 });
  const { cursor, playing, seek, playRange } = playback;
  const [focus, setFocus] = useState(0);
  const [box, setBox] = useState<RenkoBoxSize>(RENKO_DEFAULT_BOX);
  const boxGroup = useId();

  const [candleRef, candleWidth] = useElementWidth<HTMLDivElement>(520);
  const [brickRef, brickWidth] = useElementWidth<HTMLDivElement>(520);

  const chapterIndex = focus > 0 && cursor === renkoChapterStart(focus) ? focus : renkoChapterIndexFor(cursor);
  const chapter = RENKO_CHAPTERS[chapterIndex];
  const isLast = chapterIndex === RENKO_CHAPTERS.length - 1;
  const chapterDone = cursor >= chapter.end;

  const view = useMemo(() => {
    const closes = RENKO_DEMO_CLOSES.slice(0, cursor);
    const renko = buildRenko(closes, box);
    const newest = renko.bricks.length ? renko.bricks[renko.bricks.length - 1] : null;
    const fromLatest = newest && cursor > 0 ? renko.bricks.filter((b) => b.sourceIndex === cursor - 1).length : 0;
    return {
      candles: RENKO_DEMO_CANDLES.slice(0, cursor),
      lastClose: closes.length ? closes[closes.length - 1] : null,
      renko,
      newest,
      fromLatest,
      compare: RENKO_BOX_SIZES.map((size) => {
        const r = size === box ? renko : buildRenko(closes, size);
        return { size, bricks: r.bricks.length, reversals: renkoReversals(r.bricks) };
      }),
    };
  }, [cursor, box]);

  function goToChapter(index: number) {
    setFocus(index);
    seek(renkoChapterStart(index));
  }

  function playChapter() {
    setFocus(chapterIndex);
    if (chapterDone) playRange(chapter.end, renkoChapterStart(chapterIndex));
    else playRange(chapter.end);
  }

  function nextChapter() {
    const next = chapterIndex + 1;
    setFocus(next);
    playRange(RENKO_CHAPTERS[next].end, renkoChapterStart(next));
  }

  const { renko, lastClose } = view;
  const readouts: [string, string][] = [
    ["Last close", lastClose !== null ? formatPrice(lastClose) : "-"],
    ["Candles", String(cursor)],
    ["Bricks", String(renko.bricks.length)],
    ["Next up at", renko.nextUp !== null ? formatPrice(renko.nextUp) : "-"],
    ["Next down at", renko.nextDown !== null ? formatPrice(renko.nextDown) : "-"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Lesson steps">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {RENKO_CHAPTERS.map((c, i) => {
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

      <section aria-labelledby="renko-chapter-title" className="panel panel-glow grid gap-4 p-4 sm:p-5 md:grid-cols-[150px_1fr]">
        <div className="hidden flex-col items-center gap-2 md:flex">
          <SpeechBubble className="text-xs">{chapter.tip}</SpeechBubble>
          <Mascot pose={chapter.pose} sizes="130px" className="max-h-32 w-auto" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Step {chapterIndex + 1} of {RENKO_CHAPTERS.length}
          </p>
          <h2 id="renko-chapter-title" aria-live="polite" className="mt-1 text-2xl font-semibold text-ink">
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
                  playRange(chapter.end, renkoChapterStart(chapterIndex));
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
        <span className="font-medium text-ink">{RENKO_DEMO_SYMBOL}</span>
        <span aria-hidden="true">·</span>
        <span>1 hour candles</span>
        <span aria-hidden="true">·</span>
        <span>Bricks from closing prices</span>
        <span className="basis-full text-subtle sm:ml-auto sm:basis-auto">Invented prices for teaching. Not live market data.</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
        <div role="radiogroup" aria-labelledby={boxGroup} className="flex items-center gap-2">
          <span id={boxGroup} className="text-sm font-semibold text-ink">
            Box size
          </span>
          <div className="flex rounded-full bg-navy-900/80 p-1 ring-1 ring-white/10">
            {RENKO_BOX_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={box === size}
                onClick={() => setBox(size)}
                className={cn(
                  "h-9 min-w-14 rounded-full px-3 text-sm font-semibold transition",
                  box === size ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40" : "text-muted hover:text-ink",
                )}
              >
                ${size}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-subtle">
          New brick: one box beyond the last brick. Reversal: two boxes. Highs, lows and time are ignored.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">1. Time chart: one candle per hour</span>
            <span className="text-xs tabular-nums text-muted">
              {view.candles.length ? `${formatClock(view.candles[view.candles.length - 1].startMs)} UTC` : "Waiting"}
            </span>
          </figcaption>
          <div ref={candleRef} className="w-full">
            <MovingAverageChart
              width={candleWidth}
              height={280}
              candles={view.candles}
              slotCount={TOTAL}
              originMs={RENKO_DEMO_ORIGIN_MS}
              candleMs={RENKO_DEMO_CANDLE_MS}
              range={RENKO_DEMO_PRICE_RANGE}
              zone={chapter.zone}
              highlightIndex={view.newest ? view.newest.sourceIndex : null}
              label={`Candlestick chart with ${cursor} simulated hourly candles.`}
            />
          </div>
          <p className="mt-1 text-xs text-subtle">The dashed outline marks the candle that completed the newest brick.</p>
        </figure>

        <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">2. Renko chart: one brick per ${box} move</span>
            <span className="text-xs tabular-nums text-muted">
              {renko.bricks.length} {renko.bricks.length === 1 ? "brick" : "bricks"}
            </span>
          </figcaption>
          <div ref={brickRef} className="w-full">
            <RenkoChart
              width={brickWidth}
              height={280}
              bricks={renko.bricks}
              slotCount={SLOTS[box]}
              range={RENKO_DEMO_PRICE_RANGE}
              lastClose={lastClose}
              nextUp={renko.nextUp}
              nextDown={renko.nextDown}
              showThresholds={chapter.showThresholds}
              idPrefix={ID}
              label={`Renko chart with ${renko.bricks.length} bricks of ${box} dollars built from ${cursor} closes.`}
            />
          </div>
          <div className="mt-2">
            <RenkoLegend idPrefix={ID} />
          </div>
        </figure>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {readouts.map(([term, value]) => (
          <div key={term} className="rounded-xl bg-navy-800/70 px-2.5 py-2 ring-1 ring-white/5">
            <dt className="text-subtle">{term}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="min-h-5 text-sm text-muted" aria-live={playing ? "off" : "polite"}>
        {cursor === 0 ? (
          <>No candles yet. Press Play this step or step forward.</>
        ) : view.fromLatest > 1 ? (
          <>
            The latest candle completed <span className="font-semibold text-ink">{view.fromLatest} bricks</span> at once.
          </>
        ) : view.fromLatest === 1 ? (
          <>The latest candle completed one brick.</>
        ) : (
          <>The latest candle did not move a full box, so no new brick.</>
        )}
      </p>

      {chapter.compareBoxes ? (
        <div className="rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <p className="mb-2 text-sm font-semibold text-ink">Same {cursor} candles, three box sizes</p>
          <div role="region" aria-label="Box size comparison, scroll sideways on small screens" tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="py-2 pr-4">Box size</th>
                  <th scope="col" className="py-2 pr-4">Bricks</th>
                  <th scope="col" className="py-2">Direction changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-muted">
                {view.compare.map((row) => (
                  <tr key={row.size} className={row.size === box ? "text-ink" : undefined}>
                    <th scope="row" className="py-2 pr-4 font-semibold">
                      ${row.size}
                      {row.size === box ? <span className="sr-only"> (selected)</span> : null}
                    </th>
                    <td className="py-2 pr-4 tabular-nums">{row.bricks}</td>
                    <td className="py-2 tabular-nums">{row.reversals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="z-10 rounded-2xl bg-navy-900/90 p-3 ring-1 ring-white/10 backdrop-blur sm:p-4 lg:sticky lg:bottom-3">
        <PlaybackControls playback={playback} eventLabel="Candle" />
      </div>
    </div>
  );
}

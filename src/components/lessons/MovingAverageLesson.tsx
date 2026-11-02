"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ChevronRight, FlaskConical, Play, RotateCcw } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { SpeechBubble } from "@/components/marketing/SpeechBubble";
import { Badge } from "@/components/ui/Badge";
import {
  MA_DEFAULT_PERIOD,
  MA_DEMO_CANDLE_MS,
  MA_DEMO_CANDLES,
  MA_DEMO_CLOSES,
  MA_DEMO_ORIGIN_MS,
  MA_DEMO_PEAK_INDEX,
  MA_DEMO_PRICE_RANGE,
  MA_DEMO_RANGE_START,
  MA_DEMO_SYMBOL,
  MA_PERIODS,
  type MaPeriod,
} from "@/data/ma-demo";
import { MA_CHAPTERS, maChapterIndexFor, maChapterStart } from "@/data/lessons/sma-vs-ema";
import { cn } from "@/lib/cn";
import { formatClock, formatPrice } from "@/lib/format";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { usePlayback } from "@/lib/hooks/use-playback";
import { directionChanges, ema, emaAlpha, emaWeights, firstTurnDown, sma, smaWeights } from "@/lib/simulations/moving-averages";
import { MA_STYLES, MovingAverageChart, MovingAverageLegend } from "./MovingAverageChart";
import { PlaybackControls } from "./PlaybackControls";
import { WeightsChart } from "./WeightsChart";

const TOTAL = MA_DEMO_CANDLES.length;
const WEIGHT_BARS = 20;

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatPrice(Math.abs(value))}`;

/**
 * The SMA vs EMA lesson. One playback cursor (candles revealed) drives the price chart,
 * both averages, the weights panel, the readouts and the step narration.
 */
export function MovingAverageLesson() {
  const playback = usePlayback({ total: TOTAL, initialCursor: 0, eventsPerSecond: 3 });
  const { cursor, playing, seek, playRange } = playback;
  const [focus, setFocus] = useState(0);
  const [period, setPeriod] = useState<MaPeriod>(MA_DEFAULT_PERIOD);
  const [showSma, setShowSma] = useState(true);
  const [showEma, setShowEma] = useState(true);
  const periodGroup = useId();

  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>(640);
  const [weightsRef, weightsWidth] = useElementWidth<HTMLDivElement>(380);

  const chapterIndex = focus > 0 && cursor === maChapterStart(focus) ? focus : maChapterIndexFor(cursor);
  const chapter = MA_CHAPTERS[chapterIndex];
  const isLast = chapterIndex === MA_CHAPTERS.length - 1;
  const chapterDone = cursor >= chapter.end;

  // Full series for the chosen period. The chart only draws the revealed part.
  const series = useMemo(() => {
    const smaSeries = sma(MA_DEMO_CLOSES, period);
    const emaSeries = ema(MA_DEMO_CLOSES, period);
    return {
      smaSeries,
      emaSeries,
      turns: { sma: firstTurnDown(smaSeries, MA_DEMO_PEAK_INDEX), ema: firstTurnDown(emaSeries, MA_DEMO_PEAK_INDEX) },
    };
  }, [period]);

  const view = useMemo(() => {
    const last = cursor - 1;
    const sw = smaWeights(cursor, period);
    const ew = emaWeights(cursor, period);
    const ready = cursor >= period;
    return {
      candles: MA_DEMO_CANDLES.slice(0, cursor),
      close: last >= 0 ? MA_DEMO_CLOSES[last] : null,
      smaValue: last >= 0 ? series.smaSeries[last] : null,
      emaValue: last >= 0 ? series.emaSeries[last] : null,
      smaWeights: sw,
      emaWeights: ew,
      ready,
      /** Share of the EMA that still comes from closes older than the last `period` candles. */
      emaOlderShare: ready ? ew.slice(0, cursor - period).reduce((a, b) => a + b, 0) : 0,
      rangeChanges:
        cursor > MA_DEMO_RANGE_START + 1
          ? {
              sma: directionChanges(series.smaSeries.slice(0, cursor), MA_DEMO_RANGE_START, cursor - 1),
              ema: directionChanges(series.emaSeries.slice(0, cursor), MA_DEMO_RANGE_START, cursor - 1),
            }
          : null,
    };
  }, [cursor, period, series]);

  const latest = view.candles.length ? view.candles[view.candles.length - 1] : null;
  const turnsVisible = chapter.showTurns && cursor > MA_DEMO_PEAK_INDEX;
  const lag =
    series.turns.sma !== null && series.turns.ema !== null && cursor > series.turns.sma ? series.turns.sma - series.turns.ema : null;

  function goToChapter(index: number) {
    setFocus(index);
    seek(maChapterStart(index));
  }

  function playChapter() {
    setFocus(chapterIndex);
    if (chapterDone) playRange(chapter.end, maChapterStart(chapterIndex));
    else playRange(chapter.end);
  }

  function nextChapter() {
    const next = chapterIndex + 1;
    setFocus(next);
    playRange(MA_CHAPTERS[next].end, maChapterStart(next));
  }

  const readouts: [string, string, string?][] = [
    ["Close", view.close !== null ? formatPrice(view.close) : "-"],
    [`SMA ${period}`, view.smaValue !== null && view.smaValue !== undefined ? formatPrice(view.smaValue) : "-", MA_STYLES.sma.color],
    [`EMA ${period}`, view.emaValue !== null && view.emaValue !== undefined ? formatPrice(view.emaValue) : "-", MA_STYLES.ema.color],
    [
      "EMA minus SMA",
      view.smaValue !== null && view.smaValue !== undefined && view.emaValue !== null && view.emaValue !== undefined
        ? signed(view.emaValue - view.smaValue)
        : "-",
    ],
  ];

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Lesson steps">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {MA_CHAPTERS.map((c, i) => {
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

      <section aria-labelledby="ma-chapter-title" className="panel panel-glow grid gap-4 p-4 sm:p-5 md:grid-cols-[150px_1fr]">
        <div className="hidden flex-col items-center gap-2 md:flex">
          <SpeechBubble className="text-xs">{chapter.tip}</SpeechBubble>
          <Mascot pose={chapter.pose} sizes="130px" className="max-h-32 w-auto" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Step {chapterIndex + 1} of {MA_CHAPTERS.length}
          </p>
          <h2 id="ma-chapter-title" aria-live="polite" className="mt-1 text-2xl font-semibold text-ink">
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
                  playRange(chapter.end, maChapterStart(chapterIndex));
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
        <span className="font-medium text-ink">{MA_DEMO_SYMBOL}</span>
        <span aria-hidden="true">·</span>
        <span>1 hour candles</span>
        <span aria-hidden="true">·</span>
        <span>Averages of closing prices</span>
        <span className="basis-full text-subtle sm:ml-auto sm:basis-auto">Invented prices for teaching. Not live market data.</span>
      </div>

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
        <div role="radiogroup" aria-labelledby={periodGroup} className="flex items-center gap-2">
          <span id={periodGroup} className="text-sm font-semibold text-ink">
            Period
          </span>
          <div className="flex rounded-full bg-navy-900/80 p-1 ring-1 ring-white/10">
            {MA_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "h-9 min-w-11 rounded-full px-3 text-sm font-semibold transition",
                  period === p ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40" : "text-muted hover:text-ink",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <fieldset className="flex items-center gap-4">
          <legend className="sr-only">Lines to show</legend>
          {(
            [
              ["sma", "Show SMA", showSma, setShowSma],
              ["ema", "Show EMA", showEma, setShowEma],
            ] as const
          ).map(([key, text, checked, set]) => (
            <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => set(e.target.checked)}
                className="size-4 cursor-pointer"
                style={{ accentColor: MA_STYLES[key].color }}
              />
              {text}
            </label>
          ))}
        </fieldset>
        <p className="text-xs text-subtle">
          EMA weight for the newest close: 2 / ({period} + 1) = {percent(emaAlpha(period))}
        </p>
      </div>

      {/* Price + averages */}
      <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
        <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-ink">1. Price with SMA and EMA</span>
          <span className="text-xs tabular-nums text-muted">
            {latest ? `Candle ${cursor} of ${TOTAL}, ${formatClock(latest.startMs)} UTC` : "Waiting for the first candle"}
          </span>
        </figcaption>
        <div ref={chartRef} className="w-full">
          <MovingAverageChart
            width={chartWidth}
            candles={view.candles}
            slotCount={TOTAL}
            originMs={MA_DEMO_ORIGIN_MS}
            candleMs={MA_DEMO_CANDLE_MS}
            range={MA_DEMO_PRICE_RANGE}
            smaSeries={series.smaSeries}
            emaSeries={series.emaSeries}
            showSma={showSma}
            showEma={showEma}
            peakIndex={turnsVisible ? MA_DEMO_PEAK_INDEX : undefined}
            turns={turnsVisible ? series.turns : undefined}
            rangeStart={chapter.showRange ? MA_DEMO_RANGE_START : undefined}
            label={`Price chart with ${cursor} simulated hourly candles, a ${period} period SMA and a ${period} period EMA.`}
          />
        </div>
        <div className="mt-2">
          <MovingAverageLegend period={period} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {readouts.map(([term, value, color]) => (
            <div key={term} className="rounded-xl bg-navy-800/70 px-2.5 py-2 ring-1 ring-white/5">
              <dt className="flex items-center gap-1.5 text-subtle">
                {color ? <span aria-hidden="true" className="inline-block size-2 rounded-full" style={{ backgroundColor: color }} /> : null}
                {term}
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {turnsVisible || view.rangeChanges ? (
          <ul className="mt-3 space-y-1.5 text-sm text-muted" aria-live="polite">
            {turnsVisible && lag !== null ? (
              <li>
                After the peak, the <span className="font-semibold text-ink">EMA</span> first moved lower on candle {(series.turns.ema as number) + 1} and
                the <span className="font-semibold text-ink">SMA</span> on candle {(series.turns.sma as number) + 1}:{" "}
                <span className="font-semibold text-ink">
                  {lag} {lag === 1 ? "candle" : "candles"} later
                </span>
                .
              </li>
            ) : null}
            {chapter.showRange && view.rangeChanges ? (
              <li>
                Direction changes in the sideways range so far: SMA{" "}
                <span className="font-semibold tabular-nums text-ink">{view.rangeChanges.sma}</span>, EMA{" "}
                <span className="font-semibold tabular-nums text-ink">{view.rangeChanges.ema}</span>.
              </li>
            ) : null}
          </ul>
        ) : null}
      </figure>

      {/* Weights */}
      <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
        <figcaption className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-ink">2. How much each close counts</span>
          <span className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" aria-hidden="true">
                <rect width="12" height="12" rx="2" fill="url(#sma-hatch)" stroke={MA_STYLES.sma.color} />
              </svg>
              SMA (hatched)
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-3 rounded-[3px]" style={{ backgroundColor: MA_STYLES.ema.color }} />
              EMA (solid)
            </span>
          </span>
        </figcaption>
        <div ref={weightsRef} className="w-full">
          <WeightsChart
            width={weightsWidth}
            smaWeights={view.ready ? view.smaWeights : []}
            emaWeights={view.ready ? view.emaWeights : []}
            visible={WEIGHT_BARS}
            label={
              view.ready
                ? `Weights of the last ${Math.min(WEIGHT_BARS, cursor)} closes. Newest close: SMA ${percent(1 / period)}, EMA ${percent(emaAlpha(period))}.`
                : "No weights yet, there are not enough candles for the period."
            }
          />
        </div>
        <p className="mt-1 text-xs text-subtle">
          {view.ready ? (
            <>
              Newest close: SMA {percent(1 / period)}, EMA {percent(emaAlpha(period))}. Closes older than the last {period}: SMA 0%, EMA{" "}
              {percent(view.emaOlderShare)}. The EMA never fully forgets, it just fades.
            </>
          ) : (
            <>Bars show the share of each recent close once there are {period} candles. Labels count candles back from now.</>
          )}
        </p>
      </figure>

      <div className="z-10 rounded-2xl bg-navy-900/90 p-3 ring-1 ring-white/10 backdrop-blur sm:p-4 lg:sticky lg:bottom-3">
        <PlaybackControls playback={playback} eventLabel="Candle" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, FlaskConical, Play, RotateCcw, Trophy, X } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { COLORS } from "@/components/lessons/chart-geometry";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatBtc, formatClockSeconds, formatPrice, formatUsd } from "@/lib/format";
import {
  CANDLE_ROLES,
  MAX_SCORE,
  ROLE_LABEL,
  ROUNDS_PER_GAME,
  explainRole,
  generateGame,
  scoreRound,
  type CandleRole,
  type CandleRound,
  type RoundPicks,
  type RoundResult,
} from "@/lib/games/candle-builder";
import { useLocalBest } from "@/lib/hooks/use-local-best";

export const CANDLE_BUILDER_ID = "candle-builder";

type Phase = "intro" | "picking" | "review" | "done";

function newSeed(): number {
  try {
    return window.crypto.getRandomValues(new Uint32Array(1))[0];
  } catch {
    return Math.floor(Math.random() * 2 ** 32);
  }
}

const ROLE_STYLE: Record<CandleRole, string> = {
  open: "bg-icy/15 text-icy ring-icy/50",
  high: "bg-success/15 text-success ring-success/50",
  low: "bg-danger/15 text-danger ring-danger/50",
  close: "bg-violet/20 text-violet-soft ring-violet/50",
};

export function CandleBuilderGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [rounds, setRounds] = useState<CandleRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [picks, setPicks] = useState<RoundPicks>({});
  const [activeRole, setActiveRole] = useState<CandleRole>("open");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [newBest, setNewBest] = useState(false);
  const { best, submit } = useLocalBest(CANDLE_BUILDER_ID);
  const topRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // When a new round starts or the game ends, bring the top of the game back into view.
  // The review step is skipped on purpose: its result appears right below the trades.
  useEffect(() => {
    if (phase === "intro" || phase === "review") return;
    if (!started.current) {
      started.current = true;
      if (phase === "picking" && roundIndex === 0) return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [phase, roundIndex]);

  const round = rounds[roundIndex];
  const result = phase === "review" ? results[roundIndex] : undefined;
  const score = results.reduce((sum, r) => sum + r.points, 0);
  const allPicked = CANDLE_ROLES.every((role) => picks[role]);

  function start() {
    setRounds(generateGame(newSeed()));
    setRoundIndex(0);
    setPicks({});
    setActiveRole("open");
    setResults([]);
    setNewBest(false);
    setPhase("picking");
  }

  function pickTrade(tradeId: string) {
    if (phase !== "picking") return;
    const next = { ...picks };
    if (next[activeRole] === tradeId) delete next[activeRole];
    else next[activeRole] = tradeId;
    setPicks(next);
    // Move on to the next role that has no pick yet.
    const nextRole = CANDLE_ROLES.find((role) => !next[role]);
    if (next[activeRole] && nextRole) setActiveRole(nextRole);
  }

  function check() {
    if (!round || !allPicked) return;
    setResults([...results, scoreRound(round, picks)]);
    setPhase("review");
  }

  function nextRound() {
    if (roundIndex + 1 >= ROUNDS_PER_GAME) {
      setNewBest(submit(score, MAX_SCORE));
      setPhase("done");
      return;
    }
    setRoundIndex(roundIndex + 1);
    setPicks({});
    setActiveRole("open");
    setPhase("picking");
  }

  if (phase === "intro") {
    return (
      <div ref={topRef} className="panel panel-glow grid scroll-mt-24 gap-5 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-ink">How to play</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
            <li>Each round shows the trades of one simulated minute, in a mixed up order.</li>
            <li>Tap the trade that sets the Open, then the High, the Low and the Close.</li>
            <li>Check your candle and see the real one. One point per correct pick, {MAX_SCORE} points per game.</li>
          </ol>
          <p className="mt-3 text-sm text-subtle">
            Tip: the list is not in time order. Read the clock on each trade.
            {best ? ` Your best on this device: ${best.score} of ${best.max}.` : ""}
          </p>
          <button type="button" onClick={start} className={primaryButton("mt-5")}>
            <Play aria-hidden="true" className="size-4" /> Start game
          </button>
        </div>
        <Mascot pose="trading" sizes="180px" className="mx-auto hidden w-40 md:block" />
      </div>
    );
  }

  if (phase === "done") {
    const perfect = score === MAX_SCORE;
    return (
      <div ref={topRef} className="panel panel-glow grid scroll-mt-24 gap-5 p-5 text-center sm:p-7" role="status">
        <Mascot pose={perfect ? "celebrate" : score >= MAX_SCORE * 0.6 ? "happy" : "thinking"} sizes="160px" className="mx-auto w-32" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Game over</p>
          <h2 className="mt-1 text-3xl font-bold text-ink">
            {score} of {MAX_SCORE} points
          </h2>
          <p className="mt-2 text-muted">
            {perfect
              ? "A perfect game. Every candle built correctly."
              : score >= MAX_SCORE * 0.6
                ? "Nice work. Check the rounds you missed and try again."
                : "Good practice. Remember: open and close follow time, high and low follow price."}
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-subtle">
            <Trophy aria-hidden="true" className="size-4 text-gold" />
            {newBest ? "New best on this device!" : best ? `Best on this device: ${best.score} of ${best.max}` : "Best scores are saved on this device only."}
          </p>
        </div>
        <ul className="mx-auto flex flex-wrap justify-center gap-2" aria-label="Points per round">
          {results.map((r, i) => (
            <li key={i} className="rounded-full bg-navy-950/60 px-3 py-1 text-sm tabular-nums text-muted ring-1 ring-white/10">
              Round {i + 1}: {r.points}/4
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={start} className={primaryButton()}>
            <RotateCcw aria-hidden="true" className="size-4" /> Play again
          </button>
          <Link
            href="/learn/candlesticks-and-volume"
            className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
          >
            Review the lesson <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  // picking or review
  const byId = new Map(round.trades.map((t) => [t.id, t]));
  const yours =
    allPicked && phase === "review"
      ? {
          open: byId.get(picks.open!)!.priceUsd,
          high: byId.get(picks.high!)!.priceUsd,
          low: byId.get(picks.low!)!.priceUsd,
          close: byId.get(picks.close!)!.priceUsd,
        }
      : null;

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          Round {roundIndex + 1} of {ROUNDS_PER_GAME}
          <span className="ml-2 font-normal text-muted">{round.trades.length} trades</span>
        </p>
        <p className="text-sm tabular-nums text-muted">
          Score <span className="font-semibold text-ink">{score}</span> / {MAX_SCORE}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="violet">
          <FlaskConical aria-hidden="true" className="size-3.5" />
          Simulated trades
        </Badge>
        <span>One minute, times in UTC. Not live market data.</span>
      </div>

      {phase === "picking" ? (
        <div className="rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <p className="mb-2 text-sm text-ink" aria-live="polite">
            Tap the trade that sets the <span className="font-semibold">{ROLE_LABEL[activeRole]}</span>.
          </p>
          <div role="group" aria-label="Choose which value to pick" className="flex flex-wrap gap-2">
            {CANDLE_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                aria-pressed={activeRole === role}
                onClick={() => setActiveRole(role)}
                className={cn(
                  "inline-flex h-10 min-w-20 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 transition",
                  activeRole === role ? ROLE_STYLE[role] : "bg-navy-900/70 text-muted ring-white/10 hover:text-ink",
                )}
              >
                {picks[role] ? <Check aria-hidden="true" className="size-3.5" /> : null}
                {ROLE_LABEL[role]}
                <span className="sr-only">{picks[role] ? " (picked)" : " (not picked yet)"}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Trades in this minute">
        {round.trades.map((trade) => {
          const picked = CANDLE_ROLES.filter((role) => picks[role] === trade.id);
          const truth = CANDLE_ROLES.filter((role) => round.answer[role] === trade.id);
          const label = `Trade at ${formatClockSeconds(trade.timestampMs)}, ${formatUsd(trade.priceUsd)}, ${formatBtc(trade.quantityBtc)}.${
            picked.length ? ` Your picks: ${picked.map((r) => ROLE_LABEL[r]).join(", ")}.` : ""
          }${phase === "review" && truth.length ? ` Correct answer for: ${truth.map((r) => ROLE_LABEL[r]).join(", ")}.` : ""}`;
          return (
            <li key={trade.id}>
              <button
                type="button"
                onClick={() => pickTrade(trade.id)}
                disabled={phase !== "picking"}
                aria-label={label}
                className={cn(
                  "flex min-h-14 w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-navy-900/70 px-3.5 py-2.5 text-left ring-1 transition",
                  phase === "picking" ? "ring-white/10 hover:ring-cyan/50" : "cursor-default ring-white/5",
                  picked.includes(activeRole) && phase === "picking" ? "ring-2 ring-cyan/60" : "",
                )}
              >
                <span className="w-16 shrink-0 font-mono text-sm tabular-nums text-muted">{formatClockSeconds(trade.timestampMs).slice(3)}</span>
                <span className="font-semibold tabular-nums text-ink">{formatPrice(trade.priceUsd)}</span>
                <span className="text-xs tabular-nums text-subtle">{trade.quantityBtc.toFixed(4)} BTC</span>
                <span className="ml-auto flex flex-wrap gap-1">
                  {(phase === "review" ? truth : picked).map((role) => (
                    <span key={role} className={cn("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", ROLE_STYLE[role])}>
                      {ROLE_LABEL[role]}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="-mt-2 text-xs text-subtle">Times show minutes and seconds (mm:ss) inside the same minute.</p>

      {phase === "picking" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={check} disabled={!allPicked} className={primaryButton()}>
            Check my candle
          </button>
          {!allPicked ? (
            <p className="text-sm text-muted">Pick all four: {CANDLE_ROLES.filter((r) => !picks[r]).map((r) => ROLE_LABEL[r]).join(", ")} left.</p>
          ) : null}
        </div>
      ) : null}

      {phase === "review" && result && yours ? (
        <section aria-labelledby="round-result-title" className="panel grid gap-4 p-4 sm:p-5 md:grid-cols-[auto_1fr]">
          <div className="flex justify-center gap-6">
            <MiniCandle label="Your candle" ohlc={yours} other={round.candle} />
            <MiniCandle label="Actual candle" ohlc={round.candle} other={yours} />
          </div>
          <div className="min-w-0">
            <h3 id="round-result-title" className="text-lg font-semibold text-ink" aria-live="polite">
              {result.points} of 4 correct
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {CANDLE_ROLES.map((role) => (
                <li key={role} className="flex gap-2">
                  {result.correct[role] ? (
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
                  )}
                  <span className="text-muted">
                    <span className="font-semibold text-ink">
                      {ROLE_LABEL[role]} {result.correct[role] ? "correct" : "missed"}:
                    </span>{" "}
                    {formatUsd(round.candle[role])} at {formatClockSeconds(byId.get(round.answer[role])!.timestampMs)}.{" "}
                    {result.correct[role] ? null : explainRole(role)}
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={nextRound} className={primaryButton("mt-4")}>
              {roundIndex + 1 >= ROUNDS_PER_GAME ? "See my score" : "Next round"} <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function primaryButton(extra?: string) {
  return cn(
    "inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-5 text-sm font-semibold text-navy-950 shadow-glow-cyan transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
    extra,
  );
}

type Ohlc = { open: number; high: number; low: number; close: number };

/** A single candle drawn on a scale shared with the other candle, so both can be compared. */
function MiniCandle({ label, ohlc, other }: { label: string; ohlc: Ohlc; other: Ohlc }) {
  const height = 150;
  const pad = 10;
  const prices = [ohlc.open, ohlc.high, ohlc.low, ohlc.close, other.open, other.high, other.low, other.close];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const y = (p: number) => pad + ((max - p) / (max - min || 1)) * (height - pad * 2);
  const up = ohlc.close >= ohlc.open;
  const color = up ? COLORS.up : COLORS.down;
  const top = Math.min(ohlc.high, ohlc.low, ohlc.open, ohlc.close);
  const bottom = Math.max(ohlc.high, ohlc.low, ohlc.open, ohlc.close);
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        width="56"
        height={height}
        viewBox={`0 0 56 ${height}`}
        role="img"
        aria-label={`${label}: open ${formatPrice(ohlc.open)}, high ${formatPrice(ohlc.high)}, low ${formatPrice(ohlc.low)}, close ${formatPrice(ohlc.close)}.`}
      >
        <line x1="28" x2="28" y1={y(bottom)} y2={y(top)} stroke={color} strokeWidth="2" />
        <rect
          x="16"
          y={y(Math.max(ohlc.open, ohlc.close))}
          width="24"
          height={Math.max(Math.abs(y(ohlc.open) - y(ohlc.close)), 2)}
          rx="3"
          fill={color}
        />
      </svg>
      <figcaption className="text-xs text-muted">{label}</figcaption>
    </figure>
  );
}

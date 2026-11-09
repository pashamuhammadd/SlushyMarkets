"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { cn } from "@/lib/cn";
import { getSonarEngine, peekSonarEngine } from "@/lib/audio/sonar-engine";
import { audibleGain, hasSolo, notesForBar } from "@/lib/sonification/mixer";
import { EMA_SONAR_LAYERS, EMA_SONAR_PRESETS, analyzeEmaSonar, emaSonarEvents, emaSonarMode } from "@/lib/sonification/modes/ema-sonar";
import {
  PRACTICE_CONFIG as CONFIG,
  advanceRound,
  combineResults,
  createRound,
  equity,
  practiceSeeds,
  practiceSeries,
  summarize,
  tradeRound,
  unrealizedPnl,
  visibleBars,
  type RoundResult,
  type RoundState,
  type TradeAction,
} from "@/lib/trading/practice";

const SILENT = "silent";
const TICK_MS = 25;

const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signedMoney = (value: number) => `${value < -0.004 ? "-" : value > 0.004 ? "+" : ""}${money(Math.abs(value))}`;
const pnlColor = (value: number) => (value > 0.004 ? "text-success" : value < -0.004 ? "text-danger" : "text-ink");

const chip = (active: boolean) =>
  cn("h-10 rounded-full px-3.5 text-xs font-semibold ring-1 transition", active ? "bg-cyan/15 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink");

type Phase = "intro" | "playing" | "between" | "final";

const DISCLAIMER = [
  "This is an educational simulation. There is no real money and no real profit.",
  "The charts are simulated. Results here, and results on past market data, do not predict live trading performance.",
  "Sound is an experiment. Using it does not guarantee better decisions.",
];

/** Practice Mode: three rounds of virtual trading. Results stay on screen and are never stored or sent. */
export function PracticeGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [attempt, setAttempt] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<RoundState>(createRound);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [sound, setSound] = useState<string>(SILENT);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const volumeId = useId();

  const seed = practiceSeeds(attempt)[roundIndex];
  const analysis = useMemo(() => analyzeEmaSonar(practiceSeries(seed), CONFIG.barsPerRound), [seed]);
  const lastSoundBar = useRef(-1);
  const soundRef = useRef(sound);

  const applySound = useCallback(async (next: string, vol: number, mute: boolean) => {
    if (next === SILENT) return;
    try {
      const engine = getSonarEngine();
      engine.setVolume(vol);
      engine.setMuted(mute);
      await engine.resume();
      setAudioError(null);
    } catch {
      setAudioError("Sound could not start in this browser. You can keep trading in silence.");
    }
  }, []);

  function chooseSound(next: string) {
    setSound(next);
    soundRef.current = next;
    if (next === SILENT) stopSound();
    else void applySound(next, volume, muted);
  }

  useEffect(() => stopSound, []);

  // One clock drives the chart, the account and the notes, so they cannot drift apart.
  useEffect(() => {
    if (phase !== "playing") return;
    const startedAt = performance.now();
    lastSoundBar.current = -1;
    const timer = window.setInterval(() => {
      const target = Math.floor((performance.now() - startedAt) / 1000 / CONFIG.barSeconds);
      setRound((current) => advanceRound(current, analysis.bars, target));
      if (target <= lastSoundBar.current || target >= analysis.bars.length) return;
      lastSoundBar.current = target;
      playBar(soundRef.current, target, analysis);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase, analysis]);

  useEffect(() => {
    if (phase !== "playing" || !round.finished) return;
    stopSound();
    const result = summarize(round.account);
    const timer = window.setTimeout(() => {
      setResults((prev) => [...prev, result]);
      setPhase(roundIndex + 1 >= CONFIG.rounds ? "final" : "between");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [phase, round, roundIndex]);

  function start() {
    void applySound(sound, volume, muted);
    setRound(createRound());
    setPhase("playing");
  }

  function nextRound() {
    void applySound(sound, volume, muted);
    setRoundIndex((i) => i + 1);
    setRound(createRound());
    setPhase("playing");
  }

  function restart() {
    stopSound();
    setAttempt((a) => a + 1);
    setRoundIndex(0);
    setResults([]);
    setRound(createRound());
    setPhase("intro");
  }

  const act = (action: TradeAction) => setRound((current) => tradeRound(current, analysis.bars, action));

  const soundControls = (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Sound</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={sound === SILENT} onClick={() => chooseSound(SILENT)} className={chip(sound === SILENT)}>
            Silent
          </button>
          {EMA_SONAR_PRESETS.map((preset) => (
            <button key={preset.id} type="button" aria-pressed={sound === preset.id} onClick={() => chooseSound(preset.id)} className={chip(sound === preset.id)}>
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>
      {sound !== SILENT ? (
        <div className="flex max-w-sm items-center gap-3">
          <button
            type="button"
            aria-pressed={muted}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            onClick={() => {
              setMuted(!muted);
              void applySound(sound, volume, !muted);
            }}
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink ring-1 ring-white/10 hover:bg-white/5"
          >
            {muted ? <VolumeX aria-hidden="true" className="size-4 text-danger" /> : <Volume2 aria-hidden="true" className="size-4" />}
          </button>
          <label htmlFor={volumeId} className="text-xs text-muted">
            Volume
          </label>
          <input
            id={volumeId}
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setVolume(next);
              void applySound(sound, next, muted);
            }}
            className="h-2 w-full cursor-pointer accent-cyan"
          />
        </div>
      ) : null}
      {audioError ? (
        <p role="alert" className="text-sm text-danger">
          {audioError}
        </p>
      ) : null}
    </div>
  );

  if (phase === "intro") {
    return (
      <div className="space-y-5">
        <section className="panel panel-glow space-y-5 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-ink">How it works</h2>
          <ul className="grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">{CONFIG.rounds} rounds, 1 minute each.</span> Each chart starts with one candle and grows. You only see what has already happened.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">{money(CONFIG.startingBalance)} virtual per round.</span> Go long, go short or close. Each transaction pays a {(CONFIG.feeRate * 100).toFixed(2)}% fee and {(CONFIG.slippageRate * 100).toFixed(2)}% slippage, and any open position closes when the minute ends.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">Sound is optional.</span> The presets use EMA Sonar: a line gets louder as price comes close to it. Change the sound at any time.
            </li>
          </ul>
          {soundControls}
          <button
            type="button"
            onClick={start}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-6 text-sm font-semibold text-navy-950 shadow-glow-violet hover:brightness-110"
          >
            <Play aria-hidden="true" className="size-4" /> Start round 1
          </button>
        </section>
        <Disclaimer />
      </div>
    );
  }

  if (phase === "between" || phase === "final") {
    const total = combineResults(results);
    return (
      <div className="space-y-5">
        <section className="panel panel-glow p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {phase === "final" ? <Mascot pose="quizTryAgain" sizes="140px" className="w-28 shrink-0" /> : null}
            <div>
              <h2 className="text-2xl font-semibold text-ink">{phase === "final" ? "Your practice results" : `Round ${results.length} complete`}</h2>
              <p className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", pnlColor(total.netPnl))}>
                {signedMoney(total.netPnl)} <span className="text-base text-muted">virtual, after costs</span>
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-96 text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">Round</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Profit or loss</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Max drawdown</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Transactions</th>
                  <th scope="col" className="py-2 font-semibold">Trading costs</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-muted">
                {[...results.map((r, i) => ({ label: `${i + 1}`, r })), ...(phase === "final" ? [{ label: "Overall", r: total }] : [])].map(({ label, r }) => (
                  <tr key={label} className={cn("border-t border-white/10", label === "Overall" && "font-semibold text-ink")}>
                    <th scope="row" className="py-2 pr-3 font-semibold text-ink">{label}</th>
                    <td className={cn("py-2 pr-3", pnlColor(r.netPnl))}>{signedMoney(r.netPnl)}</td>
                    <td className="py-2 pr-3">{r.maxDrawdownPct.toFixed(2)}%</td>
                    <td className="py-2 pr-3">{r.transactions}</td>
                    <td className="py-2">{money(r.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">
            These results are not a prediction of real trading ability. They stay on this screen. Nothing is saved or sent.
          </p>
          {phase === "between" ? <div className="mt-5">{soundControls}</div> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {phase === "between" ? (
              <button type="button" onClick={nextRound} className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-5 text-sm font-semibold text-navy-950">
                Start round {results.length + 1} <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            ) : (
              <>
                <button type="button" onClick={restart} className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-5 text-sm font-semibold text-navy-950">
                  <RotateCcw aria-hidden="true" className="size-4" /> Practice on new charts
                </button>
                <Link href="/audio-lab/playground" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-ink ring-1 ring-white/15 hover:bg-white/5">
                  Explore the Sound Playground
                </Link>
              </>
            )}
          </div>
        </section>
        <Disclaimer />
      </div>
    );
  }

  const price = analysis.bars[round.bar].close;
  const position = round.account.position;
  const open = unrealizedPnl(round.account, price);
  const secondsLeft = Math.max(0, Math.ceil((CONFIG.barsPerRound - 1 - round.bar) * CONFIG.barSeconds));
  const tradeButton = "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-4">
      <section className="panel p-3 sm:p-5" aria-label={`Round ${roundIndex + 1} of ${CONFIG.rounds}`}>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-ink">
            Round {roundIndex + 1} of {CONFIG.rounds}
            <span className="ml-2 text-xs font-normal text-subtle">Simulated chart</span>
          </p>
          <p role="timer" aria-live="off" className="font-mono text-lg tabular-nums text-cyan-soft">
            0:{String(secondsLeft).padStart(2, "0")}
          </p>
        </div>
        <PracticeChart bar={round.bar} analysis={analysis} entry={position?.entryPrice ?? null} />
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label="Price" value={price.toFixed(2)} />
          <Stat label="Account value" value={money(equity(round.account, price))} />
          <Stat label="Open P&L" value={signedMoney(open)} className={pnlColor(open)} />
          <Stat label="Realized P&L" value={signedMoney(round.account.realizedPnl - round.account.fees)} className={pnlColor(round.account.realizedPnl - round.account.fees)} hint="after costs" />
        </dl>
        <p role="status" className="mt-3 text-sm text-muted">
          {position ? `${position.side === "long" ? "Long" : "Short"} from ${position.entryPrice.toFixed(2)}` : "No open position"} · {round.account.transactions} {round.account.transactions === 1 ? "transaction" : "transactions"} · {money(round.account.fees)} costs
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={position?.side === "long"} onClick={() => act("long")} className={cn(tradeButton, "bg-success/15 text-success ring-success/50 hover:bg-success/25")}>
            <ArrowUp aria-hidden="true" className="size-4" /> Long
          </button>
          <button type="button" disabled={position?.side === "short"} onClick={() => act("short")} className={cn(tradeButton, "bg-danger/15 text-danger ring-danger/50 hover:bg-danger/25")}>
            <ArrowDown aria-hidden="true" className="size-4" /> Short
          </button>
          <button type="button" disabled={!position} onClick={() => act("close")} className={cn(tradeButton, "text-ink ring-white/20 hover:bg-white/5")}>
            <X aria-hidden="true" className="size-4" /> Close
          </button>
        </div>
      </section>
      <section className="panel p-4">{soundControls}</section>
      <Disclaimer compact />
    </div>
  );
}

function stopSound() {
  peekSonarEngine()?.stopAll();
}

function playBar(presetId: string, index: number, analysis: ReturnType<typeof analyzeEmaSonar>) {
  const preset = EMA_SONAR_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;
  const engine = peekSonarEngine();
  if (!engine || engine.ctx.state !== "running") return;
  const anySolo = hasSolo(preset.layers);
  const when = engine.ctx.currentTime + 0.03;
  for (const layer of emaSonarMode.layers) {
    const settings = preset.layers[layer.id];
    engine.setLayerGain(layer.id, audibleGain(settings, anySolo));
    for (const note of notesForBar(layer, settings, emaSonarEvents(layer.id, index, analysis), index)) {
      engine.playTone(layer.id, settings.voice, when + note.offsetSec, note.hz, note.amp, note.durationSec);
    }
  }
}

function Stat({ label, value, className, hint }: { label: string; value: string; className?: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-navy-900/70 p-3 ring-1 ring-white/10">
      <dt className="text-xs text-subtle">
        {label}
        {hint ? ` (${hint})` : ""}
      </dt>
      <dd className={cn("mt-0.5 font-semibold tabular-nums text-ink", className)}>{value}</dd>
    </div>
  );
}

function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={cn("text-muted", compact ? "text-xs" : "panel p-5 text-sm")}>
      {compact ? null : <h2 className="mb-2 text-lg font-semibold text-ink">Please read</h2>}
      <ul className={cn(compact ? "space-y-1" : "list-disc space-y-1.5 pl-5")}>
        {DISCLAIMER.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}

const CHART = { width: 960, height: 400, pad: 10 };

/** Candles up to the current bar only. The price scale also comes only from revealed bars, so its range cannot hint at the future. */
function PracticeChart({ bar, analysis, entry }: { bar: number; analysis: ReturnType<typeof analyzeEmaSonar>; entry: number | null }) {
  const bars = visibleBars(analysis.bars, bar);
  const lines = EMA_SONAR_LAYERS.map((l) => ({ ...l, values: visibleBars(analysis.emas[l.id], bar) }));
  const prices = [...bars.flatMap((b) => [b.high, b.low]), ...lines.flatMap((l) => l.values), ...(entry === null ? [] : [entry])];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const span = Math.max(max - min, 0.01);
  const slot = (CHART.width - CHART.pad * 2) / CONFIG.barsPerRound;
  const x = (i: number) => CHART.pad + slot * (i + 0.5);
  const y = (price: number) => CHART.pad + ((max - price) / span) * (CHART.height - CHART.pad * 2);

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Simulated candlestick chart, ${bars.length} of ${CONFIG.barsPerRound} bars revealed.`}
      className="h-60 w-full rounded-2xl bg-navy-950/60 ring-1 ring-white/10 sm:h-80"
    >
      {lines.map((l) => (
        <polyline key={l.id} fill="none" stroke={l.color} strokeOpacity={0.75} strokeWidth={1.5} vectorEffect="non-scaling-stroke" points={l.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      ))}
      {entry !== null ? <line x1={0} x2={CHART.width} y1={y(entry)} y2={y(entry)} stroke="var(--color-gold)" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" /> : null}
      {bars.map((b, i) => {
        const up = b.close >= b.open;
        const color = up ? "var(--color-success)" : "var(--color-danger)";
        return (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={y(b.high)} y2={y(b.low)} stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <rect x={x(i) - slot * 0.32} width={slot * 0.64} y={y(Math.max(b.open, b.close))} height={Math.max(Math.abs(y(b.open) - y(b.close)), 1)} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

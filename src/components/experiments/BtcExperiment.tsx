"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type SyntheticEvent } from "react";
import { ArrowDown, ArrowUp, Lock, Play, RefreshCw, X } from "lucide-react";
import { SqueezePlayer } from "@/lib/audio/squeeze-player";
import { cn } from "@/lib/cn";
import {
  EXPERIMENT_SETTINGS,
  accountEquity,
  advanceBar,
  createPaperAccount,
  experimentResult,
  queueOrder,
  unrealized,
  type ExperimentResult,
  type Fill,
  type PaperAccount,
  type QueuedOrder,
} from "@/lib/experiments/engine";
import { BTC_2025_VERSION, type SoundSetting, type StatsGroup } from "@/lib/experiments/rounds";
import { BAR_SECONDS, barSoundEvents, experimentYear, speedLevel, type RawCandle, type SqueezeBar } from "@/lib/experiments/squeeze";

const ATTEMPT_KEY = "slushymarkets-btc-2025-attempt-v1";
const API = "/api/experiments/rounds";
const VIDEO_SRC = "/experiments/training-2024.mp4";
const COUNTDOWN_SECONDS = 10;
const WINDOW_BARS = 60;

type ShareChoice = "share" | "private";
type Attempt = {
  startedAt: number;
  completed: boolean;
  share: ShareChoice;
  submissionId: string;
  shared?: boolean;
  sound?: SoundSetting;
  result?: ExperimentResult;
};

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function readRaw(): string | null {
  try {
    return localStorage.getItem(ATTEMPT_KEY);
  } catch {
    return null;
  }
}
function writeAttempt(attempt: Attempt): boolean {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}
function parseAttempt(raw: string | null): Attempt | null {
  try {
    return raw ? (JSON.parse(raw) as Attempt) : null;
  } catch {
    return null;
  }
}

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const signed = (v: number) => `${v > 0.004 ? "+" : ""}${money(v)}`;
const tone = (v: number) => (v > 0.004 ? "text-success" : v < -0.004 ? "text-danger" : "text-ink");
const factor = (v: number | null) => (v === null ? "N/A" : Number.isFinite(v) ? v.toFixed(2) : "No losing trades");

type Phase = "prepare" | "countdown" | "running";
type Run = { index: number; account: PaperAccount };

async function submitRound(attempt: Attempt): Promise<boolean> {
  const r = attempt.result;
  if (!r) return false;
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: attempt.submissionId,
        experiment: "btc-2025",
        experimentVersion: BTC_2025_VERSION,
        round: 1,
        sound: attempt.sound ?? "off",
        netPnl: Math.round(r.netPnl * 100) / 100,
        drawdownPct: Math.min(100, Math.round(r.drawdownPct * 100) / 100),
        tradeCount: r.tradeCount,
        wins: r.wins,
        fees: Math.round(r.fees * 100) / 100,
        winningPnl: Math.round(r.winningPnl * 100) / 100,
        losingPnl: Math.round(r.losingPnl * 100) / 100,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    return response.status === 201;
  } catch {
    return false;
  }
}

/** Watch 2024, then one attempt at paper trading 2025. Virtual money only. */
export function BtcExperiment({ candles }: { candles: RawCandle[] }) {
  const year = useMemo(() => experimentYear(candles, 2025), [candles]);
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const attempt = useMemo(() => parseAttempt(raw), [raw]);

  const [phase, setPhase] = useState<Phase>("prepare");
  const [trainingDone, setTrainingDone] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [share, setShare] = useState<ShareChoice | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [run, setRun] = useState<Run>({ index: -1, account: createPaperAccount() });
  const [storageError, setStorageError] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "sending" | "failed">("idle");
  const [statsVersion, setStatsVersion] = useState(0);

  const runRef = useRef(run);
  const soundRef = useRef(soundOn);
  const mixedRef = useRef(false);
  const initialSoundRef = useRef<SoundSetting>("on");
  const playerRef = useRef<SqueezePlayer | null>(null);
  const watchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const attemptRef = useRef(attempt);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);
  useEffect(() => () => playerRef.current?.close(), []);

  function commit(next: Run) {
    runRef.current = next;
    setRun(next);
  }

  async function sendShared(current: Attempt) {
    setShareStatus("sending");
    const ok = await submitRound(current);
    if (ok) {
      writeAttempt({ ...current, shared: true });
      setStatsVersion((v) => v + 1);
    }
    setShareStatus(ok ? "idle" : "failed");
  }

  // The countdown and the round both follow the wall clock, so a busy tab cannot stretch them.
  useEffect(() => {
    if (phase !== "countdown" || !year) return;
    const ends = Date.now() + COUNTDOWN_SECONDS * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      setCount(left);
      if (left === 0) {
        window.clearInterval(timer);
        setPhase("running");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase, year]);

  useEffect(() => {
    if (phase !== "running" || !year) return;
    const startedAt = Date.now() + 1000;
    const { days } = year;
    let finished = false;
    const timer = window.setInterval(() => {
      if (finished) return;
      const target = Math.min(days.length - 1, Math.floor((Date.now() - startedAt) / (BAR_SECONDS * 1000)));
      let { index, account } = runRef.current;
      if (index >= target) return;
      while (index < target) {
        index += 1;
        account = advanceBar(account, days[index], index === days.length - 1);
      }
      commit({ index, account });
      if (soundRef.current) playerRef.current?.play(barSoundEvents(days[index]));
      if (index === days.length - 1) {
        finished = true;
        window.clearInterval(timer);
        playerRef.current?.cut();
        const current = attemptRef.current;
        if (!current) return;
        const done: Attempt = { ...current, completed: true, result: experimentResult(account), sound: mixedRef.current ? "mixed" : initialSoundRef.current };
        writeAttempt(done);
        if (done.share === "share") void sendShared(done);
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [phase, year]);

  if (!year) return <p className="panel p-5 text-muted">The historical data for this experiment could not be loaded.</p>;

  function onVideoTime(e: SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    if (!video.seeking && video.currentTime >= lastTimeRef.current && video.currentTime - lastTimeRef.current < 1.5 && lastTimeRef.current <= watchedRef.current + 0.3) {
      watchedRef.current = Math.max(watchedRef.current, video.currentTime);
    }
    lastTimeRef.current = video.currentTime;
    if (video.duration) setProgress(Math.min(100, Math.floor((watchedRef.current / video.duration) * 100)));
  }

  function onVideoSeeking(e: SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    if (video.currentTime > watchedRef.current + 0.3) video.currentTime = watchedRef.current;
    lastTimeRef.current = video.currentTime;
  }

  function onVideoEnded(e: SyntheticEvent<HTMLVideoElement>) {
    if (Number.isFinite(e.currentTarget.duration) && watchedRef.current >= e.currentTarget.duration - 0.6) {
      setProgress(100);
      setTrainingDone(true);
    }
  }

  async function start() {
    if (!share || attemptRef.current || readRaw()) return;
    const created: Attempt = { startedAt: Date.now(), completed: false, share, submissionId: crypto.randomUUID() };
    if (!writeAttempt(created)) {
      setStorageError(true);
      return;
    }
    attemptRef.current = created;
    initialSoundRef.current = soundOn ? "on" : "off";
    setCount(COUNTDOWN_SECONDS);
    setPhase("countdown");
    playerRef.current ??= new SqueezePlayer();
    await playerRef.current.ready();
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    soundRef.current = next;
    if (phase !== "prepare") mixedRef.current = true;
    if (!next) playerRef.current?.cut();
    else {
      playerRef.current ??= new SqueezePlayer();
      void playerRef.current.ready();
    }
  }

  const order = (o: QueuedOrder) => commit({ ...runRef.current, account: queueOrder(runRef.current.account, o) });

  if (attempt?.completed && attempt.result) {
    const r = attempt.result;
    return (
      <div className="space-y-5">
        <section className="panel panel-glow p-5 sm:p-6" aria-labelledby="exp-result-title">
          <h2 id="exp-result-title" className="text-2xl font-semibold text-ink">
            Your simulated 2025 result
          </h2>
          <p className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", tone(r.netPnl))}>
            {signed(r.netPnl)} <span className="text-base text-muted">({r.returnPct.toFixed(2)}%, after costs)</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Winning / closed trades" value={`${r.wins} / ${r.tradeCount}`} />
            <Stat label="Profit factor" value={factor(r.profitFactor)} />
            <Stat label="Max daily-close drawdown" value={`${r.drawdownPct.toFixed(2)}%`} />
            <Stat label="Modeled fees" value={money(r.fees)} />
          </dl>
          <p className="mt-4 text-sm text-muted">This 2025 round can only be played once in this browser. It is an educational result, not proof of real-world trading ability.</p>
          <div aria-live="polite" className="mt-3 text-sm">
            {attempt.share === "private" ? <p className="text-muted">You chose to keep this result private. Nothing was sent.</p> : null}
            {attempt.shared ? <p className="text-success">Your round summary was added to the shared statistics.</p> : null}
            {attempt.share === "share" && !attempt.shared ? (
              shareStatus === "sending" ? (
                <p className="text-muted">Sending your round summary.</p>
              ) : (
                <p className="flex flex-wrap items-center gap-3 text-danger">
                  Your summary has not been saved to the shared statistics.
                  <button type="button" onClick={() => void sendShared(attempt)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-ink ring-1 ring-white/20 hover:bg-white/5">
                    <RefreshCw aria-hidden="true" className="size-3.5" /> Try again
                  </button>
                </p>
              )
            ) : null}
          </div>
        </section>
        <ExperimentStats version={statsVersion} />
        <Explainer />
      </div>
    );
  }

  if (attempt && phase === "prepare") {
    return (
      <div className="space-y-5">
        <p className="panel p-5 text-muted">
          <Lock aria-hidden="true" className="mr-2 inline size-4 text-gold" />
          This browser has already started its one attempt, so 2025 is locked. Refreshing or leaving does not grant a new one.
        </p>
        <ExperimentStats version={statsVersion} />
      </div>
    );
  }

  if (phase === "prepare") {
    const chip = (active: boolean) => cn("block cursor-pointer rounded-2xl p-4 text-sm ring-1 transition", active ? "bg-cyan/10 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink");
    return (
      <div className="space-y-5">
        <section className="panel p-4 sm:p-6" aria-labelledby="exp-watch-title">
          <h2 id="exp-watch-title" className="text-2xl font-semibold text-ink">Part 1: watch the full 2024 replay</h2>
          <p className="mt-1 text-sm text-muted">Watch and listen as the year unfolds in about 2 minutes 34 seconds. You can pause and go back, but not skip ahead. Paper trading unlocks when it ends.</p>
          <video
            className="mt-4 w-full rounded-2xl bg-navy-950 ring-1 ring-white/10"
            src={VIDEO_SRC}
            controls
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            onTimeUpdate={onVideoTime}
            onSeeking={onVideoSeeking}
            onRateChange={(e) => {
              e.currentTarget.playbackRate = 1;
            }}
            onEnded={onVideoEnded}
            onError={() => setVideoError(true)}
          />
          <p aria-live="polite" className={cn("mt-2 text-sm", videoError ? "text-danger" : "text-subtle")}>
            {videoError ? "The video could not load. Try reloading this page." : trainingDone ? "2024 complete. Paper trading is unlocked." : `2025 locked: ${progress}% of 2024 watched.`}
          </p>
        </section>

        <section className="panel space-y-5 p-4 sm:p-6" aria-labelledby="exp-trade-title">
          <h2 id="exp-trade-title" className="text-2xl font-semibold text-ink">Part 2: paper trade 2025</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>One attempt in this browser. No pause, rewind, restart or replay, for about 3 minutes.</li>
            <li>Starting the countdown uses your attempt, and leaving or refreshing will not reset it.</li>
            <li>{money(EXPERIMENT_SETTINGS.initial)} virtual balance, {money(EXPERIMENT_SETTINGS.notional)} per trade, {EXPERIMENT_SETTINGS.fee * 100}% fee and {EXPERIMENT_SETTINGS.slippage * 100}% slippage per side, no commission.</li>
          </ul>
          <fieldset>
            <legend className="font-semibold text-ink">Do you want to share this round&apos;s results?</legend>
            <p className="mt-1 text-sm text-muted">
              Optional, and it does not change the experiment. Choose before you start, so the shared statistics do not only include people who did well. If you share, your finished round adds its experiment version, round, sound setting, net P&amp;L, drawdown, trade count, wins, fees and total winning and losing trade P&amp;L. No names, emails, wallets or individual trades. Once a finished round is shared it cannot be removed individually.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className={chip(share === "share")}>
                <input type="radio" name="exp-share" className="mr-2 accent-cyan" checked={share === "share"} onChange={() => setShare("share")} /> Share my round summary
              </label>
              <label className={chip(share === "private")}>
                <input type="radio" name="exp-share" className="mr-2 accent-cyan" checked={share === "private"} onChange={() => setShare("private")} /> Keep my results private
              </label>
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" className="size-4 accent-cyan" checked={soundOn} onChange={toggleSound} /> Sound on (turn off to trade with the chart only)
          </label>
          {storageError ? <p role="alert" className="text-sm text-danger">This experiment needs browser storage to keep its one-attempt rule. Please enable it and reload.</p> : null}
          <button
            type="button"
            disabled={!trainingDone || !share}
            onClick={() => void start()}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-6 text-sm font-semibold text-navy-950 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play aria-hidden="true" className="size-4" /> Start the 10-second countdown
          </button>
          {!trainingDone || !share ? <p className="text-sm text-subtle">{!trainingDone ? "Finish the 2024 replay to unlock this." : "Choose whether to share to continue."}</p> : null}
        </section>
        <ExperimentStats version={statsVersion} />
        <Explainer />
      </div>
    );
  }

  const current = run.index < 0 ? year.all[year.startIndex - 1] : year.days[run.index];
  const position = run.account.position;
  const pending = run.account.pending;
  const equity = accountEquity(run.account, current.c);
  const live = phase === "running";
  const status = current.entry ? "Compression begins" : current.release ? "Squeeze released" : current.squeeze ? `Compression, day ${current.age}, drum speed ${speedLevel(current.age)}` : `Outside compression, day ${current.age}`;
  const pendingLabel = pending === null ? "" : `, ${pending === 1 ? "long" : pending === -1 ? "short" : "close"} queued for the next open`;
  const tradeButton = "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section className="panel relative p-3 sm:p-5" aria-label="2025 paper trading round">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold tabular-nums text-ink">
          {current.date} UTC <span className="font-normal text-muted">{money(current.c)}</span>
        </p>
        <p className="text-xs tabular-nums text-subtle">{run.index < 0 ? "Preview" : `Day ${run.index + 1} of ${year.days.length}`}</p>
      </div>
      <SqueezeChart bars={year.all.slice(Math.max(0, year.startIndex + run.index - WINDOW_BARS + 1), year.startIndex + run.index + 1)} fills={run.account.fills} />
      {phase === "countdown" ? (
        <p role="timer" className="absolute inset-0 grid place-items-center rounded-card bg-navy-950/75 font-display text-7xl font-bold text-cyan-soft">{count}</p>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Account value" value={money(equity)} />
        <Stat label="Net P&L" value={signed(equity - EXPERIMENT_SETTINGS.initial)} className={tone(equity - EXPERIMENT_SETTINGS.initial)} />
        <Stat label="Fees" value={money(run.account.fees)} />
        <Stat label="Closed trades" value={String(run.account.trades.length)} />
      </dl>
      <p role="status" className="mt-3 text-sm text-muted">
        {position ? `${position.side === 1 ? "Long" : "Short"} from ${money(position.entry)}, open P&L ${signed(unrealized(run.account, current.c))}` : "Flat, no position"}
        {pendingLabel}
      </p>
      <p className="text-xs text-subtle">{status}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={!live} onClick={() => order(1)} className={cn(tradeButton, "bg-success/15 text-success ring-success/50")}>
          <ArrowUp aria-hidden="true" className="size-4" /> Long
        </button>
        <button type="button" disabled={!live} onClick={() => order(-1)} className={cn(tradeButton, "bg-danger/15 text-danger ring-danger/50")}>
          <ArrowDown aria-hidden="true" className="size-4" /> Short
        </button>
        <button type="button" disabled={!live || (!position && pending === null)} onClick={() => order(0)} className={cn(tradeButton, "text-ink ring-white/20")}>
          <X aria-hidden="true" className="size-4" /> Close
        </button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" className="size-4 accent-cyan" checked={soundOn} onChange={toggleSound} /> Sound on
      </label>
    </section>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl bg-navy-900/70 p-3 ring-1 ring-white/10">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className={cn("mt-0.5 font-semibold tabular-nums text-ink", className)}>{value}</dd>
    </div>
  );
}

const VIEW = { w: 960, h: 400, pad: 12 };

/** Only ever receives bars that have already been revealed, including for its price scale. */
function SqueezeChart({ bars, fills }: { bars: SqueezeBar[]; fills: Fill[] }) {
  const prices = bars.flatMap((b) => [b.l, b.h, b.bbL, b.bbH, b.kcL, b.kcH]);
  const top = Math.max(...prices);
  const bottom = Math.min(...prices);
  const span = Math.max(top - bottom, 1);
  const slot = (VIEW.w - VIEW.pad * 2) / WINDOW_BARS;
  const x = (i: number) => VIEW.pad + slot * (i + 0.5);
  const y = (p: number) => VIEW.pad + ((top - p) / span) * (VIEW.h - VIEW.pad * 2);
  const line = (pick: (b: SqueezeBar) => number) => bars.map((b, i) => `${x(i)},${y(pick(b))}`).join(" ");
  const up = "var(--color-cyan)";
  const down = "var(--color-magenta)";

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="none" role="img" aria-label="Daily BTC/USD candles with Bollinger Bands, Keltner Channels and a 14-period EMA. Revealed days only." className="h-64 w-full rounded-2xl bg-navy-950/60 ring-1 ring-white/10 sm:h-96">
        {bars.map((b, i) => (b.squeeze ? <rect key={b.date} x={x(i) - slot / 2} y={0} width={slot} height={VIEW.h} fill="var(--color-violet)" opacity={0.14} /> : null))}
        {bars.map((b, i) => (
          <g key={b.date}>
            <line x1={x(i)} x2={x(i)} y1={y(b.h)} y2={y(b.l)} stroke={b.c >= b.o ? up : down} vectorEffect="non-scaling-stroke" />
            <rect x={x(i) - slot * 0.3} width={slot * 0.6} y={y(Math.max(b.o, b.c))} height={Math.max(Math.abs(y(b.o) - y(b.c)), 1.5)} fill={b.c >= b.o ? up : down} />
          </g>
        ))}
        {[(b: SqueezeBar) => b.kcL, (b: SqueezeBar) => b.kcH].map((pick, i) => (
          <polyline key={i} points={line(pick)} fill="none" stroke="#fff" strokeOpacity={0.75} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        ))}
        {[(b: SqueezeBar) => b.bbL, (b: SqueezeBar) => b.bbH].map((pick, i) => (
          <polyline key={i} points={line(pick)} fill="none" stroke="var(--color-magenta)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
        <polyline points={line((b) => b.ema14)} fill="none" stroke="var(--color-cyan-soft)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {fills.map((f, n) => {
          const i = bars.findIndex((b) => b.date === f.date);
          if (i < 0) return null;
          const dir = f.action === "SHORT" ? -1 : 1;
          const color = f.action === "LONG" ? "var(--color-success)" : f.action === "SHORT" ? "var(--color-danger)" : "#fff";
          return <path key={n} d={`M${x(i)} ${y(f.price) - dir * 12} L${x(i) - 9} ${y(f.price) + dir * 8} L${x(i) + 9} ${y(f.price) + dir * 8} Z`} fill={color} />;
        })}
      </svg>
      <span className="pointer-events-none absolute left-2 top-2 text-[11px] tabular-nums text-subtle">{money(top)}</span>
      <span className="pointer-events-none absolute bottom-2 left-2 text-[11px] tabular-nums text-subtle">{money(bottom)}</span>
    </div>
  );
}

type StatsState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; groups: StatsGroup[] };

function ExperimentStats({ version }: { version: number }) {
  const [state, setState] = useState<StatsState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    fetch(`${API}?experiment=btc-2025`, { cache: "no-store", signal: AbortSignal.timeout(12_000) })
      .then(async (response) => {
        const data = (await response.json()) as { ok: boolean; groups?: StatsGroup[] };
        if (active) setState(response.ok && data.groups ? { kind: "ready", groups: data.groups } : { kind: "error" });
      })
      .catch(() => {
        if (active) setState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [version]);

  const groups = state.kind === "ready" ? state.groups.filter((g) => g.stats) : [];
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="exp-stats-title">
      <h2 id="exp-stats-title" className="text-xl font-semibold text-ink">Shared results for this experiment</h2>
      <p className="mt-1 text-sm text-muted">Voluntary, simulated results. Other experiments and the practice page are counted separately.</p>
      {state.kind === "loading" ? <p className="mt-3 text-sm text-subtle">Loading statistics.</p> : null}
      {state.kind === "error" ? <p className="mt-3 text-sm text-subtle">Statistics are unavailable right now. The experiment still works.</p> : null}
      {state.kind === "ready" && groups.length === 0 ? <p className="mt-3 text-sm text-subtle">No shared rounds yet.</p> : null}
      {groups.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-subtle">
              <tr>
                {["Group", "Completed rounds", "Average net", "Average drawdown", "Pooled win rate", "Pooled profit factor"].map((h) => (
                  <th key={h} scope="col" className="py-2 pr-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums text-muted">
              {groups.map(({ label, stats }) => (
                <tr key={label} className="border-t border-white/10">
                  <th scope="row" className="py-2 pr-3 font-semibold text-ink">{label}</th>
                  <td className="py-2 pr-3">{stats!.rounds}</td>
                  <td className={cn("py-2 pr-3", tone(stats!.averageNet))}>{signed(stats!.averageNet)}</td>
                  <td className="py-2 pr-3">{stats!.averageDrawdown.toFixed(2)}%</td>
                  <td className="py-2 pr-3">{stats!.winRate === null ? "N/A" : `${stats!.winRate.toFixed(2)}%`}</td>
                  <td className="py-2">{factor(stats!.profitFactor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-subtle">Counts are rounds, not unique people, and submissions are not verified live trades. Results are self-selected, and sound groups are observational, not a controlled comparison. A profitable group does not show a trading edge.</p>
    </section>
  );
}

function Explainer() {
  return (
    <section className="panel space-y-3 p-5 text-sm text-muted sm:p-6" aria-labelledby="exp-how-title">
      <h2 id="exp-how-title" className="text-xl font-semibold text-ink">How this experiment works</h2>
      <p><span className="font-semibold text-ink">Fills.</span> A button queues an order for the next daily open, with adverse slippage and fees. One position at a time, no leverage. A flip pays to close and reopen, and any open trade closes at the final 2025 close. Shorts are synthetic with no borrow or funding charges.</p>
      <p><span className="font-semibold text-ink">Sound.</span> Drums speed up during a Bollinger and Keltner squeeze. Entering one plays quick chimes, and a release plays 1 to 4 cymbal clashes. Outside a squeeze, higher or lower chimes follow rising or falling closes. A release is not necessarily a directional breakout.</p>
      <p><span className="font-semibold text-ink">Data.</span> Coinbase Exchange BTC-USD daily UTC candles. October to December 2024 initializes the indicators. Bollinger Bands use SMA(14) with population SD, Keltner Channels use EMA(14) and Wilder ATR(14).</p>
      <p><span className="font-semibold text-ink">Please keep in mind.</span> This is an educational experiment, not proof of real-world trading ability. It compresses a year into minutes and does not fully model spreads, liquidity, latency, funding or liquidation. Drawdown uses daily closes and can miss larger intraday losses. Familiarity with past prices and chance can affect results. It has not shown that sound improves trading. Nothing here is investment advice, and trading cryptocurrency can cause substantial losses.</p>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Lock, Play, Volume2, X, Zap } from "lucide-react";
import { SqueezePlayer } from "@/lib/audio/squeeze-player";
import { cn } from "@/lib/cn";
import {
  EXPERIMENT_SETTINGS,
  accountEquity,
  advanceBar,
  createPaperAccount,
  experimentResult,
  leverageReview,
  marginRisk,
  queueOrder,
  setLeverage,
  unrealized,
  type ExperimentResult,
  type LeverageReview,
  type PaperAccount,
  type QueuedOrder,
} from "@/lib/experiments/engine";
import type { DailyBar } from "@/lib/experiments/daily/indicators";
import { cloudState } from "@/lib/experiments/daily/cloud";
import { DAILY_PRESETS, PRESET_INFO, presetNotes, type DailyPreset } from "@/lib/experiments/daily/sound";
import { dailyVersion, type StatsGroup } from "@/lib/experiments/rounds";

const STORE = "slushymarkets-daily-v2";
const ROUND_NAMES = ["Round 1", "Round 2", "Round 3", "Arcade"];
const COUNTDOWN = 3;
const WINDOW = 55;

type HistoryItem = { round: number; preset: DailyPreset; result: ExperimentResult; review?: LeverageReview; shared?: boolean };
type Saved = { cycle: number; started: number[]; history: HistoryItem[]; preset: DailyPreset; volume: number };
type Loaded = { cycle: number; round: number; nextRefresh: number; offset: number; context: DailyBar[]; bars: number; secondsPerBar: number; hasVolume: boolean };
type Identity = { asset: string; source: string; start: string; end: string };
type Phase = "loading" | "ready" | "countdown" | "running" | "done" | "error";

function readSaved(): Saved {
  const empty: Saved = { cycle: -1, started: [], history: [], preset: "squeeze", volume: 0.7 };
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(STORE) ?? "null") as Partial<Saved> | null) };
  } catch {
    return empty;
  }
}
function writeSaved(s: Saved): boolean {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const signed = (v: number) => `${v > 0.004 ? "+" : ""}${money(v)}`;
const tone = (v: number) => (v > 0.004 ? "text-success" : v < -0.004 ? "text-danger" : "text-ink");
const factor = (v: number | null) => (v === null ? "N/A" : Number.isFinite(v) ? v.toFixed(2) : "No losing trades");
const clock = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

async function share(item: HistoryItem): Promise<boolean> {
  const r = item.result;
  const cents = (v: number) => Math.round(v * 100) / 100;
  try {
    const response = await fetch("/api/experiments/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: crypto.randomUUID(),
        experiment: "daily-mystery",
        experimentVersion: dailyVersion(item.preset),
        round: item.round + 1,
        sound: item.preset === "none" ? "off" : "on",
        netPnl: cents(r.netPnl),
        drawdownPct: Math.min(100, cents(r.drawdownPct)),
        tradeCount: r.tradeCount,
        wins: r.wins,
        fees: cents(r.fees),
        winningPnl: cents(r.winningPnl),
        losingPnl: cents(r.losingPnl),
      }),
      signal: AbortSignal.timeout(12_000),
    });
    return response.status === 201;
  } catch {
    return false;
  }
}

/** Asks the server to name the market. It answers only once the round could have finished, so retry briefly. */
async function revealMarket(cycle: number, round: number, issuedAt: number, token: string): Promise<Identity | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch("/api/experiments/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reveal", cycle, round, issuedAt, token }),
      });
      const x = (await response.json()) as { ok: boolean; identity?: Identity };
      if (x.ok && x.identity) return x.identity;
    } catch {
      // try again below
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return null;
}

/** Three one-minute mystery charts, then an Arcade bonus. Virtual money only. */
export function DailyExperiment() {
  const [saved, setSaved] = useState<Saved>(() => ({ cycle: -1, started: [], history: [], preset: "squeeze", volume: 0.7 }));
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Loaded | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [shareChoice, setShareChoice] = useState<"share" | "private" | null>(null);
  const [count, setCount] = useState(COUNTDOWN);
  const [bars, setBars] = useState<DailyBar[]>([]);
  const [index, setIndex] = useState(-1);
  const [account, setAccount] = useState<PaperAccount>(() => createPaperAccount());
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [revealFailed, setRevealFailed] = useState(false);
  const [last, setLast] = useState<HistoryItem | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "sending" | "done" | "failed" | "private">("idle");
  const [now, setNow] = useState(0);
  const [statsVersion, setStatsVersion] = useState(0);

  const run = useRef({ index: -1, account: createPaperAccount() });
  const player = useRef<SqueezePlayer | null>(null);
  const begin = useRef<{ issuedAt: number; token: string | null } | null>(null);

  const persist = useCallback((next: Saved) => {
    setSaved(next);
    writeSaved(next);
  }, []);

  const load = useCallback(async (n: number) => {
    setRound(n);
    setPhase("loading");
    setError("");
    setIdentity(null);
    setRevealFailed(false);
    setLast(null);
    setShareChoice(n === 3 ? "private" : null);
    setShareStatus("idle");
    setBars([]);
    setIndex(-1);
    const fresh = createPaperAccount();
    run.current = { index: -1, account: fresh };
    setAccount(fresh);
    try {
      const response = await fetch(`/api/experiments/daily?round=${n}`, { cache: "no-store" });
      const x = (await response.json()) as Omit<Loaded, "offset"> & { ok: boolean; serverNow: number };
      if (!response.ok || !x.ok) throw new Error("load");
      let current = readSaved();
      if (current.cycle !== x.cycle) current = { ...current, cycle: x.cycle, started: [], history: [] };
      if (!x.hasVolume && current.preset === "volume") current = { ...current, preset: "squeeze" };
      persist(current);
      setData({ ...x, offset: x.serverNow - Date.now() });
      setPhase("ready");
    } catch {
      setPhase("error");
      setError("This round could not be loaded. Please try again in a moment.");
    }
  }, [persist]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      void load(0);
    }, 0);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(tick);
      player.current?.close();
    };
  }, [load]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const ends = Date.now() + COUNTDOWN * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      setCount(left);
      if (left === 0) {
        window.clearInterval(timer);
        setPhase("running");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase]);


  async function reveal(cycle: number, n: number, issuedAt: number, token: string) {
    const found = await revealMarket(cycle, n, issuedAt, token);
    setIdentity(found);
    if (!found) setRevealFailed(true);
  }

  function finish(final: PaperAccount) {
    player.current?.cut();
    player.current?.stopStorm();
    const current = readSaved();
    const item: HistoryItem = { round, preset: current.preset, result: experimentResult(final), ...(round === 3 ? { review: leverageReview(final) } : {}) };
    persist({ ...current, history: [...current.history, item] });
    setLast(item);
    setPhase("done");
    if (round !== 3 && shareChoice === "share") {
      setShareStatus("sending");
      void share(item).then((ok) => {
        setShareStatus(ok ? "done" : "failed");
        if (ok) setStatsVersion((v) => v + 1);
      });
    } else setShareStatus("private");
    const b = begin.current;
    if (data && b?.token) void reveal(data.cycle, round, b.issuedAt, b.token);
    else setIdentity(null);
  }

  useEffect(() => {
    if (phase !== "running" || !data || bars.length === 0) return;
    const startedAt = Date.now();
    const step = data.secondsPerBar * 1000;
    const total = bars.length * step;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const target = Math.min(bars.length - 1, Math.floor(elapsed / step));
      let { index: i, account: a } = run.current;
      if (i < target) {
        while (i < target) {
          i += 1;
          a = advanceBar(a, bars[i], i === bars.length - 1);
        }
        run.current = { index: i, account: a };
        setIndex(i);
        setAccount(a);
        player.current?.setVolume(readSaved().volume);
        const preset = readSaved().preset;
        player.current?.play(presetNotes(preset, bars[i], i, data.secondsPerBar));
        if (preset === "cloud") void player.current?.stormStep(cloudState(bars[i]) === "inside", data.secondsPerBar);
      }
      if (elapsed >= total || i === bars.length - 1) {
        window.clearInterval(timer);
        finish(run.current.account);
      }
    }, 30);
    return () => window.clearInterval(timer);
    // finish reads refs and the latest saved state, so it does not need to restart the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, data, bars]);

  async function start() {
    if (!data || phase !== "ready" || !shareChoice) return;
    const current = readSaved();
    if (current.cycle !== data.cycle || current.started.includes(round)) return;
    if (!writeSaved({ ...current, started: [...current.started, round] })) {
      setError("This experiment needs browser storage for its one-attempt rule.");
      return;
    }
    setSaved({ ...current, started: [...current.started, round] });
    player.current ??= new SqueezePlayer();
    void player.current.ready().then((ok) => ok && current.preset === "cloud" && player.current?.prepareStorm());
    try {
      const response = await fetch("/api/experiments/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "begin", cycle: data.cycle, round }),
      });
      const x = (await response.json()) as { ok: boolean; bars?: DailyBar[]; issuedAt?: number; token?: string | null };
      if (!response.ok || !x.ok || !x.bars) throw new Error("begin");
      begin.current = { issuedAt: x.issuedAt ?? 0, token: x.token ?? null };
      setBars(x.bars);
      setCount(COUNTDOWN);
      setPhase("countdown");
    } catch {
      setError("The round could not start. Your attempt for this round was used, so please choose another round.");
    }
  }

  const order = (o: QueuedOrder) => {
    if (phase !== "running") return;
    run.current = { ...run.current, account: queueOrder(run.current.account, o) };
    setAccount(run.current.account);
  };
  const toggleLeverage = () => {
    if (phase !== "running" || round !== 3) return;
    run.current = { ...run.current, account: setLeverage(run.current.account, run.current.account.leverage === 1 ? 2 : 1) };
    setAccount(run.current.account);
  };
  const choosePreset = (p: DailyPreset) => persist({ ...readSaved(), preset: p });

  const doneRounds = new Set(saved.history.map((h) => h.round));
  const arcadeOpen = [0, 1, 2].every((n) => doneRounds.has(n));
  const busy = phase === "countdown" || phase === "running";
  const used = saved.started.includes(round);
  const refreshIn = data && now ? data.nextRefresh - (now + data.offset) : 0;

  const tabs = (
    <nav aria-label="Rounds" className="flex flex-wrap gap-2">
      {ROUND_NAMES.map((name, n) => {
        const locked = n === 3 && !arcadeOpen;
        return (
          <button
            key={name}
            type="button"
            disabled={busy || locked}
            aria-current={n === round ? "step" : undefined}
            onClick={() => void load(n)}
            className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-50", n === round ? "bg-cyan/15 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink")}
          >
            {locked ? <Lock aria-hidden="true" className="size-3.5" /> : null}
            {name}
            {doneRounds.has(n) ? " ✓" : ""}
          </button>
        );
      })}
    </nav>
  );

  const preset = saved.preset;
  const shown = data ? [...data.context, ...bars.slice(0, index + 1)] : [];
  const current = shown.at(-1);
  const risk = current ? marginRisk(account, current.c) : { ratio: 0, margin: 0 };

  return (
    <div className="space-y-5">
      <section className="panel space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {tabs}
          <p className="text-xs tabular-nums text-subtle">Next charts in {clock(refreshIn)} · 00:00 and 12:00 UTC</p>
        </div>
        <p className="text-sm text-muted">
          Each round can be started once per 12-hour set in this browser. Starting uses the attempt, even if you leave. Finish all three to unlock one Arcade bonus with optional 2x leverage.
        </p>

        {phase === "error" ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

        {data && current ? (
          <>
            <div className="relative">
              <DailyChart bars={shown.slice(-WINDOW)} preset={preset} fills={account.fills} leveraged={account.position !== null && account.position.leverage > 1} />
              {phase === "countdown" ? <p role="timer" className="absolute inset-0 grid place-items-center rounded-2xl bg-navy-950/75 font-display text-7xl font-bold text-cyan-soft">{count}</p> : null}
            </div>
            <p className="text-xs text-subtle">
              {index < 0 ? `${data.context.length} context candles · nothing tradable shown yet` : `Candle ${index + 1} of ${bars.length}`} · indexed prices, market and dates revealed after the round
            </p>
          </>
        ) : null}

        {phase === "ready" || phase === "loading" ? (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Sound profile</legend>
              <div className="flex flex-wrap gap-2">
                {DAILY_PRESETS.map((p) => {
                  const off = p === "volume" && !data?.hasVolume;
                  return (
                    <button key={p} type="button" disabled={off} aria-pressed={preset === p} onClick={() => choosePreset(p)} className={cn("h-10 rounded-full px-3.5 text-xs font-semibold ring-1 transition disabled:opacity-40", preset === p ? "bg-violet/20 text-ink ring-violet/60" : "text-muted ring-white/10 hover:text-ink")}>
                      {PRESET_INFO[p].name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-muted">{PRESET_INFO[preset].description}</p>
              {!data?.hasVolume ? <p className="mt-1 text-xs text-subtle">Volume Pulse needs buyer and seller volume, which this chart does not have.</p> : null}
            </fieldset>
            {round !== 3 ? (
              <fieldset>
                <legend className="text-sm font-semibold text-ink">Share this round&apos;s summary?</legend>
                <p className="mt-1 text-xs text-muted">Optional. Choose before you start. Only first attempts in this set, with no names, emails, wallets or individual trades. Shared summaries cannot be removed individually.</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink">
                  <label><input type="radio" name="daily-share" className="mr-2 accent-cyan" checked={shareChoice === "share"} onChange={() => setShareChoice("share")} />Share my summary</label>
                  <label><input type="radio" name="daily-share" className="mr-2 accent-cyan" checked={shareChoice === "private"} onChange={() => setShareChoice("private")} />Keep it private</label>
                </div>
              </fieldset>
            ) : (
              <p className="rounded-xl bg-gold/10 p-3 text-sm text-ink ring-1 ring-gold/40">
                Arcade: 60 seconds at 4 candles per second. Leverage 1x or 2x applies to your next entry. A 2x position closes at a daily close if its loss reaches its margin. Leverage raises the risk of loss and is a game mechanic only. Arcade results stay on this device.
              </p>
            )}
            {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            <button type="button" onClick={() => void start()} disabled={phase !== "ready" || used || !shareChoice} className="inline-flex h-12 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-6 text-sm font-semibold text-navy-950 transition disabled:cursor-not-allowed disabled:opacity-40">
              <Play aria-hidden="true" className="size-4" />
              {used ? "Round already used in this set" : round === 3 ? "Start Arcade (one use)" : "Start 60-second round"}
            </button>
          </div>
        ) : null}

        {busy && current ? (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Stat label="Virtual equity" value={money(accountEquity(account, current.c))} />
              <Stat label="Net P&L" value={signed(accountEquity(account, current.c) - EXPERIMENT_SETTINGS.initial)} className={tone(accountEquity(account, current.c) - EXPERIMENT_SETTINGS.initial)} />
              <Stat label="Fees" value={money(account.fees)} />
              <Stat label="Closed trades" value={String(account.trades.length)} />
            </dl>
            <p role="status" className="text-sm text-muted">
              {account.position ? `${account.position.side === 1 ? "Long" : "Short"} ${account.position.leverage}x from ${account.position.entry.toFixed(2)}, open P&L ${signed(unrealized(account, current.c))}` : "Flat, no position"}
              {account.pending !== null ? ", order queued for the next open" : ""}
              {risk.margin > 0 ? `, loss ${Math.round(risk.ratio * 100)}% of margin` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <TradeButton disabled={phase !== "running"} onClick={() => order(1)} className="bg-success/15 text-success ring-success/50"><ArrowUp aria-hidden="true" className="size-4" /> Long</TradeButton>
              <TradeButton disabled={phase !== "running"} onClick={() => order(-1)} className="bg-danger/15 text-danger ring-danger/50"><ArrowDown aria-hidden="true" className="size-4" /> Short</TradeButton>
              <TradeButton disabled={phase !== "running"} onClick={() => order(0)} className="text-ink ring-white/20"><X aria-hidden="true" className="size-4" /> Close / stay flat</TradeButton>
              {round === 3 ? (
                <TradeButton disabled={phase !== "running"} onClick={toggleLeverage} aria-pressed={account.leverage === 2} className={account.leverage === 2 ? "bg-gold/20 text-gold ring-gold/60" : "text-ink ring-white/20"}>
                  <Zap aria-hidden="true" className="size-4" /> Leverage {account.leverage}x
                </TradeButton>
              ) : null}
            </div>
          </div>
        ) : null}

        <label className="flex max-w-sm items-center gap-3 text-xs text-muted">
          <Volume2 aria-hidden="true" className="size-4" /> Volume
          <input type="range" min={0} max={100} value={Math.round(saved.volume * 100)} onChange={(e) => persist({ ...readSaved(), volume: Number(e.target.value) / 100 })} className="h-2 w-full cursor-pointer accent-cyan" />
        </label>
      </section>

      {phase === "done" && last ? (
        <section className="panel panel-glow p-5 sm:p-6" aria-labelledby="daily-result-title" aria-live="polite">
          <h2 id="daily-result-title" className="text-2xl font-semibold text-ink">{ROUND_NAMES[round]} complete</h2>
          <p className="mt-1 text-sm text-muted">{identity ? `${identity.asset} · daily candles · ${identity.start} to ${identity.end} · ${identity.source}` : revealFailed ? "The market name could not be loaded." : "Revealing the market."}</p>
          <p className={cn("mt-2 font-display text-3xl font-semibold tabular-nums", tone(last.result.netPnl))}>{signed(last.result.netPnl)}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Profit factor" value={factor(last.result.profitFactor)} />
            <Stat label="Max daily-close drawdown" value={`${last.result.drawdownPct.toFixed(2)}%`} />
            <Stat label="Wins / closed trades" value={`${last.result.wins} / ${last.result.tradeCount}`} />
            <Stat label="Fees" value={money(last.result.fees)} />
          </dl>
          {last.review ? (
            <p className="mt-3 text-sm text-muted">
              {!last.review.used ? "You did not use 2x leverage." : `Same trades at 1x: ${signed(last.review.allOneX)}. Leverage effect: ${signed(last.review.effect)}.`}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            {shareStatus === "sending" ? "Sending your summary." : shareStatus === "done" ? "Your summary was added to the shared statistics." : shareStatus === "failed" ? "Your summary could not be saved to the shared statistics." : round === 3 ? "Arcade results stay on this device." : "Kept private. Nothing was sent."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {round < 2 ? <ActionButton onClick={() => void load(round + 1)}>Next round</ActionButton> : null}
            {round === 2 && arcadeOpen ? <ActionButton onClick={() => void load(3)}>Arcade unlocked</ActionButton> : null}
          </div>
        </section>
      ) : null}

      <DailyStats version={statsVersion} />

      {saved.history.length ? (
        <section className="panel p-5 sm:p-6" aria-labelledby="daily-history-title">
          <h2 id="daily-history-title" className="text-lg font-semibold text-ink">This set on this device</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-md text-left text-sm tabular-nums text-muted">
              <thead className="text-xs uppercase text-subtle"><tr>{["Round", "Sound", "Net", "Max DD", "Wins / trades"].map((h) => <th key={h} scope="col" className="py-2 pr-3">{h}</th>)}</tr></thead>
              <tbody>
                {saved.history.map((h, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <th scope="row" className="py-2 pr-3 text-ink">{ROUND_NAMES[h.round]}</th>
                    <td className="py-2 pr-3">{PRESET_INFO[h.preset].name}</td>
                    <td className={cn("py-2 pr-3", tone(h.result.netPnl))}>{signed(h.result.netPnl)}</td>
                    <td className="py-2 pr-3">{h.result.drawdownPct.toFixed(2)}%</td>
                    <td className="py-2">{h.result.wins} / {h.result.tradeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel space-y-2 p-5 text-sm text-muted sm:p-6" aria-labelledby="daily-rules-title">
        <h2 id="daily-rules-title" className="text-xl font-semibold text-ink">Rules and limits</h2>
        <p>Every round starts with a fresh $10,000 and uses $2,000 positions, 0.05% fee and 0.02% adverse slippage per side, no commission. Orders fill at the next candle&apos;s open, and any open position closes at the final close. Stay flat whenever you like.</p>
        <p>Charts are real daily history with indexed prices, so the market and dates stay hidden until you finish. The same charts are used for everyone in a 12-hour set, and segments can return in later sets.</p>
        <p>This is an educational experiment, not proof of real-world trading ability. It does not model spreads, liquidity, funding or intraday liquidation. Sound describes indicator conditions and has not been shown to improve trading. Nothing here is investment advice.</p>
        <p className="text-xs text-subtle">Adaptive Cloud v1.0 is Slushy&apos;s indicator. Storm audio: Thunder &amp; rain by iscence (Freesound #817640), CC0, excerpts edited for SlushyMarkets.</p>
      </section>
    </div>
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

function TradeButton({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  return <button type="button" {...props} className={cn("inline-flex h-12 min-w-28 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40", className)} />;
}

function ActionButton(props: React.ComponentPropsWithoutRef<"button">) {
  return <button type="button" {...props} className="inline-flex h-11 items-center rounded-full bg-linear-to-r from-cyan to-violet px-5 text-sm font-semibold text-navy-950" />;
}

const VIEW = { w: 960, h: 380, pad: 12 };
const LINES: Record<DailyPreset, Array<{ key: keyof DailyBar; color: string; dash?: boolean; width?: number }>> = {
  squeeze: [
    { key: "kcL", color: "#fff", dash: true },
    { key: "kcH", color: "#fff", dash: true },
    { key: "bbL", color: "var(--color-magenta)", width: 2 },
    { key: "bbH", color: "var(--color-magenta)", width: 2 },
    { key: "ema14", color: "var(--color-cyan-soft)", width: 2 },
  ],
  efficiency: [
    { key: "erChannelL", color: "var(--color-violet-soft)" },
    { key: "erChannelH", color: "var(--color-violet-soft)" },
  ],
  volume: [
    { key: "kcL", color: "var(--color-cyan)", dash: true },
    { key: "kcH", color: "var(--color-magenta)", dash: true },
  ],
  cloud: [
    { key: "cloudL", color: "var(--color-violet-soft)" },
    { key: "cloudH", color: "var(--color-violet-soft)" },
    { key: "cloudCenter", color: "var(--color-cyan-soft)", width: 2 },
    { key: "cloudAnchor", color: "var(--color-gold)", width: 2 },
  ],
  ema: [
    { key: "ema7", color: "var(--color-violet-soft)" },
    { key: "ema20", color: "var(--color-magenta)" },
    { key: "ema50", color: "var(--color-success)" },
  ],
  none: [],
};

function DailyChart({ bars, preset, fills, leveraged }: { bars: DailyBar[]; preset: DailyPreset; fills: PaperAccount["fills"]; leveraged: boolean }) {
  const lines = LINES[preset];
  const values = bars.flatMap((b) => [b.l, b.h, ...lines.map((l) => b[l.key] as number)]).filter(Number.isFinite);
  const top = Math.max(...values);
  const bottom = Math.min(...values);
  const span = Math.max(top - bottom, 0.01);
  const slot = (VIEW.w - VIEW.pad * 2) / WINDOW;
  const x = (i: number) => VIEW.pad + slot * (i + 0.5);
  const y = (p: number) => VIEW.pad + ((top - p) / span) * (VIEW.h - VIEW.pad * 2);
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="none" role="img" aria-label="Mystery market daily candles with the selected sound profile's indicator lines. Revealed candles only." className={cn("h-64 w-full rounded-2xl bg-navy-950/60 ring-1 transition sm:h-96", leveraged ? "ring-2 ring-gold/70 shadow-[0_0_40px_-8px_rgb(255_197_61/0.6)]" : "ring-white/10")}>
      {preset === "cloud" ? (
        <polygon
          fill="var(--color-violet)"
          opacity={0.2}
          points={(() => {
            const ok = bars.map((b, i) => ({ b, i })).filter(({ b }) => b.cloudH !== null && b.cloudL !== null);
            return [...ok.map(({ b, i }) => `${x(i)},${y(b.cloudH!)}`), ...ok.map(({ b, i }) => `${x(i)},${y(b.cloudL!)}`).reverse()].join(" ");
          })()}
        />
      ) : null}
      {preset === "efficiency" ? (
        <polygon fill="var(--color-violet)" opacity={0.14} points={[...bars.map((b, i) => `${x(i)},${y(b.erChannelH)}`), ...bars.map((b, i) => `${x(i)},${y(b.erChannelL)}`).reverse()].join(" ")} />
      ) : null}
      {bars.map((b, i) => {
        const color = b.c >= b.o ? "var(--color-cyan)" : "var(--color-magenta)";
        return (
          <g key={b.date}>
            <line x1={x(i)} x2={x(i)} y1={y(b.h)} y2={y(b.l)} stroke={color} vectorEffect="non-scaling-stroke" />
            <rect x={x(i) - slot * 0.3} width={slot * 0.6} y={y(Math.max(b.o, b.c))} height={Math.max(Math.abs(y(b.o) - y(b.c)), 1.5)} fill={color} />
            {preset === "efficiency" && b.er > 0.5 ? <circle cx={x(i)} cy={y(b.c)} r={3} fill="#fff" /> : null}
          </g>
        );
      })}
      {lines.map((l) => (
        <polyline key={l.key} fill="none" stroke={l.color} strokeWidth={l.width ?? 1.4} strokeDasharray={l.dash ? "4 4" : undefined} vectorEffect="non-scaling-stroke" points={bars.flatMap((b, i) => (Number.isFinite(b[l.key] as number) && b[l.key] !== null ? [`${x(i)},${y(b[l.key] as number)}`] : [])).join(" ")} />
      ))}
      {fills.map((f, n) => {
        const i = bars.findIndex((b) => b.date === f.date);
        return i < 0 ? null : <circle key={n} cx={x(i)} cy={y(f.price)} r={6} fill={f.action === "LONG" ? "var(--color-success)" : f.action === "SHORT" ? "var(--color-danger)" : "#fff"} />;
      })}
    </svg>
  );
}

type StatsState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; groups: StatsGroup[] };

function DailyStats({ version }: { version: number }) {
  const [state, setState] = useState<StatsState>({ kind: "loading" });
  useEffect(() => {
    let active = true;
    fetch("/api/experiments/rounds?experiment=daily-mystery", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as { groups?: StatsGroup[] };
        if (active) setState(r.ok && d.groups ? { kind: "ready", groups: d.groups } : { kind: "error" });
      })
      .catch(() => active && setState({ kind: "error" }));
    return () => {
      active = false;
    };
  }, [version]);
  const groups = state.kind === "ready" ? state.groups.filter((g) => g.stats) : [];
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="daily-stats-title">
      <h2 id="daily-stats-title" className="text-xl font-semibold text-ink">Shared results for the daily experiment</h2>
      <p className="mt-1 text-sm text-muted">Voluntary first attempts of regular rounds. Counted separately from the BTC experiment and the practice page.</p>
      {state.kind === "loading" ? <p className="mt-3 text-sm text-subtle">Loading statistics.</p> : null}
      {state.kind === "error" ? <p className="mt-3 text-sm text-subtle">Statistics are unavailable right now. The experiment still works.</p> : null}
      {state.kind === "ready" && !groups.length ? <p className="mt-3 text-sm text-subtle">No shared rounds yet.</p> : null}
      {groups.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm tabular-nums text-muted">
            <thead className="text-xs uppercase text-subtle"><tr>{["Sound", "Completed rounds", "Average net", "Average drawdown", "Pooled win rate", "Pooled profit factor"].map((h) => <th key={h} scope="col" className="py-2 pr-3">{h}</th>)}</tr></thead>
            <tbody>
              {groups.map(({ label, stats }) => (
                <tr key={label} className="border-t border-white/10">
                  <th scope="row" className="py-2 pr-3 text-ink">{label}</th>
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
      <p className="mt-3 text-xs text-subtle">Counts are rounds, not people. Results are self-selected, and sound groups are observational, not a controlled comparison.</p>
    </section>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ear, Pause, Play, RotateCcw, Shuffle } from "lucide-react";
import { SqueezePlayer } from "@/lib/audio/squeeze-player";
import { cn } from "@/lib/cn";
import type { DailyNote } from "@/lib/experiments/daily/sound";
import {
  DRILL_CHOICES,
  ECHO,
  ECHO_LOWER,
  ECHO_UPPER,
  describePosition,
  echoDemoCandles,
  echoNotes,
  echoPosition,
  type EchoCandle,
  type EchoNote,
} from "@/lib/sonification/echo-bands";

const PRESETS = [
  { label: "Below", position: -0.4 },
  { label: "On lower band", position: 0 },
  { label: "Quarter", position: 0.25 },
  { label: "Half", position: 0.5 },
  { label: "Three quarters", position: 0.75 },
  { label: "Just under upper", position: 0.95 },
  { label: "Above", position: 1.4 },
];

const ROLE_COLOR: Record<EchoNote["role"], string> = { lower: "var(--color-cyan)", close: "var(--color-success)", upper: "var(--color-violet-soft)" };
const ROLE_NAME: Record<EchoNote["role"], string> = { lower: "Low", close: "Close", upper: "High" };

function toSound(notes: EchoNote[]): DailyNote[] {
  return notes.map((n) => (n.role === "close" ? { kind: "chime", hz: n.hz, offset: n.offset, volume: 1 } : { kind: "bell", hz: n.hz, offset: n.offset, volume: 0.75, duration: 0.18 }));
}

const priceAt = (position: number) => ECHO_LOWER + position * (ECHO_UPPER - ECHO_LOWER);

/** Interactive Echo Bands lesson: hear one candle, follow a moving close, then train your ear. */
export function EchoBandsLesson() {
  const player = useRef<SqueezePlayer | null>(null);
  useEffect(() => () => player.current?.close(), []);

  async function play(notes: EchoNote[]) {
    player.current ??= new SqueezePlayer();
    if (await player.current.ready()) player.current.play(toSound(notes));
  }

  return (
    <div className="space-y-6">
      <SingleCandle play={play} />
      <MovingClose play={play} stop={() => player.current?.cut()} />
      <EarTraining play={play} />
    </div>
  );
}

type PlayFn = (notes: EchoNote[]) => Promise<void>;

function SingleCandle({ play }: { play: PlayFn }) {
  const [position, setPosition] = useState(0.25);
  const sliderId = useId();
  const notes = echoNotes(position);
  const close = priceAt(position);
  const candle: EchoCandle = { o: close + (position > 0.5 ? -2 : 2), c: close, h: close + 2.5, l: close - 2.5 };

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="echo-one-title">
      <h2 id="echo-one-title" className="text-2xl font-semibold text-ink">1. Hear one candle</h2>
      <p className="mt-1 text-sm text-muted">Pick where the candle closes. Each candle plays the lower band, the close and the upper band. Listen to how the close note moves.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Close position">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={Math.abs(position - p.position) < 1e-9}
            onClick={() => {
              setPosition(p.position);
              void play(echoNotes(p.position));
            }}
            className={cn("h-10 rounded-full px-3.5 text-xs font-semibold ring-1 transition", Math.abs(position - p.position) < 1e-9 ? "bg-cyan/15 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label htmlFor={sliderId} className="mt-4 block text-sm text-muted">
        Or drag the close: <span className="font-semibold text-ink">{describePosition(position)}</span>
        <input id={sliderId} type="range" min={-50} max={150} value={Math.round(position * 100)} onChange={(e) => setPosition(Number(e.target.value) / 100)} onPointerUp={() => void play(echoNotes(position))} onKeyUp={() => void play(echoNotes(position))} className="mt-2 h-2 w-full cursor-pointer accent-cyan" />
      </label>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <BandChart candles={[candle]} />
        <TimingLine notes={notes} />
      </div>
      <button type="button" onClick={() => void play(notes)} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-5 text-sm font-semibold text-navy-950">
        <Play aria-hidden="true" className="size-4" /> Play this candle
      </button>
    </section>
  );
}

function MovingClose({ play, stop }: { play: PlayFn; stop: () => void }) {
  const [candles] = useState(() => echoDemoCandles());
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const next = indexRef.current + 1;
      if (next >= candles.length) {
        setPlaying(false);
        return;
      }
      indexRef.current = next;
      setIndex(next);
      void play(echoNotes(echoPosition(candles[next].c, ECHO_LOWER, ECHO_UPPER)));
    }, ECHO.candleSec * 1000);
    return () => window.clearInterval(timer);
  }, [playing, candles, play]);

  const position = echoPosition(candles[index].c, ECHO_LOWER, ECHO_UPPER);
  function toggle() {
    if (playing) {
      setPlaying(false);
      stop();
      return;
    }
    if (indexRef.current >= candles.length - 1) {
      indexRef.current = 0;
      setIndex(0);
    }
    void play(echoNotes(echoPosition(candles[indexRef.current].c, ECHO_LOWER, ECHO_UPPER)));
    setPlaying(true);
  }

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="echo-move-title">
      <h2 id="echo-move-title" className="text-2xl font-semibold text-ink">2. Follow a moving close</h2>
      <p className="mt-1 text-sm text-muted">{candles.length} invented candles drift down through the lower band, climb above the upper band and settle back inside. One candle plays about every second.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <BandChart candles={candles.slice(0, index + 1)} slots={candles.length} />
        <TimingLine notes={echoNotes(position)} />
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-muted">
        Candle {index + 1} of {candles.length}: {describePosition(position)}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={toggle} className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-5 text-sm font-semibold text-navy-950">
          {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          {playing ? "Pause" : index > 0 && index < candles.length - 1 ? "Resume" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            stop();
            indexRef.current = 0;
            setIndex(0);
          }}
          aria-label="Restart from the first candle"
          className="grid size-11 place-items-center rounded-full text-ink ring-1 ring-white/10 hover:bg-white/5"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
        </button>
      </div>
    </section>
  );
}

type Drill = { answer: (typeof DRILL_CHOICES)[number]["id"]; position: number };

function EarTraining({ play }: { play: PlayFn }) {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  function next() {
    const choice = DRILL_CHOICES[Math.floor(Math.random() * DRILL_CHOICES.length)];
    // A little variety so the same answer does not always sound identical.
    const jitter = choice.id === "middle" ? (Math.random() - 0.5) * 0.12 : (Math.random() - 0.5) * 0.1;
    const d = { answer: choice.id, position: choice.position + jitter };
    setDrill(d);
    setGuess(null);
    void play(echoNotes(d.position));
  }

  function answer(id: string) {
    if (!drill || guess) return;
    setGuess(id);
    setScore((s) => ({ right: s.right + (id === drill.answer ? 1 : 0), total: s.total + 1 }));
  }

  const right = drill && guess === drill.answer;
  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="echo-ear-title">
      <h2 id="echo-ear-title" className="flex items-center gap-2 text-2xl font-semibold text-ink">
        <Ear aria-hidden="true" className="size-6 text-cyan" /> 3. Train your ear
      </h2>
      <p className="mt-1 text-sm text-muted">Listen to a mystery candle, then guess where it closed. No chart this time. Practice only, nothing is saved.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={next} className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-5 text-sm font-semibold text-navy-950">
          <Shuffle aria-hidden="true" className="size-4" /> {drill ? "Next mystery candle" : "Play a mystery candle"}
        </button>
        {drill ? (
          <button type="button" onClick={() => void play(echoNotes(drill.position))} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-ink ring-1 ring-white/15 hover:bg-white/5">
            <Play aria-hidden="true" className="size-4" /> Hear it again
          </button>
        ) : null}
        <span className="ml-auto text-sm tabular-nums text-subtle">
          {score.right} / {score.total} correct
        </span>
      </div>
      {drill ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-5" role="group" aria-label="Where did it close?">
          {DRILL_CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={!!guess}
              onClick={() => answer(c.id)}
              className={cn(
                "min-h-11 rounded-2xl px-3 py-2 text-sm font-semibold ring-1 transition",
                guess && c.id === drill.answer ? "bg-success/15 text-success ring-success/60" : guess === c.id ? "bg-danger/15 text-danger ring-danger/60" : "text-ink ring-white/15 hover:bg-white/5",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
      {drill && guess ? (
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          <span className={right ? "font-semibold text-success" : "font-semibold text-danger"}>{right ? "Right." : "Not quite."}</span> It closed {describePosition(drill.position).toLowerCase()}.{" "}
          {drill.position < 0 || drill.position > 1 ? "The close note came first, before both band notes." : "The close note sat between the two band notes."}
        </p>
      ) : null}
    </section>
  );
}

const VIEW = { w: 600, h: 240, pad: 14 };
const RANGE = { min: ECHO_LOWER - 12, max: ECHO_UPPER + 12 };

function BandChart({ candles, slots = 1 }: { candles: EchoCandle[]; slots?: number }) {
  const y = (p: number) => VIEW.pad + ((RANGE.max - p) / (RANGE.max - RANGE.min)) * (VIEW.h - VIEW.pad * 2);
  const plot = VIEW.w - 150;
  const slot = (plot - VIEW.pad) / Math.max(slots, 1);
  const x = (i: number) => VIEW.pad + slot * (i + 0.5);
  const last = candles.at(-1);
  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={last ? `Candle chart with two bands. ${describePosition(echoPosition(last.c, ECHO_LOWER, ECHO_UPPER))}.` : "Candle chart with two bands"} className="h-56 w-full rounded-2xl bg-navy-950/60 ring-1 ring-white/10">
      <line x1={VIEW.pad} x2={plot} y1={y(ECHO_UPPER)} y2={y(ECHO_UPPER)} stroke={ROLE_COLOR.upper} strokeWidth={2} />
      <line x1={VIEW.pad} x2={plot} y1={y(ECHO_LOWER)} y2={y(ECHO_LOWER)} stroke={ROLE_COLOR.lower} strokeWidth={2} />
      <text x={plot + 10} y={y(ECHO_UPPER) + 4} fill={ROLE_COLOR.upper} fontSize={14}>Upper band</text>
      <text x={plot + 10} y={y(ECHO_LOWER) + 4} fill={ROLE_COLOR.lower} fontSize={14}>Lower band</text>
      {candles.map((c, i) => {
        const color = c.c >= c.o ? "var(--color-cyan)" : "var(--color-magenta)";
        const w = Math.min(28, slot * 0.6);
        return (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={y(Math.min(c.h, RANGE.max))} y2={y(Math.max(c.l, RANGE.min))} stroke={color} />
            <rect x={x(i) - w / 2} width={w} y={y(Math.max(c.o, c.c))} height={Math.max(2, Math.abs(y(c.o) - y(c.c)))} fill={color} />
          </g>
        );
      })}
      {last ? (
        <>
          <line x1={x(candles.length - 1)} x2={plot} y1={y(Math.min(Math.max(last.c, RANGE.min), RANGE.max))} y2={y(Math.min(Math.max(last.c, RANGE.min), RANGE.max))} stroke={ROLE_COLOR.close} strokeDasharray="5 4" />
          <circle cx={plot} cy={y(Math.min(Math.max(last.c, RANGE.min), RANGE.max))} r={5} fill={ROLE_COLOR.close} />
          <text x={plot - 8} y={y(Math.min(Math.max(last.c, RANGE.min), RANGE.max)) - 10} textAnchor="end" fill={ROLE_COLOR.close} fontSize={14}>Close</text>
        </>
      ) : null}
    </svg>
  );
}

function TimingLine({ notes }: { notes: EchoNote[] }) {
  const span = ECHO.leadSec + ECHO.bandGapSec;
  const outside = notes[0]?.role === "close";
  return (
    <div className="rounded-2xl bg-navy-950/60 p-4 ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Note timing in each candle</p>
      <div className="relative mx-3 mt-8 h-10">
        <div className="absolute inset-x-0 top-2 h-px bg-white/20" />
        {notes.map((n) => {
          const left = ((n.offset + (outside ? 0 : ECHO.leadSec)) / span) * 100;
          return (
            <span key={n.role} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${left}%` }}>
              <span className="mx-auto block size-4 rounded-full" style={{ background: ROLE_COLOR[n.role] }} />
              <span className="mt-1 block text-[11px] text-muted">{ROLE_NAME[n.role]}</span>
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        {notes.length === 2 ? "Two notes: the close sits on a band, so they merge." : outside ? "Close plays first, before both bands. Its pitch tells you above or below." : "Low, close, high. The close lands in proportion to where it sits."}
      </p>
      <ul className="mt-2 space-y-0.5 text-[11px] tabular-nums text-subtle">
        {notes.map((n) => (
          <li key={n.role}>
            {ROLE_NAME[n.role]}: {Math.round(n.hz)} Hz at {Math.round(n.offset * 1000)} ms
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Headphones, Play, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPianoSynth } from "@/lib/audio/piano-synth";
import { EXERCISE_CLIPS, type TrendState } from "@/lib/audio/trend-scenario";

const CHOICES: { value: TrendState; label: string }[] = [
  { value: "bullish", label: "Bullish (rising)" },
  { value: "sideways", label: "Sideways (flat)" },
  { value: "bearish", label: "Bearish (falling)" },
];

const NOTE_SEC = 0.32;

/** Listen and identify: hear a short clip, then name the trend direction. */
export function ListenExercise() {
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TrendState>>({});
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeout = useRef<number | null>(null);

  const finished = round >= EXERCISE_CLIPS.length;
  const clip = EXERCISE_CLIPS[Math.min(round, EXERCISE_CLIPS.length - 1)];
  const chosen = answers[clip.id];
  const score = EXERCISE_CLIPS.filter((c) => answers[c.id] === c.answer).length;

  useEffect(
    () => () => {
      if (timeout.current) window.clearTimeout(timeout.current);
    },
    [],
  );

  async function playClip() {
    try {
      const synth = getPianoSynth();
      await synth.resume();
      synth.stopAll();
      const start = synth.ctx.currentTime + 0.15;
      clip.midis.forEach((midi, i) => synth.playNote(midi, start + i * NOTE_SEC, NOTE_SEC, 0.6));
      setPlaying(true);
      setPlayed(true);
      setError(null);
      if (timeout.current) window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => setPlaying(false), (clip.midis.length * NOTE_SEC + 0.4) * 1000);
    } catch {
      setError("Sound could not start in this browser.");
    }
  }

  function choose(value: TrendState) {
    if (chosen) return;
    setAnswers((a) => ({ ...a, [clip.id]: value }));
  }

  function next() {
    setRound((r) => r + 1);
    setPlayed(false);
  }

  function restart() {
    setRound(0);
    setAnswers({});
    setPlayed(false);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-start gap-3" aria-live="polite">
        <p className="font-display text-2xl font-semibold text-ink">
          {score} of {EXERCISE_CLIPS.length} correct
        </p>
        <p className="text-sm text-muted">
          {score === EXERCISE_CLIPS.length
            ? "Great ears. Rising notes followed a rising trend, falling notes a falling one."
            : "Tip: listen to where the last note ends compared with the first one."}
        </p>
        <button
          type="button"
          onClick={restart}
          className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
        >
          <RotateCcw aria-hidden="true" className="size-4" /> Try again
        </button>
      </div>
    );
  }

  const correct = chosen === clip.answer;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-magenta">
        Clip {round + 1} of {EXERCISE_CLIPS.length}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={playClip}
          disabled={playing}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-magenta to-violet px-5 text-sm font-semibold text-white shadow-glow-violet transition hover:brightness-110 disabled:opacity-60"
        >
          {playing ? <Headphones aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          {playing ? "Listening..." : played ? "Play again" : "Play clip"}
        </button>
        <span className="text-sm text-muted">8 notes in the middle register. Which way is the trend going?</span>
      </div>

      <div role="group" aria-label="Your answer" className="grid gap-2 sm:grid-cols-3">
        {CHOICES.map((c) => {
          const isChosen = chosen === c.value;
          const isAnswer = c.value === clip.answer;
          return (
            <button
              key={c.value}
              type="button"
              disabled={!played || Boolean(chosen)}
              onClick={() => choose(c.value)}
              aria-pressed={isChosen}
              className={cn(
                "flex min-h-12 items-center justify-between gap-2 rounded-xl px-4 text-sm font-medium ring-1 transition disabled:cursor-not-allowed",
                !chosen && "bg-navy-950/50 text-ink ring-white/10 hover:ring-magenta/50 disabled:opacity-50",
                chosen && isAnswer && "bg-success/12 text-ink ring-success/60",
                chosen && isChosen && !isAnswer && "bg-danger/12 text-ink ring-danger/60",
                chosen && !isChosen && !isAnswer && "text-muted ring-white/5",
              )}
            >
              {c.label}
              {chosen && isAnswer ? <CheckCircle2 aria-label="Correct answer" className="size-5 text-success" /> : null}
              {chosen && isChosen && !isAnswer ? <XCircle aria-label="Your answer, incorrect" className="size-5 text-danger" /> : null}
            </button>
          );
        })}
      </div>
      {!played ? <p className="text-xs text-subtle">Play the clip first, then choose.</p> : null}

      <div aria-live="polite">
        {chosen ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-950/40 px-4 py-3 text-sm">
            <p className="text-muted">
              <span className={cn("font-semibold", correct ? "text-success" : "text-danger")}>
                {correct ? "Correct. " : "Not quite. "}
              </span>
              {clip.answer === "bullish" && "The notes climbed overall, like a rising price."}
              {clip.answer === "bearish" && "The notes stepped down overall, like a falling price."}
              {clip.answer === "sideways" && "The notes wandered around the same pitch, like a flat market."}
            </p>
            <button
              type="button"
              onClick={next}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
            >
              {round + 1 < EXERCISE_CLIPS.length ? "Next clip" : "See result"}
            </button>
          </div>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

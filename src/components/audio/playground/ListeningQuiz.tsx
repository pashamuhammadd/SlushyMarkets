"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Headphones, Play, RotateCcw, Shuffle, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { getSonarEngine, peekSonarEngine } from "@/lib/audio/sonar-engine";
import { useDeviceProgress } from "@/lib/hooks/use-device-progress";
import { buildQuiz, clipChart, clipNotes, QUIZ_VOICES, type QuizClip } from "@/lib/sonification/listening-quiz";
import { BAR_SECONDS, PLAYGROUND_OUTPUT_BOOST } from "@/lib/sonification/mixer";
import { SonarChart } from "./SonarChart";

const PROGRESS_ID = "sonar-bands-listening";
const LAYER_GAIN = 0.7;

/**
 * Listening quiz for Sonar Bands: play a short clip, answer one question, then see the chart
 * of what you heard. Sound starts only from the Play button. Results stay in this browser.
 */
export function ListeningQuiz() {
  const [set, setSet] = useState(0);
  const clips = useMemo(() => buildQuiz(set), [set]);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const timeout = useRef<number | null>(null);
  const { progress, save } = useDeviceProgress(PROGRESS_ID);

  const finished = round >= clips.length;
  const clip: QuizClip = clips[Math.min(round, clips.length - 1)];
  const chosen = answers[clip.id];
  const score = clips.filter((c) => answers[c.id] === c.answer).length;

  useEffect(
    () => () => {
      if (timeout.current) window.clearTimeout(timeout.current);
      peekSonarEngine()?.stopAll();
    },
    [],
  );

  async function playClip() {
    try {
      const engine = getSonarEngine();
      engine.setVolume(0.7);
      engine.setMuted(false);
      await engine.resume();
      engine.stopAll();
      const start = engine.ctx.currentTime + 0.15;
      for (const layer of clip.layers) engine.setLayerGain(`quiz-${layer}`, LAYER_GAIN * PLAYGROUND_OUTPUT_BOOST);
      for (const { layer, note } of clipNotes(clip, BAR_SECONDS)) {
        engine.playTone(`quiz-${layer}`, QUIZ_VOICES[layer], start + note.offsetSec, note.hz, note.amp, note.durationSec);
      }
      setPlaying(true);
      setPlayed(true);
      setError(null);
      if (timeout.current) window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => setPlaying(false), (clip.length * BAR_SECONDS + 0.5) * 1000);
    } catch {
      setError("Sound could not start in this browser.");
    }
  }

  function choose(value: string) {
    if (chosen) return;
    const next = { ...answers, [clip.id]: value };
    setAnswers(next);
    if (Object.keys(next).length === clips.length) {
      const final = clips.filter((c) => next[c.id] === c.answer).length;
      setSaveFailed(!save({ completedAt: new Date().toISOString(), score: final, total: clips.length }));
    }
  }

  function next() {
    peekSonarEngine()?.stopAll();
    setRound((r) => r + 1);
    setPlayed(false);
    setPlaying(false);
  }

  function restart(fresh: boolean) {
    peekSonarEngine()?.stopAll();
    if (fresh) setSet((s) => s + 1);
    setRound(0);
    setAnswers({});
    setPlayed(false);
    setPlaying(false);
    setSaveFailed(false);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-start gap-3" aria-live="polite">
        <p className="font-display text-2xl font-semibold text-ink">
          {score} of {clips.length} correct
        </p>
        <p className="max-w-2xl text-sm text-muted">
          {score === clips.length
            ? "Great ears. You can tell the two organs apart, hear a breakout chime and follow the motion pairs."
            : "Tip: the deep organ is the lower band, the higher organ the upper band. A second note going up means price is getting closer."}
        </p>
        {saveFailed ? <p className="text-xs text-subtle">Your score could not be saved in this browser.</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => restart(false)}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
          >
            <RotateCcw aria-hidden="true" className="size-4" /> Same clips again
          </button>
          <button
            type="button"
            onClick={() => restart(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
          >
            <Shuffle aria-hidden="true" className="size-4" /> New clips
          </button>
        </div>
      </div>
    );
  }

  const correct = chosen === clip.answer;

  return (
    <div className="flex flex-col gap-4">
      {progress && round === 0 && !chosen ? (
        <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success ring-1 ring-success/30">
          Last time you got {progress.score} of {progress.total}. Saved on this device only.
        </p>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-magenta">
        Clip {round + 1} of {clips.length} · {clip.length} bars
      </p>
      <p className="text-base text-ink">{clip.question}</p>
      <div>
        <button
          type="button"
          onClick={playClip}
          disabled={playing}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-magenta to-violet px-5 text-sm font-semibold text-white shadow-glow-violet transition hover:brightness-110 disabled:opacity-60"
        >
          {playing ? <Headphones aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          {playing ? "Listening..." : played ? "Play again" : "Play clip"}
        </button>
      </div>

      <div role="group" aria-label="Your answer" className={cn("grid gap-2", clip.choices.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {clip.choices.map((c) => {
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
                "flex min-h-12 items-center justify-between gap-2 rounded-xl px-4 text-left text-sm font-medium ring-1 transition disabled:cursor-not-allowed",
                !chosen && "bg-navy-950/50 text-ink ring-white/10 hover:ring-magenta/50 disabled:opacity-50",
                chosen && isAnswer && "bg-success/12 text-ink ring-success/60",
                chosen && isChosen && !isAnswer && "bg-danger/12 text-ink ring-danger/60",
                chosen && !isChosen && !isAnswer && "text-muted ring-white/5",
              )}
            >
              {c.label}
              {chosen && isAnswer ? <CheckCircle2 aria-label="Correct answer" className="size-5 shrink-0 text-success" /> : null}
              {chosen && isChosen && !isAnswer ? <XCircle aria-label="Your answer, incorrect" className="size-5 shrink-0 text-danger" /> : null}
            </button>
          );
        })}
      </div>
      {!played ? <p className="text-xs text-subtle">Play the clip first, then choose. Use the same device volume as in the playground.</p> : null}

      <div aria-live="polite" className="space-y-3">
        {chosen ? (
          <>
            <p className="rounded-xl bg-navy-950/40 px-4 py-3 text-sm text-muted">
              <span className={cn("font-semibold", correct ? "text-success" : "text-danger")}>{correct ? "Correct. " : "Not quite. "}</span>
              {clip.explanation}
            </p>
            <div className="rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/10">
              <SonarChart model={clipChart(clip)} revealTo={null} cursor={null} timeframeLabel="15m" />
            </div>
            <button
              type="button"
              onClick={next}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
            >
              {round + 1 < clips.length ? "Next clip" : "See result"}
            </button>
          </>
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

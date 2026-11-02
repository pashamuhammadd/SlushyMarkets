"use client";

import { useId, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle, Trophy } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { cn } from "@/lib/cn";
import { useDeviceProgress } from "@/lib/hooks/use-device-progress";
import type { QuizQuestion } from "@/data/lessons/types";

type LessonQuizProps = {
  lessonId: string;
  questions: QuizQuestion[];
};

/**
 * Short knowledge check. Each question locks after the first answer and always shows
 * the correct option with an explanation, so guessing teaches instead of scoring points.
 */
export function LessonQuiz({ lessonId, questions }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const { progress, save, clear } = useDeviceProgress(lessonId);
  const baseId = useId();

  const answeredCount = Object.keys(answers).length;
  const score = questions.filter((q) => answers[q.id] === q.correct).length;
  const finished = answeredCount === questions.length;

  function answer(question: QuizQuestion, optionId: string) {
    if (answers[question.id]) return;
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    if (Object.keys(next).length === questions.length) {
      const finalScore = questions.filter((q) => next[q.id] === q.correct).length;
      const ok = save({ completedAt: new Date().toISOString(), score: finalScore, total: questions.length });
      setSaveFailed(!ok);
    }
  }

  function reset() {
    setAnswers({});
    setSaveFailed(false);
  }

  return (
    <div className="space-y-4">
      {progress && !finished ? (
        <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success ring-1 ring-success/30">
          You completed this lesson before with {progress.score} of {progress.total} correct. Saved on this device only.
        </p>
      ) : null}

      <ol className="space-y-4">
        {questions.map((question, qi) => {
          const chosen = answers[question.id];
          const locked = Boolean(chosen);
          const correct = chosen === question.correct;
          const groupId = `${baseId}-${question.id}`;
          return (
            <li key={question.id} className="panel p-4 sm:p-5">
              <fieldset>
                <legend id={groupId} className="font-display text-lg font-semibold text-ink">
                  <span className="mr-2 text-cyan">{qi + 1}.</span>
                  {question.prompt}
                </legend>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option) => {
                    const isChosen = chosen === option.id;
                    const isCorrect = option.id === question.correct;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => answer(question, option.id)}
                        disabled={locked}
                        aria-pressed={isChosen}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm ring-1 transition",
                          !locked && "bg-navy-950/50 text-ink ring-white/10 hover:bg-navy-700/60 hover:ring-cyan/50",
                          locked && isCorrect && "bg-success/12 text-ink ring-success/60",
                          locked && isChosen && !isCorrect && "bg-danger/12 text-ink ring-danger/60",
                          locked && !isChosen && !isCorrect && "bg-navy-950/30 text-muted ring-white/5",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-6 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold uppercase ring-1 ring-white/15"
                        >
                          {option.id}
                        </span>
                        <span className="flex-1">{option.text}</span>
                        {locked && isCorrect ? <CheckCircle2 aria-label="Correct answer" className="size-5 shrink-0 text-success" /> : null}
                        {locked && isChosen && !isCorrect ? (
                          <XCircle aria-label="Your answer, incorrect" className="size-5 shrink-0 text-danger" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div aria-live="polite">
                  {locked ? (
                    <p className={cn("mt-3 rounded-xl px-4 py-3 text-sm", correct ? "bg-success/10" : "bg-danger/10")}>
                      <span className={cn("font-semibold", correct ? "text-success" : "text-danger")}>
                        {correct ? "Correct. " : "Not quite. "}
                      </span>
                      <span className="text-muted">{question.explanation}</span>
                    </p>
                  ) : null}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>

      {finished ? (
        <div className="panel panel-glow flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Mascot pose={score === questions.length ? "celebrate" : "thinking"} sizes="160px" className="w-36 shrink-0" />
          <div className="flex-1" aria-live="polite">
            <p className="flex items-center justify-center gap-2 font-display text-2xl font-semibold text-ink sm:justify-start">
              <Trophy aria-hidden="true" className="size-6 text-gold" />
              {score} of {questions.length} correct
            </p>
            <p className="mt-1 text-sm text-muted">
              {score === questions.length
                ? "Great work. You can read candles and volume by price from the same trades."
                : "Good effort. Read the explanations above, replay a step, then try again."}
            </p>
            <p className="mt-2 text-xs text-subtle">
              {saveFailed
                ? "Your browser blocked local storage, so this result was not saved. The lesson still works."
                : "Lesson marked as complete. Saved on this device only, nothing was sent anywhere."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Try the quiz again
              </button>
              {progress ? (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex h-10 items-center rounded-full px-4 text-sm text-muted transition hover:text-ink"
                >
                  Clear saved progress
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-subtle">
          {answeredCount} of {questions.length} answered. Your first choice counts, then the explanation appears.
        </p>
      )}
    </div>
  );
}

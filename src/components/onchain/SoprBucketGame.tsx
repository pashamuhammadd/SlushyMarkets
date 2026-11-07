"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Equal, Music } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";
import { SOPR_BUCKET_ROUNDS } from "@/data/lessons/on-chain-metrics";
import { useCueAudio } from "@/lib/hooks/use-cue-audio";
import { sopr, soprZone, type SoprZone } from "@/lib/onchain/metrics";
import { ValueBucket } from "./ValueBucket";

const GUESSES: { zone: SoprZone; label: string; icon: typeof ArrowUp }[] = [
  { zone: "profit", label: "Higher", icon: ArrowUp },
  { zone: "loss", label: "Lower", icon: ArrowDown },
  { zone: "break-even", label: "The same", icon: Equal },
];

const ANSWER_TEXT: Record<SoprZone, string> = { profit: "higher", loss: "lower", "break-even": "the same" };

/** Hear pitch for values in this game: $400 to $1,200 totals map around 440 Hz (Slushy's prototype mapping). */
const pitch = (value: number) => 440 * 2 ** ((value - 700) / 400);

/**
 * Slushy's SOPR bucket game: two outputs are spent together. Is their combined value when
 * spent higher, lower or the same as when they were created? Optional listen first mode
 * hides the numbers until you answer.
 */
export function SoprBucketGame() {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<SoprZone | null>(null);
  const [listenFirst, setListenFirst] = useState(false);
  const [score, setScore] = useState(0);
  const cues = useCueAudio();
  const listenId = useId();
  const nextRef = useRef<HTMLButtonElement>(null);

  const { outputs, label } = SOPR_BUCKET_ROUNDS[round];
  const before = outputs[0].createdUsd + outputs[1].createdUsd;
  const after = outputs[0].spentUsd + outputs[1].spentUsd;
  const ratio = sopr(outputs) ?? 1;
  const answer = soprZone(ratio);
  const revealed = guess !== null;
  const hideValues = listenFirst && !revealed;
  const last = round === SOPR_BUCKET_ROUNDS.length - 1;

  function choose(zone: SoprZone) {
    if (revealed) return;
    setGuess(zone);
    if (zone === answer) setScore((s) => s + 1);
    if (listenFirst) void cues.playNotes([pitch(before), pitch(after)]);
    window.setTimeout(() => nextRef.current?.focus(), 0);
  }

  function next() {
    if (last) setScore(0);
    setRound((r) => (r + 1) % SOPR_BUCKET_ROUNDS.length);
    setGuess(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {label} of {SOPR_BUCKET_ROUNDS.length}
        </p>
        <label htmlFor={listenId} className="flex items-center gap-2 text-sm text-muted">
          <input
            id={listenId}
            type="checkbox"
            checked={listenFirst}
            onChange={(e) => setListenFirst(e.target.checked)}
            className="size-4 accent-cyan"
          />
          Listen first: hide the values until I answer
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex items-end justify-center gap-6">
          <ValueBucket label="When created" valueUsd={before} maxUsd={1000} tone="violet" hidden={hideValues} />
          <ValueBucket label="When spent" valueUsd={after} maxUsd={1000} tone="cyan" hidden={hideValues} />
        </div>
        <div className="space-y-4">
          {hideValues ? (
            <p className="text-sm text-muted">Tap each button to hear the bucket. A higher note means more dollars.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-white/10">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Value of each output when created and when spent</caption>
                <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                  <tr>
                    <th scope="col" className="px-3 py-2">Output</th>
                    <th scope="col" className="px-3 py-2">When created</th>
                    <th scope="col" className="px-3 py-2">When spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-navy-900/60 tabular-nums text-muted">
                  {outputs.map((o, i) => (
                    <tr key={i}>
                      <th scope="row" className="px-3 py-2 font-semibold text-ink">{i === 0 ? "A" : "B"}</th>
                      <td className="px-3 py-2">{formatUsd(o.createdUsd)}</td>
                      <td className="px-3 py-2">{formatUsd(o.spentUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void cues.playNotes([pitch(before)])}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 hover:bg-white/5"
            >
              <Music aria-hidden="true" className="size-4 text-violet-soft" /> Hear when created
            </button>
            <button
              type="button"
              onClick={() => void cues.playNotes([pitch(after)])}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 hover:bg-white/5"
            >
              <Music aria-hidden="true" className="size-4 text-cyan" /> Hear when spent
            </button>
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">
          Together, is the value when spent higher, lower or the same as when created?
        </legend>
        <div className="flex flex-wrap gap-2">
          {GUESSES.map(({ zone, label: text, icon: Icon }) => {
            const chosen = guess === zone;
            const right = revealed && zone === answer;
            return (
              <button
                key={zone}
                type="button"
                disabled={revealed}
                aria-pressed={chosen}
                onClick={() => choose(zone)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ring-1 transition disabled:cursor-default",
                  right
                    ? "bg-success/15 text-success ring-success/50"
                    : chosen
                      ? "bg-danger/15 text-danger ring-danger/50"
                      : "text-ink ring-white/15 hover:bg-white/5 disabled:opacity-50",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {text}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {revealed ? (
          <div className="rounded-2xl bg-navy-950/60 p-4 text-sm text-muted ring-1 ring-white/10">
            <p>
              <span className="font-semibold text-ink">{guess === answer ? "Correct. " : "Not quite. "}</span>
              The combined value was {ANSWER_TEXT[answer]}. SOPR = {formatUsd(after)} / {formatUsd(before)} ={" "}
              <span className="font-semibold text-ink">{ratio.toFixed(2)}</span>.
            </p>
            {round === 0 ? (
              <p className="mt-2">
                Output A doubled and output B lost value. SOPR adds the dollars first, then divides, so the big output counts more.
              </p>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-cyan/15 px-4 text-sm font-semibold text-ink ring-1 ring-cyan/50"
            >
              {last ? `Play again (you got ${score} of ${SOPR_BUCKET_ROUNDS.length})` : "Next example"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {cues.error ? (
        <p role="alert" className="text-sm text-danger">
          {cues.error}
        </p>
      ) : null}
    </div>
  );
}

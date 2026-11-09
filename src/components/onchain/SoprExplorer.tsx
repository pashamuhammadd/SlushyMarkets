"use client";

import { useId, useRef, useState } from "react";
import { Bell, BellOff, Music } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PRICE_SLIDER, SOPR_DEFAULTS } from "@/data/lessons/on-chain-metrics";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";
import { useCueAudio } from "@/lib/hooks/use-cue-audio";
import { SOPR_GAUGE_TICKS, soprGaugePosition, sopr, soprZone, valueToHz } from "@/lib/onchain/metrics";
import { ValueBucket } from "./ValueBucket";

const ZONE_UI = {
  profit: { tone: "success" as const, text: "Above 1.0: spent for more than it was worth when created" },
  loss: { tone: "danger" as const, text: "Below 1.0: spent for less than it was worth when created" },
  "break-even": { tone: "neutral" as const, text: "About 1.0: spent for what it was worth when created" },
};

/** SOPR for one coin. Drag either price and hear a chime whenever the ratio crosses 1.0. */
export function SoprExplorer() {
  const [created, setCreated] = useState<number>(SOPR_DEFAULTS.createdUsd);
  const [spent, setSpent] = useState<number>(SOPR_DEFAULTS.spentUsd);
  const cues = useCueAudio();
  const createdId = useId();
  const spentId = useId();
  const lastSide = useRef(Math.sign(SOPR_DEFAULTS.spentUsd - SOPR_DEFAULTS.createdUsd));

  const ratio = sopr([{ createdUsd: created, spentUsd: spent }]) ?? 1;
  const zone = soprZone(ratio);

  function update(nextCreated: number, nextSpent: number) {
    setCreated(nextCreated);
    setSpent(nextSpent);
    const side = Math.sign(nextSpent - nextCreated);
    if (side !== 0 && lastSide.current !== 0 && side !== lastSide.current) cues.chime(side > 0 ? "up" : "down");
    if (side !== 0) lastSide.current = side;
  }

  const hz = (v: number) => valueToHz(v, PRICE_SLIDER.min, PRICE_SLIDER.max);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div className="flex items-end justify-center gap-6 sm:gap-10">
        <ValueBucket label="When created" valueUsd={created} maxUsd={PRICE_SLIDER.max} tone="violet" caption="Coin A, 1 BTC" />
        <ValueBucket label="When spent" valueUsd={spent} maxUsd={PRICE_SLIDER.max} tone="cyan" caption="Coin A, 1 BTC" />
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor={createdId} className="text-sm text-muted">
            BTC price when the output was created: <span className="font-semibold tabular-nums text-ink">{formatUsd(created)}</span>
            <input
              id={createdId}
              type="range"
              min={PRICE_SLIDER.min}
              max={PRICE_SLIDER.max}
              step={PRICE_SLIDER.step}
              value={created}
              onChange={(e) => update(Number(e.target.value), spent)}
              className="mt-2 h-2 w-full cursor-pointer accent-violet"
            />
          </label>
          <label htmlFor={spentId} className="text-sm text-muted">
            BTC price when it was spent: <span className="font-semibold tabular-nums text-ink">{formatUsd(spent)}</span>
            <input
              id={spentId}
              type="range"
              min={PRICE_SLIDER.min}
              max={PRICE_SLIDER.max}
              step={PRICE_SLIDER.step}
              value={spent}
              onChange={(e) => update(created, Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer accent-cyan"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-navy-950/60 p-4 ring-1 ring-white/10" aria-live="polite">
          <p className="font-mono text-sm text-cyan-soft">
            SOPR = {formatUsd(spent)} / {formatUsd(created)} = <span className="text-lg font-semibold text-ink">{ratio.toFixed(2)}</span>
          </p>
          <div aria-hidden="true" className="relative mt-4 h-3 rounded-full bg-linear-to-r from-danger/50 via-white/15 to-success/50">
            <span className="absolute -top-1.5 h-6 w-0.5 bg-ink/80" style={{ left: `${soprGaugePosition(1) * 100}%` }} />
            <span
              className="absolute -top-1 size-5 -translate-x-1/2 rounded-full bg-ink shadow-glow-cyan transition-[left] duration-300 motion-reduce:transition-none"
              style={{ left: `${soprGaugePosition(ratio) * 100}%` }}
            />
          </div>
          <div aria-hidden="true" className="relative mt-2 h-4 text-[11px] tabular-nums text-subtle">
            {SOPR_GAUGE_TICKS.map((tick) => {
              const position = soprGaugePosition(tick);
              return (
                <span
                  key={tick}
                  className={cn(
                    "absolute",
                    position === 0 ? "translate-x-0" : position === 1 ? "-translate-x-full" : "-translate-x-1/2",
                    tick === 1 && "font-bold text-ink",
                  )}
                  style={{ left: `${position * 100}%` }}
                >
                  {tick === 1 ? "1.0" : tick}
                </span>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-subtle">
            Covers every value these sliders can make, 0.25 to 4. Each mark doubles the one before it, and 1.0, break even, sits in the middle.
          </p>
          <Badge tone={ZONE_UI[zone].tone} className="mt-3">
            {ZONE_UI[zone].text}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void cues.playNotes([hz(created), hz(spent)])}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
          >
            <Music aria-hidden="true" className="size-4 text-cyan" />
            Hear created, then spent
          </button>
          <button
            type="button"
            aria-pressed={cues.enabled}
            onClick={() => (cues.enabled ? cues.disable() : void cues.enable())}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
          >
            {cues.enabled ? <Bell aria-hidden="true" className="size-4 text-gold" /> : <BellOff aria-hidden="true" className="size-4" />}
            Chime when SOPR crosses 1.0: {cues.enabled ? "On" : "Off"}
          </button>
        </div>
        <p className="text-xs text-subtle">A higher note means a higher dollar value. A rising chime marks a cross above 1.0, a falling chime a cross below.</p>
        {cues.error ? (
          <p role="alert" className="text-sm text-danger">
            {cues.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

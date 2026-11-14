"use client";

import { useId } from "react";
import { Pause, Play, RefreshCw, RotateCcw, Shuffle, Square, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { useSonarPlayer } from "@/lib/hooks/use-sonar-player";
import { TIMEFRAME_OPTIONS, VISIBLE_BARS, timeframeOption } from "@/lib/sonification/market";
import { BAR_SECONDS, audibleGain, hasSolo } from "@/lib/sonification/mixer";
import { emaSonarMode } from "@/lib/sonification/modes/ema-sonar";
import { erDrumsMode } from "@/lib/sonification/modes/er-drums";
import { sonarVolumeMode } from "@/lib/sonification/modes/sonar-volume";
import { fractalsMode } from "@/lib/sonification/modes/fractals";
import type { PlayableModeId } from "@/lib/sonification/modes";
import { sonarBandsMode } from "@/lib/sonification/modes/sonar-bands";
import { PULSE_RATES, type LayerDefinition, type LayerSettings, type PulseRate, type SonificationMode } from "@/lib/sonification/types";
import { VOICES, VOICE_IDS, type VoiceId } from "@/lib/sonification/voices";
import { SonarChart } from "./SonarChart";

const INITIAL_SEED = 20261108;

const chip = (active: boolean) =>
  cn(
    "h-9 rounded-full px-3.5 text-xs font-semibold ring-1 transition",
    active ? "bg-cyan/15 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink",
  );

const iconButton =
  "grid size-11 place-items-center rounded-full text-ink ring-1 ring-white/10 transition hover:bg-white/5 disabled:opacity-40";

const selectClass =
  "h-10 w-full rounded-xl bg-navy-950/70 px-3 text-sm text-ink ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan";

/**
 * Interactive Sound Playground. Pages pass a mode id (functions cannot cross from a server
 * page to a client component), and the matching mode is picked here. Audio starts only on Play.
 */
export function SoundPlayground({ modeId }: { modeId: PlayableModeId }) {
  if (modeId === "sonar-bands") return <PlaygroundView mode={sonarBandsMode} />;
  if (modeId === "sonar-er-drums") return <PlaygroundView mode={erDrumsMode} />;
  if (modeId === "sonar-volume") return <PlaygroundView mode={sonarVolumeMode} />;
  if (modeId === "fractals") return <PlaygroundView mode={fractalsMode} />;
  return <PlaygroundView mode={emaSonarMode} />;
}

function PlaygroundView<A>({ mode }: { mode: SonificationMode<A> }) {
  const p = useSonarPlayer(mode, INITIAL_SEED);
  const volumeId = useId();
  const playing = p.status === "playing";
  const active = p.status === "playing" || p.status === "paused";
  const tf = timeframeOption(p.timeframe);
  const readoutBar = active || p.status === "finished" ? p.cursor : VISIBLE_BARS - 1;
  const preset = mode.presets.find((x) => x.id === p.presetId);
  const anySolo = hasSolo(p.layers);
  const chart = mode.chart(p.analysis);
  const readout = mode.readout(readoutBar, p.analysis, p.options);

  const statusText =
    p.status === "playing"
      ? `Playing bar ${p.cursor + 1} of ${VISIBLE_BARS}`
      : p.status === "paused"
        ? `Paused at bar ${p.cursor + 1}. Press Play to continue.`
        : p.status === "finished"
          ? "Finished. Replay the same chart to compare mixes."
          : "Ready. Press Play to hear the chart.";

  return (
    <div className="flex flex-col gap-5">
      {/* Presets and chart setup */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Preset</legend>
          <div className="flex flex-wrap gap-2">
            {mode.presets.map((x) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={p.presetId === x.id}
                onClick={() => p.applyPreset(x.id)}
                className={chip(p.presetId === x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
          {preset ? <p className="mt-2 text-sm text-muted">{preset.description}</p> : null}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Timeframe</legend>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAME_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={p.timeframe === t.id}
                onClick={() => p.setTimeframe(t.id)}
                className={chip(p.timeframe === t.id)}
              >
                {t.id}
              </button>
            ))}
            <button type="button" onClick={p.newChart} className={cn(chip(false), "inline-flex items-center gap-1.5")}>
              <Shuffle aria-hidden="true" className="size-3.5" />
              New chart
            </button>
          </div>
        </fieldset>
      </div>

      {mode.toggles.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {mode.toggles.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-navy-950/45 p-3 ring-1 ring-white/10">
              <button
                type="button"
                aria-pressed={p.options[t.id]}
                onClick={() => p.setOption(t.id, !p.options[t.id])}
                className={chip(p.options[t.id])}
              >
                {t.label}: {p.options[t.id] ? "On" : "Off"}
              </button>
              <p className="max-w-xl text-xs text-muted">{t.description}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Chart and live readout */}
      <div className="rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/10 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <span className="text-xs text-subtle">
            Chart #{p.seed - INITIAL_SEED + 1} · {tf.id} bars · {VISIBLE_BARS} bars in {VISIBLE_BARS * BAR_SECONDS} seconds
          </span>
        </div>
        <SonarChart
          model={chart}
          revealTo={active ? p.cursor : null}
          cursor={active || p.status === "finished" ? p.cursor : null}
          timeframeLabel={tf.id}
        />
        <ul className="mt-3 grid gap-2 sm:grid-cols-3" aria-label={`Live readout at bar ${readoutBar + 1}`}>
          {readout.map((item) => {
            const settings = p.layers[item.id];
            const muted = settings ? audibleGain(settings, anySolo) === 0 : false;
            const heard = item.loudness === null ? null : Math.round(Math.min(item.loudness, 1) * 100);
            return (
              <li key={item.id} className="rounded-xl bg-navy-900/70 p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    <span aria-hidden="true" className="inline-block h-1 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  {heard !== null ? (
                    <span className="tabular-nums text-muted">
                      {muted ? "Silenced" : item.loudness !== null && item.loudness > 1 ? "Extra loud" : `Loudness ${heard}%`}
                    </span>
                  ) : null}
                </div>
                {heard !== null ? (
                  <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${muted ? 0 : heard}%`, backgroundColor: item.color }} />
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-muted">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Transport */}
      <div className="rounded-2xl bg-navy-900/80 p-3 ring-1 ring-white/10 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={playing ? p.pause : p.play}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-violet px-5 text-sm font-semibold text-navy-950 shadow-glow-violet transition hover:brightness-110"
          >
            {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
            {playing ? "Pause" : p.status === "paused" ? "Resume" : "Play"}
          </button>
          <button type="button" onClick={p.stop} disabled={p.status === "idle"} aria-label="Stop and rewind" className={iconButton}>
            <Square aria-hidden="true" className="size-4" />
          </button>
          <button type="button" onClick={p.replay} aria-label="Replay from the start" className={iconButton}>
            <RotateCcw aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => p.setMuted(!p.muted)}
            aria-pressed={p.muted}
            aria-label={p.muted ? "Unmute all sound" : "Mute all sound"}
            className={iconButton}
          >
            {p.muted ? <VolumeX aria-hidden="true" className="size-4 text-danger" /> : <Volume2 aria-hidden="true" className="size-4" />}
          </button>
          <div className="flex min-w-36 flex-1 items-center gap-2 sm:max-w-56">
            <label htmlFor={volumeId} className="text-xs text-muted">
              Volume
            </label>
            <input
              id={volumeId}
              type="range"
              min={0}
              max={100}
              value={Math.round(p.volume * 100)}
              onChange={(e) => p.setVolume(Number(e.target.value) / 100)}
              className="h-2 w-full cursor-pointer accent-cyan"
            />
          </div>
        </div>
        <p role="status" className="mt-3 text-sm text-muted">
          {statusText}
        </p>
        {p.error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {p.error}
          </p>
        ) : null}
      </div>

      {/* Layer mixer */}
      <section aria-labelledby={`${mode.id}-mixer-title`} className="rounded-2xl bg-navy-950/45 p-3 ring-1 ring-white/10 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${mode.id}-mixer-title`} className="font-sans text-base font-semibold text-ink">
            Audio layers
          </h3>
          <button type="button" onClick={p.resetToPreset} className={cn(chip(false), "inline-flex items-center gap-1.5")}>
            <RefreshCw aria-hidden="true" className="size-3.5" />
            Reset to preset
          </button>
        </div>
        <ul className="grid gap-3">
          {mode.layers.map((l) => (
            <LayerRow
              key={l.id}
              layer={l}
              settings={p.layers[l.id]}
              onChange={(patch) => p.updateLayer(l.id, patch)}
              onPreview={() => void p.previewLayer(l.id)}
            />
          ))}
        </ul>
        <p className="mt-3 text-xs text-subtle">
          Mute, Solo and Volume change the sound right away. A new instrument, pulse speed or switch starts on the next bar.
        </p>
      </section>
    </div>
  );
}

function LayerRow({
  layer,
  settings,
  onChange,
  onPreview,
}: {
  layer: LayerDefinition;
  settings: LayerSettings;
  onChange: (patch: Partial<LayerSettings>) => void;
  onPreview: () => void;
}) {
  const base = useId();
  const toggle = (on: boolean, tone: "danger" | "gold") =>
    cn(
      "h-10 rounded-xl px-3 text-xs font-semibold ring-1 transition",
      on ? (tone === "danger" ? "bg-danger/15 text-danger ring-danger/50" : "bg-gold/15 text-gold ring-gold/50") : "text-muted ring-white/10 hover:text-ink",
    );

  return (
    <li className="grid gap-3 rounded-xl bg-navy-900/70 p-3 ring-1 ring-white/10 md:grid-cols-[9rem_1fr_1fr_1fr_auto] md:items-end">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span aria-hidden="true" className="inline-block h-1 w-4 rounded-full" style={{ backgroundColor: layer.color }} />
          {layer.label}
        </p>
        <p className="mt-0.5 text-xs text-subtle">{layer.detail}</p>
      </div>
      <label className="text-xs text-muted" htmlFor={`${base}-voice`}>
        Instrument
        <select
          id={`${base}-voice`}
          value={settings.voice}
          onChange={(e) => onChange({ voice: e.target.value as VoiceId })}
          className={cn(selectClass, "mt-1")}
        >
          {VOICE_IDS.map((v) => (
            <option key={v} value={v}>
              {VOICES[v].label}
            </option>
          ))}
        </select>
      </label>
      {layer.kind === "continuous" ? (
        <label className="text-xs text-muted" htmlFor={`${base}-rate`}>
          Pulse speed
          <select
            id={`${base}-rate`}
            value={settings.rate}
            onChange={(e) => onChange({ rate: Number(e.target.value) as PulseRate })}
            className={cn(selectClass, "mt-1")}
          >
            {PULSE_RATES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-xs text-muted">
          Pulse speed
          <span className="mt-1 flex h-10 items-center rounded-xl px-3 text-sm text-subtle ring-1 ring-white/5">Only when it happens</span>
        </p>
      )}
      <label className="text-xs text-muted" htmlFor={`${base}-gain`}>
        Layer volume {Math.round(settings.gain * 100)}%
        <input
          id={`${base}-gain`}
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.gain * 100)}
          onChange={(e) => onChange({ gain: Number(e.target.value) / 100 })}
          className="mt-3 h-2 w-full cursor-pointer accent-cyan"
        />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onPreview} className={toggle(false, "gold")} aria-label={`Preview the ${layer.label} instrument`}>
          Preview
        </button>
        <button
          type="button"
          aria-pressed={settings.mute}
          aria-label={`Mute ${layer.label}`}
          onClick={() => onChange({ mute: !settings.mute })}
          className={toggle(settings.mute, "danger")}
        >
          Mute
        </button>
        <button
          type="button"
          aria-pressed={settings.solo}
          aria-label={`Solo ${layer.label}`}
          onClick={() => onChange({ solo: !settings.solo })}
          className={toggle(settings.solo, "gold")}
        >
          Solo
        </button>
      </div>
    </li>
  );
}

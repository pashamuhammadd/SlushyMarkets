"use client";

import { useMemo } from "react";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  DEMO_BAND_USD,
  DEMO_CANDLE_MS,
  DEMO_ORIGIN_MS,
  DEMO_PRICE_RANGE,
  DEMO_SYMBOL,
  DEMO_TRADES,
} from "@/data/demo-trades";
import { formatBtc, formatClock, formatUsd } from "@/lib/format";
import { useElementWidth } from "@/lib/hooks/use-element-width";
import { usePlayback } from "@/lib/hooks/use-playback";
import { buildCandles } from "@/lib/simulations/ohlc";
import { buildVolumeProfile } from "@/lib/simulations/volume-profile";
import { CandleChart } from "./CandleChart";
import { PlaybackControls } from "./PlaybackControls";
import { NodeLegend, VolumeProfileChart } from "./VolumeProfileChart";

const SLOT_COUNT = 12;
const candleOptions = { candleMs: DEMO_CANDLE_MS, originMs: DEMO_ORIGIN_MS };
const profileOptions = { bandUsd: DEMO_BAND_USD, ...DEMO_PRICE_RANGE };

// Fixed maxima from the full series: bars grow during playback instead of jumping in scale.
const FULL_CANDLES = buildCandles(DEMO_TRADES, candleOptions);
const FULL_PROFILE = buildVolumeProfile(DEMO_TRADES, profileOptions);
const VOLUME_MAX = Math.max(...FULL_CANDLES.map((c) => c.volumeBtc));
const BAND_MAX = Math.max(...FULL_PROFILE.bands.map((b) => b.volumeBtc));

/**
 * Compact, working preview of the Candlesticks and Volume lesson.
 * Candles and the volume profile are both pure functions of the same trade prefix.
 */
export function CandleVolumePreview() {
  const playback = usePlayback({ total: DEMO_TRADES.length });
  const [candleRef, candleWidth] = useElementWidth<HTMLDivElement>(560);
  const [profileRef, profileWidth] = useElementWidth<HTMLDivElement>(300);

  const { cursor, total, playing } = playback;
  const view = useMemo(() => {
    const prefix = DEMO_TRADES.slice(0, cursor);
    const candles = buildCandles(prefix, candleOptions);
    const profile = buildVolumeProfile(prefix, profileOptions);
    const lastTrade = prefix.length ? prefix[prefix.length - 1] : null;
    return { candles, profile, lastTrade };
  }, [cursor]);

  const forming = cursor > 0 && cursor < total;
  const lastPrice = view.lastTrade?.priceUsd ?? null;
  const formingCandle = forming ? view.candles[view.candles.length - 1] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="violet">
          <FlaskConical aria-hidden="true" className="size-3.5" />
          Simulated data
        </Badge>
        <span className="font-medium text-ink">{DEMO_SYMBOL}</span>
        <span aria-hidden="true">·</span>
        <span>1 minute candles</span>
        <span aria-hidden="true">·</span>
        <span>${DEMO_BAND_USD} price bands</span>
        <span className="basis-full text-subtle sm:ml-auto sm:basis-auto">Invented trades for teaching. Not live market data.</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.65fr_1fr]">
        <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <figcaption className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">Candles from executed trades</span>
            <span className="text-xs tabular-nums text-muted">
              {formingCandle ? `Forming ${formatClock(formingCandle.startMs)} UTC` : cursor === 0 ? "Waiting for trades" : "Complete"}
            </span>
          </figcaption>
          <div ref={candleRef} className="w-full">
            <CandleChart
              width={candleWidth}
              candles={view.candles}
              slotCount={SLOT_COUNT}
              originMs={DEMO_ORIGIN_MS}
              candleMs={DEMO_CANDLE_MS}
              range={DEMO_PRICE_RANGE}
              volumeMax={VOLUME_MAX}
              lastPrice={lastPrice}
              forming={forming}
              label={`Candlestick chart of ${view.candles.length} one minute candles built from ${cursor} simulated trades.`}
            />
          </div>
        </figure>

        <figure className="min-w-0 rounded-2xl bg-navy-950/55 p-3 ring-1 ring-white/5">
          <figcaption className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-ink">Volume by price</span>
            <span className="text-xs text-muted">Same trades, grouped by price</span>
          </figcaption>
          <div ref={profileRef} className="w-full">
            <VolumeProfileChart
              width={profileWidth}
              profile={view.profile}
              range={DEMO_PRICE_RANGE}
              bandMax={BAND_MAX}
              lastPrice={lastPrice}
              label={`Volume profile with ${view.profile.totalVolumeBtc} BTC of simulated executed volume across ${DEMO_BAND_USD} dollar price bands.`}
            />
          </div>
          <NodeLegend />
        </figure>
      </div>

      <div className="rounded-2xl bg-navy-950/40 p-3 ring-1 ring-white/5 sm:p-4">
        <PlaybackControls playback={playback} />
        <p className="mt-3 min-h-10 text-sm text-muted" aria-live={playing ? "off" : "polite"}>
          {view.lastTrade ? (
            <>
              Last trade: <span className="font-semibold text-ink tabular-nums">{formatUsd(view.lastTrade.priceUsd)}</span> for{" "}
              <span className="font-semibold text-ink tabular-nums">{formatBtc(view.lastTrade.quantityBtc)}</span>. The candle
              records the price move, while the profile adds that quantity to the band where the trade actually happened.
            </>
          ) : (
            <>No trades yet. Press Play or step forward to execute the first trade.</>
          )}
        </p>
      </div>
    </div>
  );
}

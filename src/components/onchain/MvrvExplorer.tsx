"use client";

import { useId, useState } from "react";
import { RotateCcw, Send } from "lucide-react";
import { MVRV_START_PRICE, PRICE_SLIDER, TWO_COINS } from "@/data/lessons/on-chain-metrics";
import { formatUsd } from "@/lib/format";
import { marketValue, moveCoin, mvrv, realizedValue, type Coin } from "@/lib/onchain/metrics";
import { ValueBucket } from "./ValueBucket";

const BUCKET_MAX = 2 * PRICE_SLIDER.max;

/**
 * Slushy's two coin MVRV story. The blue bucket prices both coins at today's price
 * (market value). The pink bucket prices each coin at the price when it last moved
 * (realized value). Change the price, then move a coin and watch which bucket reacts.
 */
export function MvrvExplorer() {
  const [price, setPrice] = useState(MVRV_START_PRICE);
  const [coins, setCoins] = useState<Coin[]>(() => TWO_COINS.map((c) => ({ ...c })));
  const [event, setEvent] = useState<string | null>(null);
  const priceId = useId();

  const market = marketValue(coins, price);
  const realized = realizedValue(coins);
  const ratio = mvrv(coins, price) ?? 1;

  function move(coin: Coin) {
    setCoins((prev) => moveCoin(prev, coin.id, price));
    setEvent(
      coin.lastMovedPriceUsd === price
        ? `${coin.label} moved again at ${formatUsd(price)}. Its last moved price did not change, so realized value stayed the same.`
        : `${coin.label} moved at ${formatUsd(price)}. Its realized price changed from ${formatUsd(coin.lastMovedPriceUsd)} to ${formatUsd(price)}, so the pink bucket ${
            price > coin.lastMovedPriceUsd ? "rose" : "fell"
          } by ${formatUsd(Math.abs(price - coin.lastMovedPriceUsd))}.`,
    );
  }

  function reset() {
    setPrice(MVRV_START_PRICE);
    setCoins(TWO_COINS.map((c) => ({ ...c })));
    setEvent(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex items-end justify-center gap-6 sm:gap-10">
          <ValueBucket label="Market value" valueUsd={market} maxUsd={BUCKET_MAX} tone="cyan" caption="Both coins at today's price" />
          <ValueBucket label="Realized value" valueUsd={realized} maxUsd={BUCKET_MAX} tone="magenta" caption="Each coin at its last moved price" />
        </div>

        <div className="space-y-4">
          <label htmlFor={priceId} className="block text-sm text-muted">
            Today&apos;s BTC price: <span className="font-semibold tabular-nums text-ink">{formatUsd(price)}</span>
            <input
              id={priceId}
              type="range"
              min={PRICE_SLIDER.min}
              max={PRICE_SLIDER.max}
              step={PRICE_SLIDER.step}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer accent-cyan"
            />
          </label>

          <div className="rounded-2xl bg-navy-950/60 p-4 ring-1 ring-white/10" aria-live="polite">
            <p className="font-mono text-sm text-cyan-soft">
              MVRV = {formatUsd(market)} / {formatUsd(realized)} = <span className="text-lg font-semibold text-ink">{ratio.toFixed(2)}</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {ratio > 1.005
                ? "Above 1: the coins are worth more today than the prices they last moved at, on the whole."
                : ratio < 0.995
                  ? "Below 1: the coins are worth less today than the prices they last moved at, on the whole."
                  : "About 1: today's value matches the prices the coins last moved at."}
            </p>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {coins.map((coin) => (
              <li key={coin.id} className="flex items-center justify-between gap-3 rounded-xl bg-navy-900/70 p-3 ring-1 ring-white/10">
                <span className="text-sm">
                  <span className="block font-semibold text-ink">{coin.label}, 1 BTC</span>
                  <span className="block text-xs text-muted">Last moved at {formatUsd(coin.lastMovedPriceUsd)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => move(coin)}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-ink ring-1 ring-magenta/40 transition hover:bg-magenta/10"
                >
                  <Send aria-hidden="true" className="size-3.5 text-magenta" />
                  Move at {formatUsd(price)}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPrice(75_000)}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 hover:bg-white/5"
            >
              Set price to $75,000
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-muted ring-1 ring-white/15 hover:text-ink"
            >
              <RotateCcw aria-hidden="true" className="size-4" /> Reset
            </button>
          </div>
        </div>
      </div>
      <p aria-live="polite" className="min-h-6 text-sm text-muted">
        {event ?? "Try it: set the price to $75,000 and watch only the blue bucket rise. Then move Coin A at that price and watch the pink bucket rise."}
      </p>
    </div>
  );
}

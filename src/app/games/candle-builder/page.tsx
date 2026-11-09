import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CandleBuilderGame } from "@/components/games/CandleBuilderGame";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { MAX_SCORE, ROUNDS_PER_GAME } from "@/lib/games/candle-builder";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Candle Builder: Practice Reading OHLC from Trades",
  description:
    "A free practice game: read the simulated trades of one minute, pick the open, high, low and close, and compare your candle with the real one.",
  path: "/games/candle-builder",
});

export default function CandleBuilderPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Candle Builder",
          description: metadata.description as string,
          path: "/games/candle-builder",
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Games", path: "/games" },
            { name: "Candle Builder", path: "/games/candle-builder" },
          ],
          teaches: ["Candlesticks", "Open, high, low, close"],
          minutes: 3,
          resourceType: "Educational game",
        })}
      />
      <PageHeader
        eyebrow="Game"
        title="Candle Builder"
        description="Every candle is a summary of trades. Read one minute of trades and build its candle yourself."
        pose="candleCarry"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="cyan">Practice</Badge>
          <span>
            {ROUNDS_PER_GAME} rounds, {MAX_SCORE} points
          </span>
          <span aria-hidden="true">·</span>
          <span>About 3 minutes</span>
        </div>
      </PageHeader>
      <Container className="space-y-10">
        <section aria-label="Game">
          <CandleBuilderGame />
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Need a refresher?</h2>
              <p className="mt-1 text-sm text-muted">Watch candles form one trade at a time in the first lesson.</p>
            </div>
            <Link href="/learn/candlesticks-and-volume" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              Candlesticks and Volume <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Education only</h2>
              <p className="mt-1 text-sm text-muted">Simulated trades, no real money, no wallet, no prizes. Your best score stays in this browser.</p>
            </div>
            <Link href="/games" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              All games <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CandleVolumePreview } from "@/components/lessons/CandleVolumePreview";
import { Container } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Explore Demo",
  description:
    "Play with a working candlestick and volume by price demo built from simulated trades, plus a beginner glossary.",
  path: "/explore",
});

const glossary = [
  { term: "Trade", definition: "One completed exchange between a buyer and a seller at a single price and quantity." },
  { term: "Candle", definition: "A summary of all trades in one time interval, drawn from its open, high, low and close." },
  { term: "OHLC", definition: "Open, high, low and close: the first, highest, lowest and last trade prices of an interval." },
  { term: "Volume", definition: "The total quantity traded. Here it is measured in BTC for a simulated BTC-like market." },
  { term: "Volume by price", definition: "Executed volume grouped into price bands instead of time intervals. Also called a volume profile." },
  { term: "High volume node", definition: "A price band where a lot of trading happened compared to its neighbors." },
  { term: "Low volume node", definition: "A price band where little trading happened, often because price moved through it quickly." },
  { term: "Point of control", definition: "The single price band with the most executed volume in the selected data." },
  { term: "Order book liquidity", definition: "Orders still waiting to be filled. Different from executed volume, which has already traded." },
];

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Explore the demo"
        description="A hands on playground. Play, pause, step one trade at a time or drag the timeline. Every view updates from the same simulated trades."
        pose="toTheMoon"
      />
      <Container className="space-y-10">
        <section aria-labelledby="demo-title" className="panel panel-glow p-4 sm:p-6">
          <h2 id="demo-title" className="mb-4 text-xl font-semibold text-ink">
            Candles and volume by price
          </h2>
          <CandleVolumePreview />
        </section>

        <section aria-labelledby="glossary-title">
          <h2 id="glossary-title" className="text-2xl font-semibold text-ink">
            Beginner glossary
          </h2>
          <p className="mt-1 text-muted">The words you will see in the lessons, in plain English.</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {glossary.map((item) => (
              <div key={item.term} className="panel p-4">
                <dt className="font-display text-lg font-semibold text-cyan-soft">{item.term}</dt>
                <dd className="mt-1 text-sm text-muted">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-ink">Want to hear trends too?</h2>
            <p className="mt-1 text-sm text-muted">The Three Trends, One Piano prototype is being built in the Audio Lab.</p>
          </div>
          <Link href="/audio-lab" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
            Go to Audio Lab <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </Container>
    </>
  );
}

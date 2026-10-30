import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CandleVolumePreview } from "@/components/lessons/CandleVolumePreview";
import { Container } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";

export const metadata: Metadata = {
  title: "Candlesticks and Volume",
  description:
    "See how candlesticks and volume by price are built from the same executed trades. Interactive preview with simulated data.",
};

const ideas = [
  {
    title: "A candle is a summary",
    body: "Each candle summarizes every trade in one time interval: the first price (open), the highest (high), the lowest (low) and the last (close).",
  },
  {
    title: "Volume follows the trades",
    body: "Volume by price adds up the quantity that actually traded at each price band. When price moves on, the volume stays where the trades happened.",
  },
  {
    title: "Traded is not waiting",
    body: "This is executed volume, not orders still waiting in an order book. A busy band shows past activity, not a promise of future support.",
  },
];

export default function CandlesticksAndVolumePage() {
  return (
    <>
      <PageHeader
        eyebrow="Lesson preview"
        title="Candlesticks and Volume"
        description="Watch candles form from individual trades while the same trades stack up as volume by price."
        pose="trading"
      />
      <Container className="space-y-8">
        <StatusNotice title="Preview of a lesson in development">
          <p>
            The player below already works. The full guided lesson is coming next, with step by step explanations, labels for
            high and low volume nodes and a short quiz.
          </p>
        </StatusNotice>

        <section aria-labelledby="player-title" className="panel panel-glow p-4 sm:p-6">
          <h2 id="player-title" className="mb-4 text-xl font-semibold text-ink">
            Try it: one clock, two views
          </h2>
          <CandleVolumePreview />
        </section>

        <section aria-labelledby="ideas-title">
          <h2 id="ideas-title" className="text-2xl font-semibold text-ink">
            Key ideas
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <li key={idea.title} className="panel p-5">
                <h3 className="text-lg font-semibold text-ink">{idea.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{idea.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}

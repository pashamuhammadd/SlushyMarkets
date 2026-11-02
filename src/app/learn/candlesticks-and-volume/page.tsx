import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CandleVolumeLesson } from "@/components/lessons/CandleVolumeLesson";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { DEMO_BAND_USD, DEMO_BUCKET_USD } from "@/data/demo-trades";
import { LESSON_ID, QUIZ } from "@/data/lessons/candlesticks-and-volume";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Candlesticks and Volume",
  description:
    "Interactive lesson: watch candlesticks, a volume profile and volume buckets form from the same simulated trades, then check your understanding.",
  path: "/learn/candlesticks-and-volume",
});

const ideas = [
  {
    title: "A candle is a summary",
    body: "Each candle summarizes every trade in one time interval: the first price (open), the highest (high), the lowest (low) and the last (close).",
  },
  {
    title: "Volume follows the trades",
    body: "Volume by price adds up the quantity that actually traded at each price. When price moves on, the volume stays where the trades happened.",
  },
  {
    title: "Traded is not waiting",
    body: "This is executed volume, not orders still waiting in an order book. A busy area shows past activity, not a promise of future support.",
  },
];

export default function CandlesticksAndVolumePage() {
  return (
    <>
      <PageHeader
        eyebrow="Lesson 1"
        title="Candlesticks and Volume"
        description="Watch candles form from individual trades while the very same trades stack up as volume by price."
        pose="trading"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="cyan">
            <GraduationCap aria-hidden="true" className="size-3.5" />
            Beginner
          </Badge>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" /> About 8 minutes
          </span>
          <span aria-hidden="true">·</span>
          <span>5 steps and a 3 question check</span>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <section aria-label="Interactive lesson">
          <CandleVolumeLesson />
        </section>

        <section aria-labelledby="ideas-title">
          <SectionHeading id="ideas-title" icon={<BookOpen className="size-5" />} title="Key ideas" />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <li key={idea.title} className="panel p-5">
                <h3 className="text-lg font-semibold text-ink">{idea.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{idea.body}</p>
              </li>
            ))}
          </ul>
          <details className="panel mt-3 p-5 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-ink">How this demo is calculated</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>168 invented BTC-like trades, generated from a fixed seed so everyone sees the same data.</li>
              <li>Candles use one minute intervals. Open and close are the first and last trade by time, then by trade id.</li>
              <li>
                The profile groups trades into ${DEMO_BAND_USD} bands and the cups into ${DEMO_BUCKET_USD} ranges. A trade
                exactly on a boundary belongs to the higher range. Both always add up to the same total.
              </li>
              <li>
                In this lesson a high volume node is a band with at least 60% of the busiest band, and a low volume node is a
                traded band with 15% or less. These are teaching thresholds, not a trading rule.
              </li>
            </ul>
          </details>
        </section>

        <section id="quiz" aria-labelledby="quiz-title" className="scroll-mt-24">
          <SectionHeading
            id="quiz-title"
            eyebrow="Knowledge check"
            title="Check your understanding"
            description="Three quick questions. Pick an answer to see the explanation."
          />
          <div className="mt-5">
            <LessonQuiz lessonId={LESSON_ID} questions={QUIZ} />
          </div>
        </section>

        <section className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-ink">Was this lesson clear?</h2>
            <p className="mt-1 text-sm text-muted">Tell us what clicked and what did not. It shapes the next lessons.</p>
          </div>
          <Link href="/feedback" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
            Share feedback <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </Container>
    </>
  );
}

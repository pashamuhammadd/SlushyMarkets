import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { MovingAverageLesson } from "@/components/lessons/MovingAverageLesson";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { MA_DEMO_CANDLES } from "@/data/ma-demo";
import { LESSON_ID, MA_CHAPTERS, MA_QUIZ } from "@/data/lessons/sma-vs-ema";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "SMA vs EMA: Moving Averages Explained Visually",
  description:
    "Interactive lesson: watch a simple and an exponential moving average form candle by candle, see why the EMA reacts faster and test yourself with a quiz.",
  path: "/learn/sma-vs-ema",
});

const ideas = [
  {
    title: "SMA = equal weights",
    body: "Add the last N closes and divide by N. Every close in the window counts the same, and a close that leaves the window stops counting at once.",
    formula: "SMA = (C1 + C2 + ... + CN) / N",
  },
  {
    title: "EMA = recent closes weigh more",
    body: "Each new EMA moves part of the way toward the latest close. The newest close gets the share alpha, and older closes fade step by step.",
    formula: "EMA = alpha x Close + (1 - alpha) x EMA before, alpha = 2 / (N + 1)",
  },
  {
    title: "Speed versus smoothness",
    body: "A faster average reacts sooner to real turns but also to noise. A slower one is calmer but lags. Neither predicts price. Both summarize what already happened.",
    formula: "Shorter period or EMA: faster. Longer period or SMA: smoother.",
  },
];

export default function SmaVsEmaPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "SMA vs EMA",
          description: metadata.description as string,
          path: "/learn/sma-vs-ema",
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "SMA vs EMA", path: "/learn/sma-vs-ema" },
          ],
          teaches: ["Simple moving average", "Exponential moving average", "Smoothing factor", "Lag"],
          minutes: 7,
          resourceType: "Interactive lesson",
        })}
      />
      <PageHeader
        eyebrow="Lesson 2"
        title="SMA vs EMA"
        description="Two moving averages, the same closing prices. Watch both lines form candle by candle and see why one reacts faster."
        pose="thinking"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="cyan">
            <GraduationCap aria-hidden="true" className="size-3.5" />
            Beginner
          </Badge>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" /> About 7 minutes
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {MA_CHAPTERS.length} steps and a {MA_QUIZ.length} question check
          </span>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <section aria-label="Interactive lesson">
          <MovingAverageLesson />
        </section>

        <section aria-labelledby="ma-ideas-title">
          <SectionHeading id="ma-ideas-title" icon={<BookOpen className="size-5" />} title="Key ideas" />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <li key={idea.title} className="panel p-5">
                <h3 className="text-lg font-semibold text-ink">{idea.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{idea.body}</p>
                <p className="mt-3 rounded-lg bg-navy-950/60 px-3 py-2 font-mono text-xs text-cyan-soft ring-1 ring-white/5">{idea.formula}</p>
              </li>
            ))}
          </ul>
          <details className="panel mt-3 p-5 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-ink">How this demo is calculated</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                {MA_DEMO_CANDLES.length} invented BTC-like hourly candles, generated from a fixed seed so everyone sees the same data. Each
                candle opens at the previous close.
              </li>
              <li>Both averages use closing prices. Periods of 5, 10 and 20 candles are available; 10 is the default.</li>
              <li>
                The EMA starts from the SMA of the first N closes, a common convention, then applies alpha = 2 / (N + 1) on every new
                candle. Other tools may start the EMA differently, so early values can differ slightly.
              </li>
              <li>
                The weights panel unrolls the EMA formula to show each close&apos;s share. The shares always add up to 100% and reproduce
                the line exactly; this is checked by automated tests.
              </li>
              <li>
                A turn is the first candle after the price peak where a line is lower than one candle before. A direction change is any
                switch between rising and falling. These are teaching measures, not trading rules.
              </li>
            </ul>
          </details>
          <GlossaryLink section="moving-averages" />
        </section>

        <section id="quiz" aria-labelledby="ma-quiz-title" className="scroll-mt-24">
          <SectionHeading
            id="ma-quiz-title"
            eyebrow="Knowledge check"
            title="Check your understanding"
            description={`${MA_QUIZ.length} quick questions. Pick an answer to see the explanation.`}
          />
          <div className="mt-5">
            <LessonQuiz lessonId={LESSON_ID} questions={MA_QUIZ} />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Next lesson: Renko Bricks</h2>
              <p className="mt-1 text-sm text-muted">A chart that ignores time and only draws a brick when price moves a full box.</p>
            </div>
            <Link href="/learn/renko-bricks" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              Start lesson 3 <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">New to candles?</h2>
              <p className="mt-1 text-sm text-muted">See how every candle is built from individual trades in the first lesson.</p>
            </div>
            <Link
              href="/learn/candlesticks-and-volume"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline"
            >
              Candlesticks and Volume <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Was this lesson clear?</h2>
              <p className="mt-1 text-sm text-muted">Tell us what clicked and what did not. It shapes the next lessons.</p>
            </div>
            <Link href="/feedback" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              Share feedback <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        </div>
      </Container>
    </>
  );
}

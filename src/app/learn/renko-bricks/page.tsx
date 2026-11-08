import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { RenkoLesson } from "@/components/lessons/RenkoLesson";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { RENKO_BOX_SIZES, RENKO_DEFAULT_BOX, RENKO_DEMO_CANDLES } from "@/data/renko-demo";
import { LESSON_ID, RENKO_COMPLETION, RENKO_CHAPTERS, RENKO_QUIZ } from "@/data/lessons/renko-bricks";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Renko Bricks: How Renko Charts Work",
  description:
    "Interactive lesson: build Renko bricks next to a candle chart from simulated prices, and see why time disappears, how reversals work and what box size does.",
  path: "/learn/renko-bricks",
});

const ideas = [
  {
    title: "One brick per full box",
    body: "Pick a box size. A new brick appears only when the close moves one full box beyond the last brick. Smaller moves draw nothing, bigger moves can draw several bricks at once.",
    formula: "Next up brick: close >= top + box",
  },
  {
    title: "Reversals need two boxes",
    body: "To turn from up bricks to down bricks, the close must fall two boxes below the top of the last up brick. The same rule applies in the other direction.",
    formula: "First down brick: close <= top - 2 x box",
  },
  {
    title: "Time is left out",
    body: "Renko shows how far price moved, not how long it took. Quiet hours vanish and fast moves stack up. Read it next to a time based chart when timing matters.",
    formula: "Bottom axis = brick number, not hours",
  },
];

export default function RenkoBricksPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Renko Bricks",
          description: metadata.description as string,
          path: "/learn/renko-bricks",
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "Renko Bricks", path: "/learn/renko-bricks" },
          ],
          teaches: ["Renko charts", "Box size", "Renko reversal", "Price based charts"],
          minutes: 7,
          resourceType: "Interactive lesson",
        })}
      />
      <PageHeader
        eyebrow="Lesson 3"
        title="Renko Bricks"
        description="A chart made of equal bricks that only cares how far price moved. Build it step by step next to a normal candle chart."
        pose="trading"
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
            {RENKO_CHAPTERS.length} steps and a {RENKO_QUIZ.length} question check
          </span>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <section aria-label="Interactive lesson">
          <RenkoLesson />
        </section>

        <section aria-labelledby="renko-ideas-title">
          <SectionHeading id="renko-ideas-title" icon={<BookOpen className="size-5" />} title="Key ideas" />
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
                {RENKO_DEMO_CANDLES.length} invented BTC-like hourly candles, generated from a fixed seed so everyone sees the same data.
              </li>
              <li>
                Bricks use closing prices only (classic close based Renko). Box sizes of {RENKO_BOX_SIZES.map((b) => `$${b}`).join(", ")} are
                available; ${RENKO_DEFAULT_BOX} is the default.
              </li>
              <li>The brick grid starts at the first close rounded down to a multiple of the box size.</li>
              <li>
                A reversal needs a two box move, and the first opposite brick starts at the far side of the last brick. Some tools use
                highs and lows, an ATR based box size or different reversal rules, so their bricks can differ.
              </li>
              <li>A direction change is any switch between up and down bricks. It is a teaching measure, not a trading rule.</li>
            </ul>
          </details>
          <GlossaryLink section="renko" />
        </section>

        <section id="quiz" aria-labelledby="renko-quiz-title" className="scroll-mt-24">
          <SectionHeading
            id="renko-quiz-title"
            eyebrow="Knowledge check"
            title="Check your understanding"
            description={`${RENKO_QUIZ.length} quick questions. Pick an answer to see the explanation.`}
          />
          <div className="mt-5">
            <LessonQuiz lessonId={LESSON_ID} questions={RENKO_QUIZ} completionMessage={RENKO_COMPLETION} />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Compare with moving averages</h2>
              <p className="mt-1 text-sm text-muted">Another way to smooth noise: see how SMA and EMA react to the same kind of moves.</p>
            </div>
            <Link href="/learn/sma-vs-ema" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              SMA vs EMA <ArrowRight aria-hidden="true" className="size-4" />
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

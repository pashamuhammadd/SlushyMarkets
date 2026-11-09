import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Coins, GraduationCap, LineChart, PaintBucket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { SoprBucketGame } from "@/components/onchain/SoprBucketGame";
import { SoprExplorer } from "@/components/onchain/SoprExplorer";
import { SoprTimeline } from "@/components/onchain/SoprTimeline";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { SOPR_COMPLETION, SOPR_LESSON_ID, SOPR_QUIZ, SPEND_IS_NOT_A_SALE } from "@/data/lessons/on-chain-metrics";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/learn/on-chain-metrics/sopr";

export const metadata: Metadata = pageMetadata({
  title: "SOPR Explained: Spent Output Profit Ratio for Beginners",
  description:
    "Interactive SOPR lesson: compare a coin's value when created and when spent, see why 1.0 is the break even line, hear a chime when SOPR crosses it and test yourself.",
  path: PATH,
});

const ideas = [
  {
    title: "Only moved coins count",
    body: "SOPR looks at outputs spent in a period. A coin that stays in its wallet is not part of the calculation.",
    formula: "SOPR = value when spent / value when created",
  },
  {
    title: "1.0 is break even",
    body: "Above 1.0 the moved coins were worth more when spent than when created. Below 1.0 they were worth less.",
    formula: "1.875 = $75,000 / $40,000",
  },
  {
    title: "Add first, then divide",
    body: "For many outputs, add all values when spent and all values when created, then divide once. Large outputs weigh more.",
    formula: "($400 + $400) / ($200 + $500) = 1.14",
  },
];

export default function SoprLessonPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "SOPR: Spent Output Profit Ratio",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "On-Chain Metrics", path: "/learn/on-chain-metrics" },
            { name: "SOPR", path: PATH },
          ],
          teaches: ["Spent Output Profit Ratio", "Break even at 1.0", "Why a blockchain spend is not always a sale"],
          minutes: 6,
          resourceType: "Interactive lesson",
        })}
      />
      <PageHeader
        eyebrow="On-Chain Metrics · Lesson 1"
        title="SOPR: was the coin worth more when it moved?"
        description="Spent Output Profit Ratio compares what moved coins were worth when they were created with what they were worth when they were spent."
        pose="thinking"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="cyan">
            <GraduationCap aria-hidden="true" className="size-3.5" />
            Beginner
          </Badge>
          <Badge tone="violet">Simulated examples</Badge>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" /> About 6 minutes
          </span>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <aside aria-labelledby="sopr-spend-title" className="panel border border-cyan/30 p-5 sm:p-6">
          <h2 id="sopr-spend-title" className="text-xl font-semibold text-ink">
            First, what a &quot;spend&quot; means
          </h2>
          <p className="mt-2 font-semibold text-cyan-soft">{SPEND_IS_NOT_A_SALE}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>Bitcoin that moves on chain was not always sold.</li>
            <li>A transfer between two wallets owned by the same person is recorded too.</li>
            <li>SOPR is built from Bitcoin outputs that were spent on the blockchain. In this lesson, &quot;spent&quot; always means &quot;moved on chain&quot;.</li>
            <li>A move alone does not prove a sale. The chain shows that coins moved, not why.</li>
          </ul>
        </aside>

        <section aria-labelledby="sopr-coin-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="sopr-coin-title"
            icon={<Coins className="size-5" />}
            title="1. One coin moves"
            description="Coin A's output was created when BTC was $40,000. Today it moves while BTC is $75,000. Coin B stays put, so it is not part of today's SOPR. Drag the prices to explore."
          />
          <div className="mt-6">
            <SoprExplorer />
          </div>
        </section>

        <section aria-labelledby="sopr-buckets-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="sopr-buckets-title"
            icon={<PaintBucket className="size-5" />}
            title="2. Which move outweighs the other?"
            description="Two outputs are spent together. One may gain and one may lose. Guess whether their combined value went up, down or stayed the same. Turn on Listen first to answer by ear."
          />
          <div className="mt-6">
            <SoprBucketGame />
          </div>
        </section>

        <section aria-labelledby="sopr-timeline-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="sopr-timeline-title"
            icon={<LineChart className="size-5" />}
            title="3. SOPR over time"
            description="Each day, all spent outputs give one SOPR value. Play this invented line and switch on the chimes to hear every cross of 1.0."
          />
          <div className="mt-6">
            <SoprTimeline />
          </div>
        </section>

        <section aria-labelledby="sopr-ideas-title">
          <SectionHeading id="sopr-ideas-title" icon={<BookOpen className="size-5" />} title="Key ideas" />
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
            <summary className="cursor-pointer font-semibold text-ink">Limits of SOPR</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>{SPEND_IS_NOT_A_SALE} Some providers try to filter these moves, but no filter is perfect.</li>
              <li>Exchanges move coins internally, which can blur the picture. Providers use different filters, so SOPR values differ between sites.</li>
              <li>SOPR describes coins that already moved. It does not say whether price will rise or fall next.</li>
              <li>The timeline above is invented with a fixed seed so everyone sees the same line. It is not real Bitcoin data.</li>
            </ul>
          </details>
          <GlossaryLink section="on-chain" />
        </section>

        <section id="quiz" aria-labelledby="sopr-quiz-title" className="scroll-mt-24">
          <SectionHeading
            id="sopr-quiz-title"
            eyebrow="Knowledge check"
            title="Check your understanding"
            description={`${SOPR_QUIZ.length} quick questions. Pick an answer to see the explanation.`}
          />
          <div className="mt-5">
            <LessonQuiz lessonId={SOPR_LESSON_ID} questions={SOPR_QUIZ} completionMessage={SOPR_COMPLETION} />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Next: MVRV</h2>
              <p className="mt-1 text-sm text-muted">Compare every coin at today&apos;s price with every coin at the price it last moved.</p>
            </div>
            <Link href="/learn/on-chain-metrics/mvrv" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              Start the MVRV lesson <ArrowRight aria-hidden="true" className="size-4" />
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

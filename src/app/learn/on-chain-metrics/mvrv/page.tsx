import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap, Scale } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { MvrvExplorer } from "@/components/onchain/MvrvExplorer";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { LAST_MOVED_IS_NOT_PAID, MVRV_COMPLETION, MVRV_LESSON_ID, MVRV_QUIZ } from "@/data/lessons/on-chain-metrics";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/learn/on-chain-metrics/mvrv";

export const metadata: Metadata = pageMetadata({
  title: "MVRV Explained: Market Value vs Realized Value",
  description:
    "Interactive MVRV lesson with two buckets: market value at today's price and realized value at each coin's last moved price. See what changes each one and learn the limits.",
  path: PATH,
});

const ideas = [
  {
    title: "Market value: today's price",
    body: "Every coin priced at the current BTC price. It changes whenever the price changes.",
    formula: "Market value = coins x today's price",
  },
  {
    title: "Realized value: last moved price",
    body: "Every coin priced at the BTC price when it last moved on chain. That is a valuation method, not a record of what owners paid. It only changes when coins move.",
    formula: "Realized value = sum of (coin x last moved price)",
  },
  {
    title: "MVRV compares the two",
    body: "Above 1, coins are worth more today than when they last moved, on the whole. Below 1, they are worth less.",
    formula: "MVRV = market value / realized value",
  },
];

export default function MvrvLessonPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "MVRV: Market Value to Realized Value",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "On-Chain Metrics", path: "/learn/on-chain-metrics" },
            { name: "MVRV", path: PATH },
          ],
          teaches: ["Market value", "Realized value", "MVRV ratio"],
          minutes: 6,
          resourceType: "Interactive lesson",
        })}
      />
      <PageHeader
        eyebrow="On-Chain Metrics · Lesson 2"
        title="MVRV: two buckets, two prices"
        description="Market value prices every coin at today's price. Realized value prices each coin at the moment it last moved. MVRV is one divided by the other."
        pose="twoBuckets"
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
        <section aria-labelledby="mvrv-play-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="mvrv-play-title"
            icon={<Scale className="size-5" />}
            title="What are both coins worth?"
            description="Start just before Coin A moves, with BTC at $50,000. Coin A last moved at $40,000 and Coin B at $60,000, so both buckets hold $100,000 and MVRV is 1.00."
          />
          <div className="mt-6">
            <MvrvExplorer />
          </div>
        </section>

        <aside aria-labelledby="mvrv-realized-title" className="panel border border-magenta/30 p-5 sm:p-6">
          <h2 id="mvrv-realized-title" className="text-xl font-semibold text-ink">
            What the pink bucket really measures
          </h2>
          <p className="mt-2 font-semibold text-cyan-soft">{LAST_MOVED_IS_NOT_PAID}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>Market value and realized value are two different ways to price the same coins.</li>
            <li>Realized value is a method: it prices each coin at its last on-chain move.</li>
            <li>If someone buys at one price and later moves the coin to a new wallet at another price, realized value uses the later one.</li>
          </ul>
        </aside>

        <section aria-labelledby="mvrv-ideas-title">
          <SectionHeading id="mvrv-ideas-title" icon={<BookOpen className="size-5" />} title="Key ideas" />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <li key={idea.title} className="panel p-5">
                <h3 className="text-lg font-semibold text-ink">{idea.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{idea.body}</p>
                <p className="mt-3 rounded-lg bg-navy-950/60 px-3 py-2 font-mono text-xs text-cyan-soft ring-1 ring-white/5">{idea.formula}</p>
              </li>
            ))}
          </ul>
          <details className="panel mt-3 p-5 text-sm text-muted" open>
            <summary className="cursor-pointer font-semibold text-ink">Limits of MVRV</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Lost coins never move again, so they keep an old realized price forever and can stretch the ratio.</li>
              <li>Coins held by exchanges or custodians move for operational reasons, which also shifts realized value.</li>
              <li>Levels that looked important in past cycles are history, not rules. There is no fixed MVRV number that marks a top or a bottom.</li>
              <li>MVRV says nothing about timing. It describes the market, it does not predict it.</li>
              <li>The two coin world here is invented to explain the math. Real MVRV uses every coin on the network.</li>
            </ul>
          </details>
          <GlossaryLink section="on-chain" />
        </section>

        <section id="quiz" aria-labelledby="mvrv-quiz-title" className="scroll-mt-24">
          <SectionHeading
            id="mvrv-quiz-title"
            eyebrow="Knowledge check"
            title="Check your understanding"
            description={`${MVRV_QUIZ.length} quick questions. Pick an answer to see the explanation.`}
          />
          <div className="mt-5">
            <LessonQuiz lessonId={MVRV_LESSON_ID} questions={MVRV_QUIZ} completionMessage={MVRV_COMPLETION} />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Missed the first lesson?</h2>
              <p className="mt-1 text-sm text-muted">SOPR looks only at coins that moved, and when they crossed break even.</p>
            </div>
            <Link href="/learn/on-chain-metrics/sopr" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              SOPR lesson <ArrowRight aria-hidden="true" className="size-4" />
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

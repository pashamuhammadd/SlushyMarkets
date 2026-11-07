import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Blocks, Clock, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/site";
import { breadcrumbGraph } from "@/lib/structured-data";

const PATH = "/learn/on-chain-metrics";

export const metadata: Metadata = pageMetadata({
  title: "On-Chain Metrics for Beginners: SOPR and MVRV",
  description:
    "Learn what on-chain metrics measure with a simple two coin Bitcoin story. Interactive lessons on SOPR and MVRV with buckets, sliders and sound cues. Simulated examples only.",
  path: PATH,
});

const lessons = [
  {
    href: "/learn/on-chain-metrics/sopr" as const,
    title: "SOPR: Spent Output Profit Ratio",
    body: "Compare what moved coins were worth when they were created with what they were worth when spent. Hear a chime when the ratio crosses 1.0.",
    minutes: 6,
  },
  {
    href: "/learn/on-chain-metrics/mvrv" as const,
    title: "MVRV: Market Value to Realized Value",
    body: "Two buckets, one for today's price and one for the price each coin last moved at. See which bucket reacts when price changes and when coins move.",
    minutes: 6,
  },
];

export default function OnChainMetricsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbGraph([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: "On-Chain Metrics", path: PATH },
        ])}
      />
      <PageHeader
        eyebrow="Learn · On-Chain Metrics"
        title="On-chain metrics, one coin story at a time"
        description="A blockchain records every time coins move. On-chain metrics turn those records into numbers. Start with two of the most common ones, using a tiny Bitcoin world of just two coins."
        pose="thinking"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="cyan">Beginner</Badge>
          <Badge tone="violet">Simulated examples</Badge>
          <Badge tone="neutral">Not financial advice</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <section aria-labelledby="idea-title" className="panel p-5 sm:p-6">
          <SectionHeading
            id="idea-title"
            icon={<Blocks className="size-5" />}
            title="The one idea behind both metrics"
            description="Bitcoin is stored as outputs. When an output is spent, the chain shows when it was created and when it moved again. Pair that with the BTC price at each moment and you can ask: what was this coin worth then, and what is it worth now?"
          />
          <ul className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">Our tiny world.</span> Coin A last moved when BTC was $40,000. Coin B
              last moved at $60,000. Each is 1 BTC.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">SOPR looks at coins that move.</span> Only the coins spent in a period
              count.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">MVRV looks at every coin.</span> It compares all coins at today&apos;s
              price with all coins at their last moved price.
            </li>
          </ul>
        </section>

        <section aria-labelledby="onchain-lessons-title">
          <SectionHeading id="onchain-lessons-title" title="Lessons" />
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {lessons.map((lesson) => (
              <li key={lesson.href} className="panel flex flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-ink">{lesson.title}</h3>
                  <Badge tone="success">Available now</Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted">{lesson.body}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="flex items-center gap-1.5 text-xs text-subtle">
                    <Clock aria-hidden="true" className="size-3.5" /> About {lesson.minutes} minutes
                  </span>
                  <Link href={lesson.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
                    Start lesson <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="advanced-title" className="panel p-5 sm:p-6">
          <SectionHeading
            id="advanced-title"
            icon={<FlaskConical className="size-5" />}
            title="Advanced On-Chain Metrics"
            description="Later, this section will introduce metrics from Slushy's own research. They are still being defined, so nothing is published here yet."
          />
          <Badge tone="neutral" className="mt-4">
            Planned
          </Badge>
        </section>

        <section className="panel p-5 text-sm text-muted sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Read this before using any on-chain metric</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>The examples here are invented to explain the math. They are not live Bitcoin data.</li>
            <li>Real providers estimate these numbers with their own methods, so values can differ between sites.</li>
            <li>On-chain metrics describe what coins did. They do not tell you what price will do next.</li>
          </ul>
          <GlossaryLink section="on-chain" />
        </section>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DailyExperiment } from "@/components/experiments/DailyExperiment";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { isDailyExperimentEnabled } from "@/lib/experiments/availability";

export const metadata: Metadata = {
  title: "Daily Mystery Markets",
  description: "Three one-minute mystery charts with musical market signals or chart only. An educational paper trading experiment with virtual money.",
  robots: { index: false, follow: false },
};

export default function DailyExperimentPage() {
  if (!isDailyExperimentEnabled()) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Daily experiment"
        title="Find your sound. Practice your decisions."
        description="Three mystery charts, one minute each. Pick a sound profile or Chart Only, trade with virtual money, then see which market it was."
        pose="headphones"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="cyan">Historical daily candles</Badge>
          <Badge tone="violet">Virtual money only</Badge>
          <Badge tone="magenta">Educational experiment</Badge>
        </div>
      </PageHeader>
      <Container>
        <DailyExperiment />
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BtcExperiment } from "@/components/experiments/BtcExperiment";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { BTC_USD_DAILY } from "@/data/experiments/btc-usd-daily";
import { isBtcExperimentEnabled } from "@/lib/experiments/availability";

export const metadata: Metadata = {
  title: "Watch 2024. Trade 2025.",
  description: "An educational BTC/USD paper trading and sound experiment using virtual money.",
  robots: { index: false, follow: false },
};

export default function BtcExperimentPage() {
  if (!isBtcExperimentEnabled()) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Original BTC experiment"
        title="Watch 2024. Trade 2025."
        description="First watch the 2024 replay, then trade each next daily candle of 2025 while you hear compression and release."
        pose="drums"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="cyan">Historical BTC/USD</Badge>
          <Badge tone="violet">Virtual money only</Badge>
          <Badge tone="magenta">Educational experiment</Badge>
        </div>
      </PageHeader>
      <Container>
        <BtcExperiment candles={BTC_USD_DAILY} />
      </Container>
    </>
  );
}

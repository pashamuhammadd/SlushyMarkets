import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BrandImage, Mascot } from "@/components/brand/Mascot";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { games } from "@/data/games";
import { pageMetadata } from "@/lib/site";
import { breadcrumbGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Educational Trading Games with Simulated Data",
  description:
    "Short games that practice what the lessons teach, like building a candle from raw trades. Simulated data only: no real money, no wallet and no sign up.",
  path: "/games",
});

export default function GamesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbGraph([
          { name: "Home", path: "/" },
          { name: "Games", path: "/games" },
        ])}
      />
      <PageHeader
        eyebrow="Games"
        title="Practice games"
        description="Quick games that turn each lesson into practice. Play as often as you like; your best score stays on this device."
        pose="gameController"
      />
      <Container className="space-y-8">
        <ul className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <li key={game.slug} className="group panel card-tilt reveal-zoom relative flex flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <BrandImage name="icon-games" sizes="32px" className="icon-wobble size-8" />
                <h2 className="text-xl font-semibold text-ink">{game.title}</h2>
                <Badge tone={game.status === "available" ? "success" : "neutral"}>
                  {game.status === "available" ? "Play now" : "Planned"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{game.summary}</p>
              <p className="mt-1 text-xs text-subtle">Practices: {game.practices}</p>
              <div className="mt-auto pt-5">
                {game.href ? (
                  <Link href={game.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
                    Play {game.title} <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm text-subtle">Not available yet</span>
                    <Mascot pose="comingSoon" decorative still sizes="56px" className="-mb-2 w-12" />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <section aria-labelledby="games-rules-title" className="panel p-5 sm:p-6">
          <h2 id="games-rules-title" className="flex items-center gap-2 text-lg font-semibold text-ink">
            <ShieldCheck aria-hidden="true" className="size-5 text-success" /> Education only
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>All prices and trades are simulated for teaching. They are not live market data.</li>
            <li>There is no real money, no wallet connection and no blockchain transaction.</li>
            <li>Scores are for practice and are saved only in this browser. There are no prizes.</li>
            <li>Nothing here is financial advice or a trading signal.</li>
          </ul>
        </section>
      </Container>
    </>
  );
}

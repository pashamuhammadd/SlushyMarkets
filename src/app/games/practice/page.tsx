import type { Metadata } from "next";
import { PracticeGame } from "@/components/games/PracticeGame";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/games/practice";

export const metadata: Metadata = pageMetadata({
  title: "Practice Mode: Three Simulated Charts, One Minute Each",
  description:
    "A free virtual trading simulation. Go long or short on three simulated charts for one minute each, with sound or in silence, then review P&L, drawdown and costs. No real money.",
  path: PATH,
});

export default function PracticePage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Practice Mode",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Games", path: "/games" },
            { name: "Practice Mode", path: PATH },
          ],
          teaches: ["Long and short positions", "Trading costs", "Drawdown"],
          minutes: 4,
          resourceType: "Educational game",
        })}
      />
      <PageHeader
        eyebrow="Practice Mode"
        title="Three Charts. One Minute Each. Find Your Sound."
        description="Trade three simulated charts with virtual money. Try them with sound, try them in silence, and see what changes for you."
        pose="stopwatch"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="cyan">Virtual money only</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
        </div>
      </PageHeader>
      <Container>
        <PracticeGame />
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { Headphones, Piano, VolumeX } from "lucide-react";
import { TrendTiles } from "@/components/audio/TrendTiles";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";

export const metadata: Metadata = {
  title: "Audio Lab",
  description:
    "Three Trends, One Piano: an experiment that turns daily, 4 hour and 15 minute trends into music. Prototype in development.",
};

const plan = [
  {
    icon: Piano,
    title: "Three registers, one piano",
    body: "Daily in a low register, 4 hour in the middle and 15 minute up high, so each timeframe has its own voice.",
  },
  {
    icon: Headphones,
    title: "Listen and identify",
    body: "Solo each timeframe or hear all three together, then try a short exercise: which trend just turned?",
  },
  {
    icon: VolumeX,
    title: "You stay in control",
    body: "No autoplay. Sound starts only when you press Play, with mute, volume and stop always in reach.",
  },
];

export default function AudioLabPage() {
  return (
    <>
      <PageHeader
        eyebrow="Audio Lab"
        title="Three Trends, One Piano"
        description="Hear market structure. Each timeframe plays in its own piano register, so you can notice when trends agree and when they clash."
        pose="excited"
      />
      <Container className="space-y-8">
        <StatusNotice title="The playable prototype is in development">
          <p>
            No sound plays on this page yet. The first version will use original synthetic tones and clearly labeled demo
            data, never live market signals.
          </p>
          <p>
            The exact way trends become notes is a provisional concept until Slushy approves the final mapping.
          </p>
        </StatusNotice>

        <section aria-labelledby="concept-title" className="panel p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="concept-title" className="text-xl font-semibold text-ink">
              The concept at a glance
            </h2>
            <Badge tone="violet">Illustrative lines, not market data</Badge>
          </div>
          <TrendTiles />
        </section>

        <section aria-labelledby="plan-title">
          <h2 id="plan-title" className="text-2xl font-semibold text-ink">
            What the prototype will let you do
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {plan.map(({ icon: Icon, title, body }) => (
              <li key={title} className="panel p-5">
                <Icon aria-hidden="true" className="size-6 text-magenta" />
                <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/explore">Try the visual demo</ButtonLink>
          <ButtonLink href="/feedback" variant="secondary">
            Suggest a sound idea
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

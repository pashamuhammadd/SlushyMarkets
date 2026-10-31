import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { Mascot, type MascotPose } from "@/components/brand/Mascot";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";

type Stage = {
  step: number;
  title: string;
  body: string;
  status: string;
  tone: BadgeTone;
  pose: MascotPose;
  accent: string;
};

/** Roadmap concept only. There are no accounts, points or unlockable levels in the MVP. */
const stages: Stage[] = [
  {
    step: 1,
    title: "Foundations",
    body: "Candles, traded volume and volume by price.",
    status: "First lesson available",
    tone: "success",
    pose: "happy",
    accent: "from-cyan/30",
  },
  {
    step: 2,
    title: "Indicators",
    body: "Moving averages, starting with SMA vs EMA.",
    status: "Planned",
    tone: "neutral",
    pose: "thinking",
    accent: "from-electric/30",
  },
  {
    step: 3,
    title: "Timeframes and sound",
    body: "How daily, 4 hour and 15 minute trends relate.",
    status: "Exploring",
    tone: "violet",
    pose: "cool",
    accent: "from-violet/30",
  },
  {
    step: 4,
    title: "Putting it together",
    body: "Read a full chart story with every tool you learned.",
    status: "Future idea",
    tone: "neutral",
    pose: "laughing",
    accent: "from-magenta/30",
  },
];

export function LearningPath() {
  return (
    <section aria-labelledby="path-title">
      <Container>
        <div className="panel p-4 sm:p-6 lg:p-8">
          <SectionHeading
            id="path-title"
            icon={<Layers className="size-5" />}
            title="Your learning path"
            description="From first candle to full chart stories. This is a roadmap concept, so stages open as lessons are finished."
            action={
              <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
                View all lessons <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            }
          />
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stages.map((stage) => (
              <li
                key={stage.step}
                className={`relative overflow-hidden rounded-2xl bg-linear-to-b ${stage.accent} to-navy-950/60 p-4 ring-1 ring-white/10`}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-navy-950/70 text-sm font-bold text-ink ring-1 ring-white/15">
                    {stage.step}
                  </span>
                  <h3 className="text-base font-semibold text-ink">{stage.title}</h3>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <Mascot pose={stage.pose} decorative sizes="64px" className="w-16 shrink-0" />
                  <p className="text-sm text-muted">{stage.body}</p>
                </div>
                <Badge tone={stage.tone} className="mt-4">
                  {stage.status}
                </Badge>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-subtle">
            No accounts, points or levels yet. When lessons launch, any completion marks will be stored only on your device.
          </p>
        </div>
      </Container>
    </section>
  );
}

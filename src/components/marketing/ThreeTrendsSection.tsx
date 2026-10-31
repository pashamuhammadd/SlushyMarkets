import { ArrowRight, Music, Info } from "lucide-react";
import { TrendTiles } from "@/components/audio/TrendTiles";
import { Mascot } from "@/components/brand/Mascot";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { SpeechBubble } from "./SpeechBubble";

export function ThreeTrendsSection() {
  return (
    <section aria-labelledby="three-trends-title">
      <Container>
        <div className="panel relative overflow-hidden p-4 sm:p-6 lg:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-magenta/15 blur-3xl"
          />
          <SectionHeading
            id="three-trends-title"
            icon={<Music className="size-5" />}
            title="Three Trends, One Piano"
            description="Turn market structure into music. Each timeframe plays in its own piano register, so you can hear when trends agree or clash."
            action={<Badge tone="violet">Provisional sound concept</Badge>}
          />

          <div className="mt-6 grid items-center gap-6 lg:grid-cols-[220px_1fr]">
            <div className="flex items-end justify-center gap-2 lg:flex-col lg:items-center">
              <SpeechBubble className="max-w-44">Markets sound better together!</SpeechBubble>
              <Mascot pose="excited" sizes="140px" className="w-28 lg:w-36" />
            </div>

            <div className="space-y-4">
              <TrendTiles />
              <div className="flex flex-col gap-4 rounded-2xl bg-navy-950/40 p-4 ring-1 ring-white/5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex gap-2.5 text-sm text-muted">
                  <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-violet-soft" />
                  <span>
                    Synthetic trend lines, not market data. The Audio Lab prototype plays them with original piano-like tones.
                    Sound only starts when you press Play.
                  </span>
                </p>
                <ButtonLink href="/audio-lab" variant="secondary" size="sm" className="self-start sm:self-auto">
                  Try the prototype
                  <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

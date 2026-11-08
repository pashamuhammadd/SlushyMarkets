import type { Metadata } from "next";
import { Headphones, Info, SlidersHorizontal } from "lucide-react";
import { PlaygroundModeNav, PlaygroundModesList } from "@/components/audio/playground/PlaygroundModes";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import {
  BAND_ATR_MULTIPLIER,
  BAND_ATR_PERIOD,
  BAND_COLORS,
  BAND_EMA_PERIOD,
  OUTSIDE_LOUDNESS,
} from "@/lib/sonification/modes/sonar-bands";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/sonar-bands";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Sonar Bands",
  description:
    "Hear price move inside a channel around a moving average: organ tones for each band, chimes for breakouts and knocks for closes back inside. Simulated data, experimental sound mapping.",
  path: PATH,
});

const mapping = [
  { what: "Lower band", color: BAND_COLORS.lower, sound: "Deep organ, 165 Hz", when: "Every bar while price is within one ATR of the band. Louder when closer, extra loud after a close below it." },
  { what: "Upper band", color: BAND_COLORS.upper, sound: "Higher organ, 330 Hz", when: "Every bar while price is within one ATR of the band. Louder when closer, extra loud after a close above it." },
  { what: "Breakout", color: BAND_COLORS.breakout, sound: "Chime pair", when: "A close outside the channel. Rising pair above, falling pair below." },
  { what: "Back inside", color: BAND_COLORS.return, sound: "Soft double knock", when: "The first close back inside after a breakout." },
  { what: "Midline (optional)", color: BAND_COLORS.midline, sound: "Tuned wood note", when: "Every bar when switched on. Pitch rises and falls with the midline." },
];

export default function SonarBandsPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Sonar Bands",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "Sonar Bands", path: PATH },
          ],
          teaches: ["Price channels", "Breakouts and returns", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Sonar Bands"
        description="A channel follows the market: a midline with one band above and one below. Each band has its own organ that swells as price comes near. Chimes tell you when price breaks out, knocks tell you when it comes back."
        pose="thinking"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="sonar-bands" />

        <StatusNotice title="Experiment in progress">
          <p>
            This mode is based on Slushy&apos;s Sonar Bands prototype (version 1.1). The channel width, pitches and loudness
            rules are provisional and may change after more listening tests. Every chart is invented by a seeded random walk,
            not taken from a real market.
          </p>
          <p>
            Sound only starts when you press Play. A breakout here only means a close outside this channel. It does not
            predict what price does next.
          </p>
        </StatusNotice>

        <section aria-labelledby="bands-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="bands-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Listen to the channel"
            description="Pick a preset and press Play. Rings on the chart mark breakouts, squares mark closes back inside. Switch Proximity + motion off and replay the same chart to compare."
          />
          <div className="mt-5">
            <SoundPlayground modeId="sonar-bands" />
          </div>
        </section>

        <section aria-labelledby="bands-how-title">
          <SectionHeading
            id="bands-how-title"
            icon={<Info className="size-5" />}
            title="How the channel and the sound work"
            description={`The midline is a ${BAND_EMA_PERIOD} bar EMA. Each band sits ${BAND_ATR_MULTIPLIER} average ranges (ATR over ${BAND_ATR_PERIOD} bars) away from it, so the channel widens when bars get bigger.`}
          />
          <div
            role="region"
            aria-label="Sonar Bands mapping table, scroll sideways on small screens"
            tabIndex={0}
            className="mt-5 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Layer</th>
                  <th scope="col" className="px-4 py-3">Sound</th>
                  <th scope="col" className="px-4 py-3">When it plays</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {mapping.map((row) => (
                  <tr key={row.what}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      <span aria-hidden="true" className="mr-2 inline-block h-1 w-4 rounded-full align-middle" style={{ backgroundColor: row.color }} />
                      {row.what}
                    </th>
                    <td className="px-4 py-3">{row.sound}</td>
                    <td className="px-4 py-3">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Louder means closer.</span> Inside the channel, a band&apos;s organ is
              full when price touches it and silent at one ATR away. The fade is curved, so the last stretch gets loud quickly.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Pairs show direction.</span> With Proximity + motion on, a rising pair
              of notes means price is moving toward that band, a falling pair means it is moving away.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Outside stays loud.</span> After a close beyond a band, its organ plays
              at {Math.round(OUTSIDE_LOUDNESS * 100)}% until price closes back inside, so you can hear how long the breakout lasts.
            </li>
          </ul>
          <GlossaryLink section="timeframes-and-sound" />
        </section>

        <section aria-labelledby="bands-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="bands-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Count the chimes.</span> Choose &quot;Events only&quot; and close your
              eyes. Count rising and falling chimes, then open your eyes and check the rings on the chart.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Hear the squeeze.</span> Choose &quot;Edges only&quot;. When both organs
              play at once, price is close to both bands. What does that tell you about the channel width?
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Motion or not.</span> Play Slushy&apos;s preset with Proximity + motion
              on, then off, on the same chart. Which version helps you guess the next touch?
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the bands sound</ButtonLink>
          <ButtonLink href="/audio-lab/playground" variant="secondary">
            Try EMA Sonar
          </ButtonLink>
          <ButtonLink href="/audio-lab" variant="secondary">
            Back to Audio Lab
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { Headphones, Info, SlidersHorizontal, Waypoints } from "lucide-react";
import { PlaygroundModeNav, PlaygroundModesList } from "@/components/audio/playground/PlaygroundModes";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { WALL_SOUND, wallLoudness } from "@/lib/sonification/modes/two-wall";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/two-wall";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Two-wall Sonar",
  description:
    "Hear where price sits in its range: a low wood tone for the last swing low, a high wood tone for the last swing high, and their balance in between. Simulated data.",
  path: PATH,
});

const positions = [0, 0.25, 0.5, 0.75, 1];
const pct = (v: number) => `${Math.round(v * 100)}%`;

export default function TwoWallPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Two-wall Sonar",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "Two-wall Sonar", path: PATH },
          ],
          teaches: ["Trading ranges", "Swing highs and lows", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Two-wall sonar"
        description="Every range has a floor and a ceiling. Here each one has its own wood tone, and the balance between the two tells you where price sits."
        pose="sonarRadar"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="two-wall" />

        <StatusNotice title="New concept, first version">
          <p>
            Two-wall sonar is one of Slushy&apos;s new sound concepts. The tones and their balance follow his concept video; the
            exact rules are still being refined and may change. Every chart is invented by a seeded random walk.
          </p>
          <p>Sound only starts when you press Play. The walls describe past swings. They do not predict where price will turn.</p>
        </StatusNotice>

        <section aria-labelledby="walls-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="walls-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Hear the range"
            description="The pink line is the high wall, the mint line the low wall. Start with Walls only and listen to which tone is louder."
          />
          <div className="mt-5">
            <SoundPlayground modeId="two-wall" />
          </div>
        </section>

        <section aria-labelledby="walls-what-title">
          <SectionHeading
            id="walls-what-title"
            icon={<Waypoints className="size-5" />}
            title="Where the walls come from"
            description="The walls are the most recent confirmed swing low and swing high, found with the same rule as the Fractals mode."
          />
          <p className="mt-4 max-w-3xl text-sm text-muted">
            A swing is confirmed two bars after it forms, so a wall only moves when that confirmation arrives. Between moves the
            walls stay flat. When price closes beyond a wall, a chime rings; later a new swing usually forms and that wall jumps to
            its level.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            The same two tones could follow other levels too, such as support and resistance or the point of control from the
            Candlesticks and Volume lesson. Those are ideas for later versions.
          </p>
        </section>

        <section aria-labelledby="walls-how-title">
          <SectionHeading
            id="walls-how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description={`A low tone of about ${WALL_SOUND.lowHz} Hz opens each bar, a high tone of about ${WALL_SOUND.highHz} Hz follows ${WALL_SOUND.highOffsetSec} seconds later.`}
          />
          <div
            role="region"
            aria-label="Loudness by range position, scroll sideways on small screens"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Range position</th>
                  <th scope="col" className="px-4 py-3">Low tone</th>
                  <th scope="col" className="px-4 py-3">High tone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {positions.map((p) => (
                  <tr key={p}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      {pct(p)}
                      {p === 0 ? " (at the low wall)" : p === 1 ? " (at the high wall)" : ""}
                    </th>
                    <td className="px-4 py-3 tabular-nums">{pct(wallLoudness("low", p))}</td>
                    <td className="px-4 py-3 tabular-nums">{pct(wallLoudness("high", p))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            The far tone never goes fully silent, so you always hear both walls and can compare them. Beyond a wall the position
            stays at 0% or 100%, and the chime tells you price has left the range.
          </p>
        </section>

        <section aria-labelledby="walls-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="walls-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Guess the position.</span> With &quot;Walls only&quot;, pause now and
              then and guess the range position by ear. Check it in the readout.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. The middle.</span> When do both tones sound equal? Look at where price is
              on the chart at that moment.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Moving walls.</span> Choose &quot;Walls that move&quot;. After a chime,
              how long until a knock tells you a new wall formed?
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the walls sound</ButtonLink>
          <ButtonLink href="/audio-lab/playground/fractals" variant="secondary">
            Try Fractals
          </ButtonLink>
          <ButtonLink href="/audio-lab/playground" variant="secondary">
            Back to the Sound Playground
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { Ear, Info, Music } from "lucide-react";
import { ListenExercise } from "@/components/audio/ListenExercise";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { TrendPiano } from "@/components/audio/TrendPiano";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { STEP_SECONDS, TIMEFRAMES } from "@/lib/audio/trend-scenario";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Audio Lab: Hear Market Trends as Music",
  description:
    "Three Trends, One Piano: hear daily, 4 hour and 15 minute trends as one piece of music. A synthetic learning demo with provisional sound mapping.",
  path: "/audio-lab",
});

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

export default function AudioLabPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Three Trends, One Piano",
          description: metadata.description as string,
          path: "/audio-lab",
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
          ],
          teaches: ["Trend direction", "Multiple timeframes", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab"
        title="Three Trends, One Piano"
        description="Hear market structure. Each timeframe plays in its own piano register, so you can notice when trends agree and when they clash."
        pose="excited"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Synthetic learning demo</Badge>
          <Badge tone="magenta">Provisional sound mapping</Badge>
          <Badge tone="neutral">Not a live signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <StatusNotice title="Prototype: the sound mapping is not final">
          <p>
            The three registers (Daily low, 4H middle, 15m high) follow Slushy&apos;s earlier demo. The scale, rhythm and
            trend story here are placeholders until Slushy approves the final mapping. All tones are original and generated in
            your browser. The trend lines are invented, not market data.
          </p>
          <p>Sound only starts when you press Play. Use Mute or Stop at any time.</p>
        </StatusNotice>

        <section aria-labelledby="player-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="player-title"
            icon={<Music className="size-5" />}
            title="Listen to three trends at once"
            description="Press Play, then try each timeframe on its own. Watch the badges change when a trend turns."
          />
          <div className="mt-5">
            <TrendPiano />
          </div>
        </section>

        <section aria-labelledby="exercise-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="exercise-title"
            icon={<Ear className="size-5" />}
            title="Listen and identify"
            description="Three short clips. Is each trend rising, flat or falling? Headphones help."
          />
          <div className="mt-5">
            <ListenExercise />
          </div>
        </section>

        <section aria-labelledby="mapping-title">
          <SectionHeading
            id="mapping-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped (provisional)"
            description="Simple rules so you can connect what you hear with what you see."
          />
          <div
            role="region"
            aria-label="Sound mapping table, scroll sideways on small screens"
            tabIndex={0}
            className="mt-5 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Timeframe</th>
                  <th scope="col" className="px-4 py-3">Register</th>
                  <th scope="col" className="px-4 py-3">Notes</th>
                  <th scope="col" className="px-4 py-3">Rhythm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {TIMEFRAMES.map((tf) => (
                  <tr key={tf.id}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      <span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: tf.color }} />
                      {tf.short}
                    </th>
                    <td className="px-4 py-3">{tf.register}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {noteName(tf.baseMidi)} to {noteName(tf.baseMidi + 12)}
                    </td>
                    <td className="px-4 py-3">
                      One note every {(tf.everySteps * STEP_SECONDS).toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Pitch follows price.</span> Higher on the trend line means a higher note
              inside that register.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Slower timeframe, longer notes.</span> Daily moves slowly, 15m reacts
              quickly.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">One friendly scale.</span> A major pentatonic scale keeps all three parts
              pleasant together.
            </li>
          </ul>
          <GlossaryLink section="timeframes-and-sound" />
        </section>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Share feedback on the sound</ButtonLink>
          <ButtonLink href="/learn" variant="secondary">
            Back to lessons
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

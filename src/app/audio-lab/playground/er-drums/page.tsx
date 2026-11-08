import type { Metadata } from "next";
import { Calculator, Headphones, Info, SlidersHorizontal } from "lucide-react";
import { PlaygroundModeNav, PlaygroundModesList } from "@/components/audio/playground/PlaygroundModes";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { ER_DRUM, ER_PERIOD, ER_THRESHOLD } from "@/lib/sonification/modes/er-drums";
import { BAND_ATR_MULTIPLIER, BAND_ATR_PERIOD, BAND_EMA_PERIOD } from "@/lib/sonification/modes/sonar-bands";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/er-drums";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Sonar Channels and ER Drums",
  description:
    "Hear when a market is choppy: drums play while the 7 bar Efficiency Ratio is below 0.5, organs follow a price channel. Simulated data, experimental sound mapping.",
  path: PATH,
});

const examples = [
  { path: "Up 1, up 1, up 1, up 1, up 1, up 1, up 1", net: 7, total: 7, er: "1.00", reading: "Perfectly straight. Drums rest." },
  { path: "Up 2, down 1, up 2, down 1, up 2, down 1, up 2", net: 5, total: 11, er: "0.45", reading: "Mostly up, but with a lot of back and forth. Drums play." },
  { path: "Up 1, down 1, up 1, down 1, up 1, down 1, up 1", net: 1, total: 7, er: "0.14", reading: "Going nowhere. Drums play." },
];

export default function ErDrumsPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Sonar Channels and ER Drums",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "ER Drums", path: PATH },
          ],
          teaches: ["Efficiency Ratio", "Choppy versus trending markets", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Sonar Channels and ER drums"
        description="Some stretches of a chart go somewhere, others just shake back and forth. The Efficiency Ratio puts a number on that, and here the drums play whenever the market is choppy."
        pose="thinking"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="sonar-er-drums" />

        <StatusNotice title="Experiment in progress">
          <p>
            This mode is based on the &quot;Sonar channels + ER drums&quot; mode in Slushy&apos;s Sound Playground prototype.
            The threshold, drum pattern and channel are provisional and may change after more listening tests. Every chart is
            invented by a seeded random walk, not taken from a real market.
          </p>
          <p>Sound only starts when you press Play. A low Efficiency Ratio describes the last few bars. It does not predict the next ones.</p>
        </StatusNotice>

        <section aria-labelledby="er-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="er-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Listen for choppy stretches"
            description="Gold shading marks bars where the drums play. Start with Drums only, then add the organs and the breakout chimes."
          />
          <div className="mt-5">
            <SoundPlayground modeId="sonar-er-drums" />
          </div>
        </section>

        <section aria-labelledby="er-math-title">
          <SectionHeading
            id="er-math-title"
            icon={<Calculator className="size-5" />}
            title="What the Efficiency Ratio measures"
            description={`ER(${ER_PERIOD}) compares how far price got over the last ${ER_PERIOD} bars with how far it travelled to get there. No smoothing is applied.`}
          />
          <p className="mt-4 rounded-xl bg-navy-950/60 px-4 py-3 font-mono text-sm text-cyan-soft ring-1 ring-white/10">
            ER({ER_PERIOD}) = |close now - close {ER_PERIOD} bars ago| / sum of the {ER_PERIOD} bar to bar moves
          </p>
          <div
            role="region"
            aria-label="Efficiency Ratio examples, scroll sideways on small screens"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Seven moves</th>
                  <th scope="col" className="px-4 py-3">Net</th>
                  <th scope="col" className="px-4 py-3">Travelled</th>
                  <th scope="col" className="px-4 py-3">ER</th>
                  <th scope="col" className="px-4 py-3">Reading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {examples.map((e) => (
                  <tr key={e.er}>
                    <th scope="row" className="px-4 py-3 font-normal">{e.path}</th>
                    <td className="px-4 py-3 tabular-nums">{e.net}</td>
                    <td className="px-4 py-3 tabular-nums">{e.total}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-ink">{e.er}</td>
                    <td className="px-4 py-3">{e.reading}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="er-how-title">
          <SectionHeading
            id="er-how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description="Two independent ideas share one piece of music: the drums follow efficiency, the organs follow the channel."
          />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Drums: choppy.</span> On every bar where ER({ER_PERIOD}) is below{" "}
              {ER_THRESHOLD}, three quick drum hits play ({ER_DRUM.hz} Hz). At {ER_THRESHOLD} or above, the drums rest.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Organs: the channel.</span> The same channel as Sonar Bands: a{" "}
              {BAND_EMA_PERIOD} bar EMA with bands {BAND_ATR_MULTIPLIER} ATR({BAND_ATR_PERIOD}) away. Each organ grows louder as
              price nears its band.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Chimes and knocks.</span> A chime marks a close outside the channel, a
              soft double knock marks the first close back inside. Motion pairs are off by default, as in the prototype.
            </li>
          </ul>
          <GlossaryLink section="timeframes-and-sound" />
        </section>

        <section aria-labelledby="er-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="er-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Find the quiet.</span> Choose &quot;Drums only&quot; and close your
              eyes. When the drums stop, guess whether price is moving up or down. Then look.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Drums and chimes.</span> Choose &quot;Drums and breakouts&quot;. Do the
              chimes in this chart come more often while the drums play or while they rest? Try a few new charts.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Timeframes.</span> Play the same chart on 15m and on 4h. Is a slower
              timeframe more or less choppy here?
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the drums sound</ButtonLink>
          <ButtonLink href="/audio-lab/playground/sonar-bands" variant="secondary">
            Try Sonar Bands
          </ButtonLink>
          <ButtonLink href="/audio-lab" variant="secondary">
            Back to Audio Lab
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { Headphones, Info, Layers, SlidersHorizontal } from "lucide-react";
import { PlaygroundModeNav, PlaygroundModesList } from "@/components/audio/playground/PlaygroundModes";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { ER_FAST_PERIOD, MTF_SOUND, SLOW_FACTORS, SLOW_PULSE_BARS } from "@/lib/sonification/modes/multi-timeframe";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/multi-timeframe";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Two or Three Timeframes",
  description:
    "Hear a fast and a slow timeframe of the same chart at once: a flute for every close, a low organ for the slower trend, with optional efficiency and MACD cues. Simulated data.",
  path: PATH,
});

const frames = [
  { chart: "15m", mid: "1h", slow: "4h" },
  { chart: "1h", mid: "4h", slow: "16h" },
  { chart: "4h", mid: "16h", slow: "64h" },
];

export default function MultiTimeframePage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Two or Three Timeframes",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "Two or Three Timeframes", path: PATH },
          ],
          teaches: ["Multiple timeframe analysis", "Efficiency Ratio", "MACD", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Two or three timeframes"
        description="The same market sounds different depending on how slowly you look at it. Here a fast melody and a slow bass line play the same chart at two speeds."
        pose="djMixer"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="multi-timeframe" />

        <StatusNotice title="Experiment in progress">
          <p>
            This mode is based on the &quot;2 or 3 timeframes + indicators&quot; mode in Slushy&apos;s Sound Playground
            prototype. The instruments, pitches and indicators are provisional and may change. Every chart is invented by a
            seeded random walk, not taken from a real market.
          </p>
          <p>Sound only starts when you press Play. Hearing timeframes agree describes the past. It does not predict the next bar.</p>
        </StatusNotice>

        <section aria-labelledby="mtf-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="mtf-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Listen to two speeds at once"
            description="The step lines show what the slower layers play: the close of their last finished candle. Start with the default, then add the third timeframe or the indicators."
          />
          <div className="mt-5">
            <SoundPlayground modeId="multi-timeframe" />
          </div>
        </section>

        <section aria-labelledby="mtf-frames-title">
          <SectionHeading
            id="mtf-frames-title"
            icon={<Layers className="size-5" />}
            title="Which timeframes you hear"
            description={`The slower layers are always ${SLOW_FACTORS.mid} and ${SLOW_FACTORS.slow} times slower than the timeframe you pick above the chart.`}
          />
          <div
            role="region"
            aria-label="Timeframe combinations, scroll sideways on small screens"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Chart timeframe (flute)</th>
                  <th scope="col" className="px-4 py-3">{SLOW_FACTORS.mid}x slower (bell)</th>
                  <th scope="col" className="px-4 py-3">{SLOW_FACTORS.slow}x slower (organ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {frames.map((f) => (
                  <tr key={f.chart}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">{f.chart}</th>
                    <td className="px-4 py-3">{f.mid}</td>
                    <td className="px-4 py-3">{f.slow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            A slow candle is only known when it closes. Until then, its layer keeps repeating the close of the last finished
            candle, so you never hear a value that was not available yet.
          </p>
        </section>

        <section aria-labelledby="mtf-how-title">
          <SectionHeading
            id="mtf-how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description="Price layers use a pentatonic scale, so any two notes sound fine together. Higher close, higher note."
          />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Price layers.</span> The flute plays every close of the chart timeframe
              from {MTF_SOUND.priceHz} Hz. The slower layers play every {SLOW_PULSE_BARS} bars, the organ an octave lower from{" "}
              {MTF_SOUND.organHz} Hz. The scale spans the prices on screen.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Low efficiency drum.</span> A {MTF_SOUND.drumHz} Hz drum on every other
              bar while ER({ER_FAST_PERIOD}) is below 0.5, which means price is going back and forth. Off by default.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">MACD knock.</span> A {MTF_SOUND.knockHz} Hz knock when MACD, the gap
              between the 12 and 26 bar EMAs, crosses zero. Off by default.
            </li>
          </ul>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            Changes from the prototype: the pitch range follows the chart instead of a fixed price, slow layers pulse every{" "}
            {SLOW_PULSE_BARS} bars because each bar here lasts half a second, and the third layer is {SLOW_FACTORS.mid} times
            slower instead of Daily, since 60 bars of 15m are less than one day.
          </p>
          <GlossaryLink section="timeframes-and-sound" />
        </section>

        <section aria-labelledby="mtf-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="mtf-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Melody and bass.</span> With the default, does the flute end up
              above or below where the organ is? That is the chart price against the slow close.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Three in a row.</span> Choose &quot;Three timeframes&quot;. Listen
              for stretches where all three climb or all three fall together.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Switch the chart.</span> Play the same chart on 15m and on 4h. The
              organ moves much more slowly on 4h. Why?
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the timeframes sound</ButtonLink>
          <ButtonLink href="/audio-lab" variant="secondary">
            Three Trends, One Piano
          </ButtonLink>
          <ButtonLink href="/audio-lab/playground" variant="secondary">
            Back to the Sound Playground
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

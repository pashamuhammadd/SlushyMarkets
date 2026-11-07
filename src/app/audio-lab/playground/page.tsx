import type { Metadata } from "next";
import { Headphones, Info, ListChecks, SlidersHorizontal } from "lucide-react";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { ATR_PERIOD, EMA_SONAR_LAYERS } from "@/lib/sonification/modes/ema-sonar";
import { MODE_LISTINGS } from "@/lib/sonification/modes";
import { VOICES } from "@/lib/sonification/voices";
import { EMA_SONAR_PRESETS } from "@/lib/sonification/modes/ema-sonar";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: EMA Sonar",
  description:
    "Hear how close price is to the 7, 20 and 50 EMAs. Mix instruments, pulse speeds and timeframes on a simulated chart. An experimental sonification demo, not a trading signal.",
  path: PATH,
});

const defaults = EMA_SONAR_PRESETS[0].layers;

export default function SoundPlaygroundPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: EMA Sonar",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: PATH },
          ],
          teaches: ["Exponential moving average", "Distance from a moving average", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="EMA Sonar"
        description="Like a sonar ping, each moving average gets its own sound. The closer price gets to a line, the louder that line plays. Mix the layers and listen to the chart."
        pose="thinking"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <StatusNotice title="Experiment in progress">
          <p>
            This mode is based on Slushy&apos;s EMA Sonar prototype. The pitches, fade distances and pulse speeds are
            provisional and may change after more listening tests. Every chart is invented by a seeded random walk, not
            taken from a real market.
          </p>
          <p>Sound only starts when you press Play. Headphones or good speakers help, because the 50 EMA tone is deep.</p>
        </StatusNotice>

        <section aria-labelledby="playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Mix the sonar"
            description="Pick a preset, press Play and watch the cursor. Then mute, solo or swap instruments and replay the same chart."
          />
          <div className="mt-5">
            <SoundPlayground />
          </div>
        </section>

        <section aria-labelledby="how-title">
          <SectionHeading
            id="how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description="Each line keeps one fixed note. Only the loudness changes, so you can hear distance without reading the chart."
          />
          <div
            role="region"
            aria-label="EMA Sonar mapping table, scroll sideways on small screens"
            tabIndex={0}
            className="mt-5 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Line</th>
                  <th scope="col" className="px-4 py-3">Tone</th>
                  <th scope="col" className="px-4 py-3">Default instrument</th>
                  <th scope="col" className="px-4 py-3">Silent beyond</th>
                  <th scope="col" className="px-4 py-3">Default pulse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {EMA_SONAR_LAYERS.map((l) => (
                  <tr key={l.id}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      <span aria-hidden="true" className="mr-2 inline-block h-1 w-4 rounded-full align-middle" style={{ backgroundColor: l.color }} />
                      {l.label} ({l.colorName})
                    </th>
                    <td className="px-4 py-3 tabular-nums">{l.hz} Hz</td>
                    <td className="px-4 py-3">{VOICES[defaults[l.id].voice].label}</td>
                    <td className="px-4 py-3">{l.fadeAtr} ATR from the line</td>
                    <td className="px-4 py-3">{defaults[l.id].rate} per second</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Louder means closer.</span> Loudness is full when price sits on the
              line and fades to silence at the distance in the table.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Distance is measured in ATR.</span> ATR here is the average bar range
              over {ATR_PERIOD} bars, so &quot;close&quot; adapts to how jumpy the chart is.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Crossing sounds like a peak.</span> When price crosses a line, that
              layer swells to full loudness and fades again as price moves away.
            </li>
          </ul>
          <GlossaryLink section="moving-averages" />
        </section>

        <section aria-labelledby="listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. One line.</span> Choose &quot;Start with one line&quot;. Close
              your eyes and raise a hand each time the organ swells. Then replay with your eyes open.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Fast versus slow.</span> Solo the 7 EMA, then the 50 EMA. Which one
              stays loud longer, and why might a slower average stay closer to price for less time?
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Switch timeframe.</span> Play the same chart on 15m and on 4h. The
              4h bars are built from the same 15 minute walk, so the story should feel related.
            </li>
          </ol>
        </section>

        <section aria-labelledby="modes-title">
          <SectionHeading
            id="modes-title"
            icon={<ListChecks className="size-5" />}
            title="More sonar modes are coming"
            description="Slushy has prototyped several other ways to listen to a chart. They will be added one at a time, once each one is tested."
          />
          <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {MODE_LISTINGS.map((m) => (
              <li key={m.id} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-sans text-sm font-semibold text-ink">{m.title}</h3>
                  <Badge tone={m.status === "live" ? "success" : "neutral"}>{m.status === "live" ? "Live here" : "Planned"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">{m.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the sonar sounds</ButtonLink>
          <ButtonLink href="/audio-lab" variant="secondary">
            Back to Audio Lab
          </ButtonLink>
          <ButtonLink href="/learn/sma-vs-ema" variant="secondary">
            Learn how EMAs work
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

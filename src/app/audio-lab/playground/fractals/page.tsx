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
import { CONFIRM_BARS, FRACTAL_SOUND, LOOKBACK_BARS } from "@/lib/sonification/modes/fractals";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/fractals";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Fractals, Confirm or Reject",
  description:
    "Hear swing highs and lows form: a knock for each candidate, a chime pair when it is confirmed, a thud when it is rejected. Simulated data, experimental sound mapping.",
  path: PATH,
});

const steps = [
  {
    bar: "Bar 0",
    what: "Its high is above the highs of the two bars before it.",
    sound: "Soft knock: a candidate swing high.",
  },
  {
    bar: "Bar 1",
    what: "Its high stays below the candidate high.",
    sound: "Nothing yet. The candidate keeps waiting.",
  },
  {
    bar: "Bar 2",
    what: "Its high also stays below.",
    sound: "Rising chime pair: swing high confirmed.",
  },
  {
    bar: "Bar 1 or 2 instead",
    what: "A high equal to or above the candidate high.",
    sound: "Low thud: the candidate is rejected.",
  },
];

export default function FractalsPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Fractals, Confirm or Reject",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "Fractals", path: PATH },
          ],
          teaches: ["Swing highs and lows", "Fractals", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Fractals: confirm or reject"
        description="A swing high or low is only clear in hindsight. Here you hear every candidate as it appears, and then whether the next bars confirm it or reject it."
        pose="sonarRadar"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated data</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="fractals" />

        <StatusNotice title="Experiment in progress">
          <p>
            This mode is based on the &quot;Fractals · confirm / reject&quot; mode in Slushy&apos;s Sound Playground prototype.
            The rules and sounds are provisional and may change after more listening tests. Every chart is invented by a seeded
            random walk, not taken from a real market.
          </p>
          <p>
            Sound only starts when you press Play. Every cue sounds when a bar closes and describes what already happened. A
            confirmed swing does not predict a reversal.
          </p>
        </StatusNotice>

        <section aria-labelledby="fractals-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="fractals-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Listen for swings"
            description="Violet dots mark candidates, triangles mark confirmed swings and gold crosses mark rejections. A triangle only appears when its confirming bar closes."
          />
          <div className="mt-5">
            <SoundPlayground modeId="fractals" />
          </div>
        </section>

        <section aria-labelledby="fractals-rule-title">
          <SectionHeading
            id="fractals-rule-title"
            icon={<Waypoints className="size-5" />}
            title="The rule, one bar at a time"
            description={`A candidate needs a more extreme high or low than the ${LOOKBACK_BARS} bars before it, then ${CONFIRM_BARS} bars that do not reach it again. Swing lows work the same way, upside down.`}
          />
          <div
            role="region"
            aria-label="Swing high example, scroll sideways on small screens"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Bar</th>
                  <th scope="col" className="px-4 py-3">What happens</th>
                  <th scope="col" className="px-4 py-3">What you hear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {steps.map((s) => (
                  <tr key={s.bar}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">{s.bar}</th>
                    <td className="px-4 py-3">{s.what}</td>
                    <td className="px-4 py-3">{s.sound}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            This is a shorter rule than the classic five bar fractal, which also waits two bars on each side. Waiting longer
            gives fewer false swings but tells you later. Either way, the swing is only known after the fact.
          </p>
        </section>

        <section aria-labelledby="fractals-how-title">
          <SectionHeading
            id="fractals-how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description="Three event layers. They only sound when something happens, so quiet stretches are normal."
          />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Knock: candidate.</span> {FRACTAL_SOUND.candidate.highHz} Hz for a
              candidate high, {FRACTAL_SOUND.candidate.lowHz} Hz for a candidate low. Quiet on purpose, since most candidates
              never confirm.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Chime pair: confirmed.</span> Rising ({FRACTAL_SOUND.confirm.high[0]}{" "}
              then {FRACTAL_SOUND.confirm.high[1]} Hz) for a swing high, falling ({FRACTAL_SOUND.confirm.low[0]} then{" "}
              {FRACTAL_SOUND.confirm.low[1]} Hz) for a swing low.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Thud: rejected.</span> A low {FRACTAL_SOUND.reject.hz} Hz drum when a
              later bar reaches the candidate level before it confirms.
            </li>
          </ul>
        </section>

        <section aria-labelledby="fractals-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="fractals-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Count the knocks.</span> With &quot;Slushy&apos;s fractals&quot;, how
              many knocks come before each chime? That is roughly how many candidates fail per swing.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Trend or range.</span> Try &quot;Outcomes only&quot; on a few new
              charts. Do rejections cluster when price trends in one direction?
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Up or down by ear.</span> Choose &quot;Confirmations only&quot;, close
              your eyes and call each chime pair rising or falling. Then check the triangles.
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the fractals sound</ButtonLink>
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

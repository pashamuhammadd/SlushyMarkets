import type { Metadata } from "next";
import { Headphones, Info, SlidersHorizontal, Users } from "lucide-react";
import { PlaygroundModeNav, PlaygroundModesList } from "@/components/audio/playground/PlaygroundModes";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlossaryLink } from "@/components/lessons/GlossaryLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { BAND_ATR_MULTIPLIER, BAND_ATR_PERIOD, BAND_EMA_PERIOD } from "@/lib/sonification/modes/sonar-bands";
import { VOLUME_DRUM } from "@/lib/sonification/modes/sonar-volume";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/sonar-volume";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Sonar Channels and Volume",
  description:
    "Hear buyer and seller volume as quick high and low drum hits on top of a price channel. Simulated volume and prices, experimental sound mapping.",
  path: PATH,
});

const examples = [
  { units: 5, share: "80%", buyers: 4, sellers: 1, reading: "Four high hits, then one low hit. Buyers were more aggressive." },
  { units: 4, share: "50%", buyers: 2, sellers: 2, reading: "Two high, two low. Even." },
  { units: 2, share: "10%", buyers: 0, sellers: 2, reading: "Only two low hits, and a quiet bar overall." },
];

export default function SonarVolumePage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Sonar Channels and Volume",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "Sonar Volume", path: PATH },
          ],
          teaches: ["Trading volume", "Buyer and seller initiated volume", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Sonar Channels and volume"
        description="Every bar also has volume. Here it becomes a quick burst of drum hits: high hits for buyers, low hits for sellers, while the organs keep following the price channel."
        pose="drums"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated volume and prices</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="sonar-volume" />

        <StatusNotice title="Experiment in progress">
          <p>
            This mode is based on the &quot;Sonar channels + rapid volume&quot; mode in Slushy&apos;s Sound Playground
            prototype. The volume is random, exactly as in the prototype: each bar gets 1 to 5 hits and a random split between
            buyers and sellers. It is not linked to the price moves and it is not real order flow. Prices come from a seeded
            random walk.
          </p>
          <p>Sound only starts when you press Play. The drum pattern and pitches are provisional and may change.</p>
        </StatusNotice>

        <section aria-labelledby="volume-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="volume-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Listen to who is pushing"
            description="The strip under the chart shows the hits of each bar: green for buyers on top, pink for sellers below. Start with Volume only."
          />
          <div className="mt-5">
            <SoundPlayground modeId="sonar-volume" />
          </div>
        </section>

        <section aria-labelledby="volume-what-title">
          <SectionHeading
            id="volume-what-title"
            icon={<Users className="size-5" />}
            title="Buyers and sellers in one trade"
            description="Every trade has a buyer and a seller, so volume itself has no side. What can differ is who crossed the spread."
          />
          <p className="mt-4 max-w-3xl text-sm text-muted">
            Exchanges often tag each trade by its aggressor: the side that sent the market order and took the other side&apos;s
            resting order. &quot;Buyer volume&quot; here means volume where the buyer was the aggressor, &quot;seller
            volume&quot; the opposite. On a real chart this would come from exchange trade data. In this playground both are
            invented so you can practise hearing the split.
          </p>
          <div
            role="region"
            aria-label="Volume split examples, scroll sideways on small screens"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-white/10"
          >
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-navy-800/80 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Total hits</th>
                  <th scope="col" className="px-4 py-3">Buyer share</th>
                  <th scope="col" className="px-4 py-3">Buyer hits</th>
                  <th scope="col" className="px-4 py-3">Seller hits</th>
                  <th scope="col" className="px-4 py-3">What you hear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-navy-900/60 text-muted">
                {examples.map((e) => (
                  <tr key={e.share}>
                    <th scope="row" className="px-4 py-3 font-normal tabular-nums">{e.units}</th>
                    <td className="px-4 py-3 tabular-nums">{e.share}</td>
                    <td className="px-4 py-3 tabular-nums">{e.buyers}</td>
                    <td className="px-4 py-3 tabular-nums">{e.sellers}</td>
                    <td className="px-4 py-3">{e.reading}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="volume-how-title">
          <SectionHeading
            id="volume-how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description="Volume and the channel are independent layers in one piece of music."
          />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Drums: volume.</span> Buyer hits play first at {VOLUME_DRUM.buyerHz} Hz,
              then seller hits at {VOLUME_DRUM.sellerHz} Hz, all packed into the first quarter second of the bar. More hits
              means more volume.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Organs: the channel.</span> The same channel as Sonar Bands: a{" "}
              {BAND_EMA_PERIOD} bar EMA with bands {BAND_ATR_MULTIPLIER} ATR({BAND_ATR_PERIOD}) away. Each organ grows louder as
              price nears its band. The midline is muted, as in the prototype.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Chimes and knocks.</span> A chime marks a close outside the channel, a
              soft double knock marks the first close back inside. Motion pairs are off by default.
            </li>
          </ul>
          <GlossaryLink section="timeframes-and-sound" />
        </section>

        <section aria-labelledby="volume-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="volume-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Count by ear.</span> Choose &quot;Volume only&quot;, slow the speed
              down and count the high and low hits of a few bars. Check them against the strip.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Look for a story.</span> Choose &quot;Volume and breakouts&quot;. Do
              breakouts seem to come with more buyer hits? The volume here is random, so any link you hear is chance.
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Full mix.</span> Play &quot;Slushy&apos;s Sonar Bands&quot;. Can you
              still follow the volume while the organs play, or does one layer hide the other?
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the volume sounds</ButtonLink>
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

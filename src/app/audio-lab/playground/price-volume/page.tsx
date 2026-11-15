import type { Metadata } from "next";
import Link from "next/link";
import { Headphones, Info, Receipt, SlidersHorizontal } from "lucide-react";
import { PlaygroundModeNav, PlaygroundModesList } from "@/components/audio/playground/PlaygroundModes";
import { SoundPlayground } from "@/components/audio/playground/SoundPlayground";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { ACTIVITY_LOOKBACK, PV_SOUND } from "@/lib/sonification/modes/price-volume";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/audio-lab/playground/price-volume";

export const metadata: Metadata = pageMetadata({
  title: "Sound Playground: Price and Volume Conversation",
  description:
    "Price has one voice, trading activity another. Hear each candle as a wood note and its volume as quick drum hits, both built from the same simulated trades.",
  path: PATH,
});

export default function PriceVolumePage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Sound Playground: Price and Volume Conversation",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Audio Lab", path: "/audio-lab" },
            { name: "Sound Playground", path: "/audio-lab/playground" },
            { name: "Price and Volume", path: PATH },
          ],
          teaches: ["Trading volume", "Candlesticks", "Market sonification"],
          resourceType: "Interactive audio exercise",
        })}
      />
      <PageHeader
        eyebrow="Audio Lab · Sound Playground"
        title="Price and volume conversation"
        description="Price has one voice. Trading activity has another. Listen to how they answer each other, candle by candle."
        pose="drums"
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">Simulated trades</Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <Badge tone="neutral">Not a trading signal</Badge>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <PlaygroundModeNav current="price-volume" />

        <StatusNotice title="New concept, first version">
          <p>
            This is one of Slushy&apos;s new sound concepts. The notes and drum pattern follow his concept video; the exact rules
            may still change. All prices and trades are simulated.
          </p>
          <p>Sound only starts when you press Play. Busy candles are not a signal; they only show that more trading happened.</p>
        </StatusNotice>

        <section aria-labelledby="pv-playground-title" className="panel panel-glow p-4 sm:p-6">
          <SectionHeading
            id="pv-playground-title"
            icon={<SlidersHorizontal className="size-5" />}
            title="Listen to both voices"
            description="The violet strip under the chart shows the activity level of each candle, from 1 to 5 drum hits."
          />
          <div className="mt-5">
            <SoundPlayground modeId="price-volume" />
          </div>
        </section>

        <section aria-labelledby="pv-trades-title">
          <SectionHeading
            id="pv-trades-title"
            icon={<Receipt className="size-5" />}
            title="One set of trades, two summaries"
            description="Each candle here is built from simulated trades, just like in the first lesson."
          />
          <p className="mt-4 max-w-3xl text-sm text-muted">
            The trades of a candle walk from the open to its low and high and on to the close. The candle is the price summary of
            those trades, and the volume is the sum of their sizes. Bigger moves need more trades, so busy candles tend to be the
            big ones, but not always. In the Sonar volume mode the volume is random; here it comes from the same trades as the
            price.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Want to see trades turn into candles step by step?{" "}
            <Link href="/learn/candlesticks-and-volume" className="font-semibold text-cyan hover:underline">
              Open the Candlesticks and Volume lesson
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="pv-how-title">
          <SectionHeading
            id="pv-how-title"
            icon={<Info className="size-5" />}
            title="How the sound is mapped"
            description="Two short sounds per candle, half a second each."
          />
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Price voice.</span> A wood note at the start of the candle: about{" "}
              {PV_SOUND.upHz} Hz when it closes above its open, about {PV_SOUND.downHz} Hz when it closes below.
            </li>
            <li className="panel p-4 text-sm text-muted">
              <span className="font-semibold text-ink">Activity drums.</span> One to five quick hits of the rounded wood drum.
              The count depends on how this candle&apos;s volume ranks among the last {ACTIVITY_LOOKBACK} candles: five hits for
              one of the busiest, one hit for one of the quietest.
            </li>
          </ul>
        </section>

        <section aria-labelledby="pv-listen-title" className="panel p-4 sm:p-6">
          <SectionHeading
            id="pv-listen-title"
            icon={<Headphones className="size-5" />}
            title="Three things to try"
            description="Short listening tasks. There is no score; the goal is to notice patterns."
          />
          <ol className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">1. Big candles.</span> When a run of high notes starts, do the drums get
              busier too?
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">2. Quiet drift.</span> Find a stretch with only one or two hits per candle.
              What does price do there?
            </li>
            <li className="rounded-xl bg-navy-950/50 p-4 ring-1 ring-white/10">
              <span className="font-semibold text-ink">3. Compare.</span> Play the same chart in Sonar volume. Which one tells
              you more, random volume or volume from the trades?
            </li>
          </ol>
        </section>

        <PlaygroundModesList />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/feedback">Tell us how the conversation sounds</ButtonLink>
          <ButtonLink href="/audio-lab/playground/two-wall" variant="secondary">
            Try Two-wall sonar
          </ButtonLink>
          <ButtonLink href="/audio-lab/playground" variant="secondary">
            Back to the Sound Playground
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EchoBandsLesson } from "@/components/lessons/EchoBandsLesson";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Container, SectionHeading } from "@/components/ui/Section";
import { ECHO_COMPLETION, ECHO_QUIZ, LESSON_ID } from "@/data/lessons/echo-bands";
import { ECHO } from "@/lib/sonification/echo-bands";
import { pageMetadata } from "@/lib/site";
import { learningResourceGraph } from "@/lib/structured-data";

const PATH = "/learn/echo-bands";

export const metadata: Metadata = pageMetadata({
  title: "Echo Bands: Hear Where a Candle Closes",
  description:
    "Interactive sound lesson: each candle plays its lower band, its close and its upper band, so you can hear how far price closed from two boundaries. Includes an ear training drill.",
  path: PATH,
});

const ideas = [
  {
    title: "Three notes per candle",
    body: "The lower band, the close and the upper band each play a short note. The band notes never change, so the close note is what you follow.",
    formula: `Lower ${Math.round(ECHO.lowerHz)} Hz, upper ${Math.round(ECHO.upperHz)} Hz`,
  },
  {
    title: "Pitch and timing both measure distance",
    body: "Where the close sits between the bands sets both its pitch and when it plays. Halfway in price sounds halfway between the band notes.",
    formula: "Position = (close - lower) / (upper - lower)",
  },
  {
    title: "Outside the channel, the close goes first",
    body: "If the candle closes above or below the bands, its note plays before both band notes. A higher pitch means above, a lower pitch means below.",
    formula: "Close, then lower, then upper",
  },
];

export default function EchoBandsPage() {
  return (
    <>
      <JsonLd
        data={learningResourceGraph({
          name: "Echo Bands",
          description: metadata.description as string,
          path: PATH,
          crumbs: [
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
            { name: "Echo Bands", path: PATH },
          ],
          teaches: ["Price channels", "Distance from boundaries", "Market sonification"],
          minutes: 6,
          resourceType: "Interactive lesson",
        })}
      />
      <PageHeader
        eyebrow="Sound lesson"
        title="Echo Bands"
        description="Measure where a candle closes between two boundaries by ear. Echo bands are different from sonar bands: they turn distance into pitch and timing."
        pose="sonarRadar"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="cyan">
            <GraduationCap aria-hidden="true" className="size-3.5" />
            Beginner
          </Badge>
          <Badge tone="magenta">Experimental sound mapping</Badge>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" /> About 6 minutes
          </span>
        </div>
      </PageHeader>

      <Container className="space-y-12">
        <section aria-label="Interactive lesson">
          <EchoBandsLesson />
        </section>

        <section aria-labelledby="echo-ideas-title">
          <SectionHeading id="echo-ideas-title" icon={<BookOpen className="size-5" />} title="Key ideas" />
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <li key={idea.title} className="panel p-5">
                <h3 className="text-lg font-semibold text-ink">{idea.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{idea.body}</p>
                <p className="mt-3 rounded-lg bg-navy-950/60 px-3 py-2 font-mono text-xs text-cyan-soft ring-1 ring-white/5">{idea.formula}</p>
              </li>
            ))}
          </ul>
          <details className="panel mt-3 p-5 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-ink">How this demo works</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>The idea comes from Slushy&apos;s Echo Bands experiment. The exact sounds here are a provisional reconstruction.</li>
              <li>The close pitch moves on a musical scale between the band notes, so equal steps in price sound like equal musical steps.</li>
              <li>
                Band notes play {Math.round(ECHO.bandGapSec * 1000)} ms apart. Outside the channel the close leads by {Math.round(ECHO.leadSec * 1000)} ms, and its pitch keeps moving up to half a channel beyond a band.
              </li>
              <li>The bands here are fixed lines at 100 and 120 with invented candles. On real charts they could come from an indicator, which is not decided yet.</li>
              <li>Echo bands describe distance. They are not a forecast or a trading signal.</li>
            </ul>
          </details>
        </section>

        <section id="quiz" aria-labelledby="echo-quiz-title" className="scroll-mt-24">
          <SectionHeading id="echo-quiz-title" eyebrow="Knowledge check" title="Check your understanding" description={`${ECHO_QUIZ.length} quick questions. Pick an answer to see the explanation.`} />
          <div className="mt-5">
            <LessonQuiz lessonId={LESSON_ID} questions={ECHO_QUIZ} completionMessage={ECHO_COMPLETION} />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Compare with Sonar Bands</h2>
              <p className="mt-1 text-sm text-muted">Sonar Bands change loudness as price nears a boundary. Hear the difference in the Sound Playground.</p>
            </div>
            <Link href="/audio-lab/playground/sonar-bands" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              Sonar Bands <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
          <section className="panel flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Was this lesson clear?</h2>
              <p className="mt-1 text-sm text-muted">Tell us what clicked and what did not. It shapes the next lessons.</p>
            </div>
            <Link href="/feedback" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
              Share feedback <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        </div>
      </Container>
    </>
  );
}

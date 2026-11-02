import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookA, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CandleVolumePreview } from "@/components/lessons/CandleVolumePreview";
import { LessonIcon } from "@/components/marketing/LessonIcon";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, SectionHeading } from "@/components/ui/Section";
import { GLOSSARY } from "@/data/glossary";
import { lessons } from "@/data/lessons";
import { absoluteUrl, pageMetadata, site } from "@/lib/site";
import { breadcrumbList } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Candlestick Demo and Beginner Trading Glossary",
  description:
    "Play with a candlestick and volume by price demo built from simulated trades, then look up candles, moving averages, Renko and timeframes in plain English.",
  path: "/explore",
});

// One entry per lesson page, so lessons that share a page (volume profile) are not repeated.
const lessonLinks = lessons.filter(
  (lesson, i, all) => lesson.status === "available" && lesson.href && all.findIndex((l) => l.href === lesson.href) === i,
);

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LearningResource",
      name: "Candlestick and volume profile demo",
      description: metadata.description,
      url: absoluteUrl("/explore"),
      inLanguage: "en",
      learningResourceType: "Interactive simulation",
      educationalLevel: "Beginner",
      isAccessibleForFree: true,
      provider: { "@id": `${site.url}/#organization` },
    },
    {
      "@type": "DefinedTermSet",
      "@id": `${absoluteUrl("/explore")}#glossary`,
      name: `${site.name} beginner trading glossary`,
      url: `${absoluteUrl("/explore")}#glossary`,
      hasDefinedTerm: GLOSSARY.flatMap((section) =>
        section.terms.map((t) => ({
          "@type": "DefinedTerm",
          "@id": `${absoluteUrl("/explore")}#${t.id}`,
          name: t.term,
          description: t.definition,
          url: `${absoluteUrl("/explore")}#${t.id}`,
          inDefinedTermSet: `${absoluteUrl("/explore")}#glossary`,
        })),
      ),
    },
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Explore", path: "/explore" },
    ]),
  ],
};

export default function ExplorePage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader
        eyebrow="Explore"
        title="Explore the demo"
        description="A hands on playground. Play, pause, step one trade at a time or drag the timeline. Every view updates from the same simulated trades."
        pose="toTheMoon"
      />
      <Container className="space-y-12">
        <section aria-labelledby="demo-title" className="panel panel-glow p-4 sm:p-6">
          <h2 id="demo-title" className="mb-4 text-xl font-semibold text-ink">
            Candles and volume by price
          </h2>
          <CandleVolumePreview />
        </section>

        <section aria-labelledby="more-title">
          <SectionHeading
            id="more-title"
            title="More interactive lessons"
            description="Each lesson has guided steps, playback controls and a short quiz."
          />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lessonLinks.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={lesson.href!}
                  className="panel group flex h-full items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-cyan/40"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy-950/70 p-2.5 ring-1 ring-white/10">
                    <LessonIcon kind={lesson.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold text-ink">{lesson.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{lesson.topics.join(", ")}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-cyan transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="glossary" aria-labelledby="glossary-title" className="scroll-mt-24">
          <SectionHeading
            id="glossary-title"
            icon={<BookA className="size-5" />}
            title="Beginner glossary"
            description="The words you will see in the lessons, in plain English. Every term has its own link you can share."
          />
          <nav aria-label="Glossary sections" className="mt-4">
            <ul className="flex flex-wrap gap-2">
              {GLOSSARY.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-flex min-h-10 items-center rounded-full bg-navy-950/50 px-4 text-sm font-medium text-muted ring-1 ring-white/10 transition hover:text-ink hover:ring-cyan/40"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6 space-y-8">
            {GLOSSARY.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 id={`${section.id}-title`} className="text-xl font-semibold text-ink">
                    {section.title}
                  </h3>
                  {section.lesson ? (
                    <Link href={section.lesson.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
                      Learn it in {section.lesson.label} <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.terms.map((item) => (
                    <div key={item.id} id={item.id} className="panel group scroll-mt-24 p-4 target:ring-2 target:ring-cyan/60">
                      <dt className="flex items-start justify-between gap-2 font-display text-lg font-semibold text-cyan-soft">
                        {item.term}
                        <a
                          href={`#${item.id}`}
                          aria-label={`Link to ${item.term}`}
                          className="grid size-8 shrink-0 place-items-center rounded-full text-subtle opacity-70 transition hover:bg-white/5 hover:text-cyan hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Link2 aria-hidden="true" className="size-4" />
                        </a>
                      </dt>
                      <dd className="mt-1 text-sm text-muted">{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </section>

        <section className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-ink">Want to hear trends too?</h2>
            <p className="mt-1 text-sm text-muted">The Three Trends, One Piano prototype is being built in the Audio Lab.</p>
          </div>
          <Link href="/audio-lab" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline">
            Go to Audio Lab <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </Container>
    </>
  );
}

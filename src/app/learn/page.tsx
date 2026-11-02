import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LessonIcon } from "@/components/marketing/LessonIcon";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { lessons, statusLabel, type LessonStatus } from "@/data/lessons";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/site";
import { breadcrumbGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Free Interactive Trading Lessons for Beginners",
  description:
    "Short, visual trading lessons for beginners: candlesticks, volume by price, SMA vs EMA moving averages, Renko bricks and learning with sound.",
  path: "/learn",
});

const statusTone: Record<LessonStatus, BadgeTone> = {
  available: "success",
  preview: "cyan",
  "in-development": "violet",
  planned: "neutral",
};

export default function LearnPage() {
  return (
    <>
      <JsonLd data={breadcrumbGraph([{ name: "Home", path: "/" }, { name: "Learn", path: "/learn" }])} />
      <PageHeader
        eyebrow="Learn"
        title="Trading lessons"
        description="Short lessons that show how charts and indicators are built, not just what they look like. Every module is labeled honestly so you know what is ready today."
        pose="thinking"
      />
      <Container>
        <ul className="grid gap-4 md:grid-cols-2">
          {lessons.map((lesson) => (
            <li key={lesson.slug} id={lesson.slug} className="panel flex scroll-mt-24 flex-col p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-navy-950/70 p-2.5 ring-1 ring-white/10">
                  <LessonIcon kind={lesson.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-ink">{lesson.title}</h2>
                    <Badge tone={statusTone[lesson.status]}>{statusLabel[lesson.status]}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{lesson.summary}</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Topics">
                {lesson.topics.map((topic) => (
                  <li key={topic} className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted ring-1 ring-white/10">
                    {topic}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="flex items-center gap-1.5 text-xs text-subtle">
                  {lesson.minutes ? (
                    <>
                      <Clock aria-hidden="true" className="size-3.5" /> About {lesson.minutes} minutes
                    </>
                  ) : (
                    "Timing to be decided"
                  )}
                </span>
                {lesson.href ? (
                  <Link
                    href={lesson.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan hover:underline"
                  >
                    {lesson.status === "available" ? "Start lesson" : lesson.status === "preview" ? "Open preview" : "Learn more"}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <span className="text-sm text-subtle">Not available yet</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-subtle">
          The Candlesticks and Volume lesson covers volume profiles too, so both cards open the same lesson.
        </p>
      </Container>
    </>
  );
}

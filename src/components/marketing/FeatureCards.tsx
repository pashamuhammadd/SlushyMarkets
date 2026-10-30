import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Section";
import { lessons, statusLabel, type Lesson } from "@/data/lessons";
import { LessonIcon } from "./LessonIcon";

const shortCopy: Record<string, string> = {
  "candlesticks-and-volume": "Understand price action in a simple, visual way.",
  "volume-profile": "See where the real trading happened.",
  "sma-vs-ema": "Compare the most common moving averages.",
  "three-trends-one-piano": "Turn market structure into music.",
};

const cardTitle: Record<string, string> = {
  "candlesticks-and-volume": "Candlesticks",
};

function destination(lesson: Lesson): Route {
  return lesson.href ?? "/learn";
}

export function FeatureCards() {
  return (
    <section aria-labelledby="features-title">
      <Container>
        <h2 id="features-title" className="sr-only">
          What you can learn
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={destination(lesson)}
                className="panel group flex h-full items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-glow-cyan"
              >
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-navy-950/70 p-2.5 ring-1 ring-white/10">
                  <LessonIcon kind={lesson.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold text-ink">{cardTitle[lesson.slug] ?? lesson.title}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{shortCopy[lesson.slug]}</span>
                  {lesson.status !== "preview" ? (
                    <Badge tone={lesson.status === "planned" ? "neutral" : "violet"} className="mt-2">
                      {statusLabel[lesson.status]}
                    </Badge>
                  ) : null}
                </span>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-cyan transition group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

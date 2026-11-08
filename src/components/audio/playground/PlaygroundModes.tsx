import Link from "next/link";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { MODE_LISTINGS, type PlayableModeId } from "@/lib/sonification/modes";

/** Tabs between the playable Sound Playground modes. Each mode has its own page. */
export function PlaygroundModeNav({ current }: { current: PlayableModeId }) {
  const live = MODE_LISTINGS.filter((m) => m.status === "live" && m.href);
  return (
    <nav aria-label="Sound Playground modes">
      <ul className="flex flex-wrap gap-2">
        {live.map((m) => {
          const active = m.id === current;
          return (
            <li key={m.id}>
              <Link
                href={m.href!}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold ring-1 transition",
                  active ? "bg-linear-to-r from-cyan/20 to-violet/20 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink",
                )}
              >
                {m.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** All of Slushy's playground mode ideas, live ones linked. */
export function PlaygroundModesList() {
  return (
    <section aria-labelledby="modes-title">
      <SectionHeading
        id="modes-title"
        icon={<ListChecks className="size-5" />}
        title="All sonar modes"
        description="Slushy has prototyped several ways to listen to a chart. They are added one at a time, once each one is tested."
      />
      <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {MODE_LISTINGS.map((m) => (
          <li key={m.id} className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-sans text-sm font-semibold text-ink">
                {m.href ? (
                  <Link href={m.href} className="hover:text-cyan hover:underline">
                    {m.title}
                  </Link>
                ) : (
                  m.title
                )}
              </h3>
              <Badge tone={m.status === "live" ? "success" : "neutral"}>{m.status === "live" ? "Live" : "Planned"}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{m.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

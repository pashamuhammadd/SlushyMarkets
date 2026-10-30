import { CheckCircle2, Ear, Eye } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/Section";

const steps = [
  {
    icon: Eye,
    title: "Watch it form",
    body: "Step through simulated trades and see exactly how each candle and each volume bar is built.",
  },
  {
    icon: Ear,
    title: "Hear the pattern",
    body: "Listen to trends on different timeframes as music and notice when they move together.",
  },
  {
    icon: CheckCircle2,
    title: "Check yourself",
    body: "Answer a short question at the end of each lesson and get a clear explanation either way.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title">
      <Container>
        <SectionHeading id="how-title" eyebrow="How it works" title="Three small steps, one big aha" />
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="panel flex gap-4 p-5">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-cyan/20 to-violet/20 ring-1 ring-cyan/25">
                <Icon aria-hidden="true" className="size-5 text-cyan" />
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-violet text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

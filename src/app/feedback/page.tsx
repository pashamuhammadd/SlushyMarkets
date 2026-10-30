import type { Metadata } from "next";
import { Bug, Lightbulb, MessageSquare, Music, BookOpen, Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Help shape SlushyMarkets. The feedback form opens soon.",
};

const topics = [
  { icon: MessageSquare, label: "General" },
  { icon: BookOpen, label: "Lesson clarity" },
  { icon: Music, label: "Audio experience" },
  { icon: Bug, label: "Bug" },
  { icon: Lightbulb, label: "Suggestion" },
];

export default function FeedbackPage() {
  return (
    <>
      <PageHeader
        eyebrow="Feedback"
        title="Help shape SlushyMarkets"
        description="Your feedback decides which lessons come next and how they should feel."
        pose="cool"
      />
      <Container className="space-y-8">
        <StatusNotice title="The feedback form opens in the next update">
          <p>
            We are connecting it to secure storage first, so every message is really saved. Until then nothing on this page
            collects or sends any data.
          </p>
        </StatusNotice>

        <section aria-labelledby="topics-title" className="panel p-5 sm:p-6">
          <h2 id="topics-title" className="text-xl font-semibold text-ink">
            What you will be able to tell us
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {topics.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-sm text-ink ring-1 ring-white/10">
                <Icon aria-hidden="true" className="size-4 text-cyan" />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Plus an optional 1 to 5 rating and a short message. Leaving an email will be optional and only used to reply to
            you.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-subtle">
            <Lock aria-hidden="true" className="size-3.5" />
            No wallet addresses, no account and no tracking required.
          </p>
        </section>

        <ButtonLink href="/explore" variant="secondary">
          Try the demo meanwhile
        </ButtonLink>
      </Container>
    </>
  );
}

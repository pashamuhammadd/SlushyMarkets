import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { isFeedbackConfigured } from "@/lib/server/feedback-store";
import { FEEDBACK_TOPICS } from "@/lib/validation/feedback";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/site";
import { breadcrumbGraph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Share Feedback on Lessons and the Audio Lab",
  description:
    "Help shape Slushy Markets. Tell us what clicked, what confused you and which trading lesson or audio experiment should come next.",
  path: "/feedback",
});

export default function FeedbackPage() {
  // Read on the server at build time. After adding the Supabase variables in Vercel, redeploy.
  const configured = isFeedbackConfigured();

  return (
    <>
      <JsonLd data={breadcrumbGraph([{ name: "Home", path: "/" }, { name: "Feedback", path: "/feedback" }])} />
      <PageHeader
        eyebrow="Feedback"
        title="Help shape Slushy Markets"
        description="Your feedback decides which lessons come next and how they should feel."
        pose="cool"
      />
      <Container className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Feedback form" className="panel panel-glow relative p-5 sm:p-7">
          {configured ? (
            <FeedbackForm />
          ) : (
            <div className="space-y-5">
              <StatusNotice title="The feedback form is not connected yet">
                <p>
                  Storage for feedback has not been configured on this deployment, so the form is shown as a preview and
                  cannot be sent. Nothing on this page collects data right now.
                </p>
              </StatusNotice>
              <div className="pointer-events-none select-none opacity-50" aria-hidden="true">
                <p className="text-sm font-semibold text-ink">Topic</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FEEDBACK_TOPICS.map((t) => (
                    <span key={t.value} className="rounded-full px-3.5 py-2 text-sm text-muted ring-1 ring-white/10">
                      {t.label}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm font-semibold text-ink">Your feedback</p>
                <div className="mt-2 h-32 rounded-xl bg-navy-950/60 ring-1 ring-white/10" />
              </div>
              <p className="text-xs text-subtle">
                For the site owner: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as server environment variables, run
                supabase/migrations/0001_feedback.sql once, then redeploy. See README.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ShieldCheck aria-hidden="true" className="size-5 text-success" /> How we use your feedback
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>We store your topic, rating, message and, only if you add it, your email.</li>
              <li>We also store which page you came from and your browser type, to help fix bugs.</li>
              <li>Only the Slushy Markets team can read submissions. They are never public.</li>
              <li>Your email is used only to reply, never for marketing.</li>
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-subtle">
              <Lock aria-hidden="true" className="size-3.5" />
              No account, no wallet address and no tracking required.
            </p>
          </div>
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-ink">Need ideas?</h2>
            <p className="mt-2 text-sm text-muted">Try the lesson or the Audio Lab first, then tell us how it felt.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/learn/candlesticks-and-volume" size="sm" variant="secondary">
                Lesson
              </ButtonLink>
              <ButtonLink href="/audio-lab" size="sm" variant="secondary">
                Audio Lab
              </ButtonLink>
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}

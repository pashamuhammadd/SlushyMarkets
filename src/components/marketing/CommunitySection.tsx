import { MessageCircleHeart, ShieldCheck, X } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { SpeechBubble } from "./SpeechBubble";

const promises = ["No wallet connection", "No tokens or points", "No buy or sell signals", "No sign up to learn"];

export function CommunitySection() {
  return (
    <section aria-labelledby="community-title">
      <Container className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="panel panel-glow relative flex flex-col gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex-1">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
              <MessageCircleHeart aria-hidden="true" className="size-4" />
              Community and feedback
            </p>
            <h2 id="community-title" className="text-2xl font-semibold text-ink sm:text-3xl">
              Help shape SlushyMarkets
            </h2>
            <p className="mt-2 max-w-lg text-muted">
              Tell us what clicked, what confused you and which lesson you want next. Real feedback from learners decides
              what gets built.
            </p>
            <ButtonLink href="/feedback" className="mt-5">
              Share feedback
            </ButtonLink>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2 self-center">
            <SpeechBubble>Good ideas?</SpeechBubble>
            <Mascot pose="cool" sizes="128px" className="w-28 sm:w-32" />
          </div>
        </div>

        <div className="panel p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
            <ShieldCheck aria-hidden="true" className="size-5 text-success" />
            Education first
          </h2>
          <p className="mt-2 text-sm text-muted">SlushyMarkets teaches how charts work. It is not an exchange or a signal service.</p>
          <ul className="mt-4 space-y-2.5">
            {promises.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-ink">
                <span className="grid size-5 place-items-center rounded-full bg-danger/15 ring-1 ring-danger/40">
                  <X aria-hidden="true" className="size-3 text-danger" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

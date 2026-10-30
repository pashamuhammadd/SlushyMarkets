import { ArrowRight, GraduationCap } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { CandleVolumePreview } from "@/components/lessons/CandleVolumePreview";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeading } from "@/components/ui/Section";
import { SpeechBubble } from "./SpeechBubble";

export function LessonPreviewSection() {
  return (
    <section aria-labelledby="lesson-preview-title" className="scroll-mt-24" id="lesson-preview">
      <Container>
        <div className="panel panel-glow p-4 sm:p-6 lg:p-8">
          <SectionHeading
            id="lesson-preview-title"
            icon={<GraduationCap className="size-5" />}
            title="Interactive lesson preview"
            description="Press Play and watch candles form while volume builds at the prices where trades actually happened."
            action={
              <ButtonLink href="/learn/candlesticks-and-volume" variant="secondary" size="sm">
                About this lesson
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
            }
          />
          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[200px_1fr]">
            <div className="hidden flex-col items-center gap-3 xl:flex">
              <SpeechBubble>Watch volume build where trades happen!</SpeechBubble>
              <Mascot pose="trading" sizes="200px" className="w-48" />
            </div>
            <CandleVolumePreview />
          </div>
        </div>
      </Container>
    </section>
  );
}

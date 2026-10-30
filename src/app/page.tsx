import { CommunitySection } from "@/components/marketing/CommunitySection";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { LearningPath } from "@/components/marketing/LearningPath";
import { LessonPreviewSection } from "@/components/marketing/LessonPreviewSection";
import { ThreeTrendsSection } from "@/components/marketing/ThreeTrendsSection";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <Hero />
      <FeatureCards />
      <LessonPreviewSection />
      <ThreeTrendsSection />
      <HowItWorks />
      <LearningPath />
      <CommunitySection />
    </div>
  );
}

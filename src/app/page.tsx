import type { Metadata } from "next";
import { CommunitySection } from "@/components/marketing/CommunitySection";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { LearningPath } from "@/components/marketing/LearningPath";
import { LessonPreviewSection } from "@/components/marketing/LessonPreviewSection";
import { ThreeTrendsSection } from "@/components/marketing/ThreeTrendsSection";
import { defaultOpenGraph } from "@/lib/site";

// The homepage keeps the default title from the root layout and declares its own canonical URL.
// openGraph is passed in full because Next.js replaces, not merges, the parent's openGraph object.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: defaultOpenGraph("/"),
};

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

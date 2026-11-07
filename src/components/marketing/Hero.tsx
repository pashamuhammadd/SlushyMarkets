import { ArrowRight, AudioLines, BarChart3, GraduationCap, PlayCircle, UserRoundCheck } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

const highlights = [
  { icon: GraduationCap, label: "Beginner friendly" },
  { icon: BarChart3, label: "Visual learning" },
  { icon: AudioLines, label: "Sound experiments" },
  { icon: UserRoundCheck, label: "No sign up needed" },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <Container className="relative grid items-center gap-8 pb-10 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-16 lg:pt-16">
        <div className="animate-fade-up">
          <p className="mb-4 font-display text-lg font-semibold tracking-tight sm:text-xl">
            <span className="text-gradient-ice">Slushy</span>
            <span className="text-gradient-neon">Markets</span>
          </p>
          <Badge tone="cyan" className="mb-5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-cyan" />
            Early preview · Free to explore
          </Badge>
          <h1 id="hero-title" className="text-[2.6rem] font-bold leading-[1.02] text-ink sm:text-6xl lg:text-[4.1rem]">
            Learn trading through <span className="text-gradient-ice">visuals</span> and{" "}
            <span className="text-gradient-neon">sound.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Watch candles and volume form one trade at a time, hear market trends as music and check your understanding
            with quick exercises. Made for curious beginners, guided by LiquiditySlushy.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/learn" size="lg">
              Start Learning
              <ArrowRight aria-hidden="true" className="size-5" />
            </ButtonLink>
            <ButtonLink href="/explore" size="lg" variant="secondary">
              <PlayCircle aria-hidden="true" className="size-5 text-cyan" />
              Explore Demo
            </ButtonLink>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-muted sm:flex sm:flex-wrap sm:gap-x-6">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4 text-violet-soft" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgb(55_213_250/0.35),rgb(139_92_246/0.22)_45%,transparent_70%)] blur-2xl"
          />
          <Mascot
            pose="heroScene"
            priority
            sizes="(min-width: 1024px) 560px, 90vw"
            className="relative w-full [mask-image:radial-gradient(ellipse_70%_68%_at_55%_52%,black_55%,transparent_100%)]"
          />
          <p
            aria-hidden="true"
            className="absolute -bottom-2 right-2 hidden rotate-[-5deg] rounded-2xl border border-magenta/30 bg-navy-900/85 px-4 py-2.5 font-display text-base leading-tight text-ink shadow-glow-violet backdrop-blur sm:block"
          >
            Small trades.
            <br />
            Big dreams.
            <br />
            <span className="text-gradient-neon">Slushy vibes.</span>
          </p>
        </div>
      </Container>
    </section>
  );
}

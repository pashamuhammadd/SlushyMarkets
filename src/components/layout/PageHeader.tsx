import type { ReactNode } from "react";
import { BrandImage, Mascot, type MascotPose } from "@/components/brand/Mascot";
import { Container } from "@/components/ui/Section";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  pose?: MascotPose;
  children?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, pose, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <BrandImage name="deco-ice-crystals" sizes="200px" className="deco-drift pointer-events-none absolute right-[22%] top-3 hidden h-auto w-44 lg:block" />
      <Container className="relative flex flex-col items-start gap-6 pb-8 pt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-14">
        <div className="max-w-2xl animate-fade-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">{eyebrow}</p>
          <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-3 text-base text-muted sm:text-lg">{description}</p>
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
        {pose ? (
          <div className="enter-pop -mt-2 w-24 shrink-0 self-end sm:mt-0 sm:w-32 sm:self-center lg:w-40">
            <Mascot pose={pose} priority sizes="(min-width: 1024px) 160px, 128px" className="w-full" />
          </div>
        ) : null}
      </Container>
    </section>
  );
}

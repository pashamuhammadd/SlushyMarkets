import type { ReactNode } from "react";
import { Mascot, type MascotPose } from "@/components/brand/Mascot";
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
      <Container className="relative flex flex-col items-start gap-6 pb-8 pt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-14">
        <div className="max-w-2xl animate-fade-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">{eyebrow}</p>
          <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-3 text-base text-muted sm:text-lg">{description}</p>
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
        {pose ? <Mascot pose={pose} priority sizes="160px" className="hidden w-32 shrink-0 sm:block lg:w-40" /> : null}
      </Container>
    </section>
  );
}

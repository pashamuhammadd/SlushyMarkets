import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

type SectionHeadingProps = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2";
};

export function SectionHeading({ id, eyebrow, title, description, icon, action, as: Tag = "h2" }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3.5">
        {icon ? (
          <span
            aria-hidden="true"
            className="mt-1 grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-cyan/25 to-violet/25 text-cyan ring-1 ring-cyan/30"
          >
            {icon}
          </span>
        ) : null}
        <div>
          {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">{eyebrow}</p> : null}
          <Tag id={id} className="text-2xl font-semibold text-ink sm:text-3xl">
            {title}
          </Tag>
          {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { cn } from "@/lib/cn";

/** Honest "not built yet" notice. Used instead of fake buttons or fake success states. */
export function StatusNotice({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("flex gap-3 rounded-2xl border border-violet/35 bg-violet/10 p-4 sm:p-5", className)}>
      <Construction aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-violet-soft" />
      <div className="text-sm">
        <p className="font-semibold text-ink">{title}</p>
        <div className="mt-1 space-y-2 text-muted">{children}</div>
      </div>
    </div>
  );
}

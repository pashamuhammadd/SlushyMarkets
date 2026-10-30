import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "cyan" | "violet" | "magenta" | "success" | "danger" | "neutral" | "gold";

const tones: Record<BadgeTone, string> = {
  cyan: "border-cyan/40 bg-cyan/10 text-cyan-soft",
  violet: "border-violet/45 bg-violet/15 text-violet-soft",
  magenta: "border-magenta/45 bg-magenta/10 text-magenta",
  success: "border-success/45 bg-success/10 text-success",
  danger: "border-danger/45 bg-danger/10 text-danger",
  gold: "border-gold/45 bg-gold/10 text-gold",
  neutral: "border-white/15 bg-white/5 text-muted",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

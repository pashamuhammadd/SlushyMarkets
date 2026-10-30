import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Mascot speech bubble. Tail points down by default, toward the mascot below it. */
export function SpeechBubble({
  children,
  tail = "bottom",
  className,
}: {
  children: ReactNode;
  tail?: "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "relative rounded-2xl border border-cyan/30 bg-navy-800/90 px-3.5 py-2.5 text-center font-display text-sm font-medium leading-snug text-ink shadow-glow-cyan",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-3 rotate-45 border-cyan/30 bg-navy-800",
          tail === "bottom" && "-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r",
          tail === "left" && "-left-1.5 top-1/2 -translate-y-1/2 border-b border-l",
          tail === "right" && "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t",
        )}
      />
    </p>
  );
}

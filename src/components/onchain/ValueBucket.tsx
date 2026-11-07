import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";

type ValueBucketProps = {
  label: string;
  valueUsd: number;
  /** The value that fills the bucket to the top. */
  maxUsd: number;
  tone: "cyan" | "magenta" | "violet" | "mint";
  caption?: string;
  hidden?: boolean;
  className?: string;
};

const fills = {
  cyan: "from-cyan/90 to-electric/80",
  magenta: "from-magenta/90 to-violet/80",
  violet: "from-violet/90 to-electric/70",
  mint: "from-success/90 to-cyan/70",
};

/** A liquid filled bucket: the fill height shows a dollar value. The number is always printed too. */
export function ValueBucket({ label, valueUsd, maxUsd, tone, caption, hidden = false, className }: ValueBucketProps) {
  const pct = maxUsd > 0 ? Math.min(Math.max(valueUsd / maxUsd, 0), 1) * 100 : 0;
  return (
    <figure className={cn("flex flex-col items-center gap-2", className)}>
      <div
        aria-hidden="true"
        className="relative h-40 w-24 overflow-hidden rounded-b-[2rem] rounded-t-lg border-2 border-white/20 bg-navy-950/70 sm:h-48 sm:w-28"
      >
        <div
          className={cn("absolute inset-x-0 bottom-0 bg-linear-to-t transition-[height] duration-500 motion-reduce:transition-none", fills[tone])}
          style={{ height: hidden ? "0%" : `${pct}%` }}
        >
          <div className="absolute inset-x-0 top-0 h-2 bg-white/25" />
        </div>
        {hidden ? <span className="absolute inset-0 grid place-items-center text-2xl text-subtle">?</span> : null}
      </div>
      <figcaption className="text-center">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block font-display text-lg tabular-nums text-ink">{hidden ? "Hidden" : formatUsd(valueUsd)}</span>
        {caption ? <span className="block text-xs text-subtle">{caption}</span> : null}
      </figcaption>
    </figure>
  );
}

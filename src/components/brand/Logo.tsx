import Link from "next/link";
import { site } from "@/lib/site";
import { Mascot } from "./Mascot";

type LogoProps = {
  /** Show "a Liquidity joke" under the name. Off in the navbar where space is tight. */
  withTagline?: boolean;
};

export function Logo({ withTagline = false }: LogoProps) {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-xl" aria-label={`${site.fullName}, home`}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-navy-700/80 ring-1 ring-cyan/30 transition group-hover:ring-cyan/60">
        <Mascot pose="happy" decorative sizes="32px" className="w-8" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-tight">
          <span className="text-gradient-ice">Slushy</span> <span className="text-ink">Markets</span>
        </span>
        {withTagline ? (
          <span className="mt-1 text-xs font-medium tracking-wide text-violet-soft">{site.brandTagline}</span>
        ) : null}
      </span>
    </Link>
  );
}

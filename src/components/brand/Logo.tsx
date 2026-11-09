import Link from "next/link";
import { site } from "@/lib/site";
import { Mascot } from "./Mascot";

/** SlushyMarkets wordmark: one word, with "Slushy" in the icy gradient. */
export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-xl" aria-label={`${site.name}, home`}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-navy-700/80 ring-1 ring-cyan/30 transition group-hover:ring-cyan/60">
        <Mascot pose="headHappy" decorative sizes="32px" className="logo-head h-8 w-auto" />
      </span>
      <span className="font-display text-xl font-semibold leading-none tracking-tight">
        <span className="text-gradient-ice">Slushy</span>
        <span className="text-ink">Markets</span>
      </span>
    </Link>
  );
}

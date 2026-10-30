import Link from "next/link";
import { Mascot } from "./Mascot";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-xl" aria-label="SlushyMarkets home">
      <span className="relative grid size-10 place-items-center rounded-xl bg-navy-700/80 ring-1 ring-cyan/30 transition group-hover:ring-cyan/60">
        <Mascot pose="happy" decorative sizes="32px" className="w-8" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        <span className="text-gradient-ice">Slushy</span>
        <span className="text-ink">Markets</span>
      </span>
    </Link>
  );
}

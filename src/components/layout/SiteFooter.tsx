import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { mainNav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-navy-950/60">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1.4fr] lg:px-8">
        <div className="space-y-4">
          <Logo withTagline />
          <p className="max-w-sm text-sm text-muted">
            Learn how charts form, one trade at a time. Visual lessons, sound experiments and short exercises for curious
            beginners.
          </p>
          <p className="text-xs text-subtle">Early preview. Lessons are being added step by step.</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Explore</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted transition hover:text-cyan">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Education only</h2>
          <p className="text-sm text-muted">
            {site.name} is an educational project. Nothing on this site is financial advice, a trading signal or a
            recommendation to buy or sell anything. Charts and sounds use simulated data unless clearly labeled otherwise.
          </p>
          <p className="text-sm text-muted">
            Questions or ideas?{" "}
            <Link href="/feedback" className="font-medium text-cyan underline-offset-4 hover:underline">
              Share feedback
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © 2026 {site.fullName}. Built by {site.studio} with {site.owner}.
          </p>
          <p>{site.mascot} is the official {site.name} mascot.</p>
        </div>
      </div>
    </footer>
  );
}

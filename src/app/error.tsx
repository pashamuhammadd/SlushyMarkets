"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { buttonClasses } from "@/components/ui/Button";

/** Friendly fallback when a page section fails. Header and footer stay usable. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center">
      <Mascot pose="sad" sizes="128px" className="w-28" />
      <h1 className="mt-6 text-4xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">
        This part of SlushyMarkets did not load. Please try again. If it keeps happening, tell us on the feedback page.
      </p>
      {digest ? <p className="mt-2 text-xs text-subtle">Error reference: {digest}</p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonClasses("primary", "md")}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Try again
        </button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

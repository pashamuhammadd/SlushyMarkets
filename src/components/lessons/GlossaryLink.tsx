import Link from "next/link";
import { BookA } from "lucide-react";
import { GLOSSARY } from "@/data/glossary";

/** Link from a lesson to its section of the glossary on /explore. */
export function GlossaryLink({ section }: { section: string }) {
  const entry = GLOSSARY.find((s) => s.id === section);
  if (!entry) return null;
  return (
    <p className="mt-3 text-sm text-muted">
      <BookA aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px] text-cyan" />
      New words? Look them up in the{" "}
      <Link href={{ pathname: "/explore", hash: entry.id }} className="font-semibold text-cyan underline-offset-4 hover:underline">
        {entry.title.toLowerCase()} glossary
      </Link>
      .
    </p>
  );
}

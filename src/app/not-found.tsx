import type { Metadata } from "next";
import { Mascot } from "@/components/brand/Mascot";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <Mascot pose="lostMap" sizes="128px" className="w-28" />
      <h1 className="mt-6 text-4xl font-bold text-ink">This page melted away</h1>
      <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/learn" variant="secondary">
          Browse lessons
        </ButtonLink>
      </div>
    </Container>
  );
}

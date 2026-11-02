import type { Route } from "next";

export const site = {
  name: "SlushyMarkets",
  url: "https://slushymarkets.com",
  tagline: "Learn trading through visuals and sound.",
  description:
    "SlushyMarkets is a beginner friendly trading education site. Watch candles and volume form from simulated trades, hear trends as music and check your understanding with short exercises.",
  studio: "Nimia Studio",
} as const;

export type NavItem = {
  label: string;
  href: Route;
};

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "Explore", href: "/explore" },
  { label: "Audio Lab", href: "/audio-lab" },
  { label: "Feedback", href: "/feedback" },
];

/** Social preview image (1200 x 630) built from the official mascot artwork. */
export const socialImage = {
  url: "/images/og-slushymarkets.jpg",
  width: 1200,
  height: 630,
  alt: "LiquiditySlushy, the SlushyMarkets mascot, sitting on a rock with a phone next to the headline Learn trading through visuals and sound.",
};

/** Per page metadata: title, description, canonical URL and matching social preview. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }) {
  const fullTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website" as const, siteName: site.name, title: fullTitle, description, url: path, images: [socialImage] },
    twitter: { card: "summary_large_image" as const, title: fullTitle, description, images: [socialImage] },
  };
}

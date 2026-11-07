import type { Route } from "next";

export const site = {
  /** Official brand name, written as one word. Used everywhere: navbar, titles, metadata and structured data. */
  name: "SlushyMarkets",
  /** Earlier spelling, kept only as a search alias in structured data. Never shown as the brand. */
  legacyName: "SlushyMarkets",
  url: "https://slushymarkets.com",
  tagline: "Learn trading through visuals and sound.",
  description:
    "Free, beginner friendly trading lessons. Watch candles and volume form from simulated trades, hear trends as music and test yourself with short quizzes.",
  studio: "Nimia Studio",
  owner: "Slushy",
  mascot: "LiquiditySlushy",
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
  { label: "Games", href: "/games" },
  { label: "Feedback", href: "/feedback" },
];

/** Social preview image (1200 x 630) built from the official mascot artwork. */
export const socialImage = {
  url: "/images/og-slushymarkets.jpg",
  width: 1200,
  height: 630,
  alt: "LiquiditySlushy, the SlushyMarkets mascot, sitting on a rock with a phone next to the headline Learn trading through visuals and sound.",
};

/** Default title used by the homepage and as the fallback for every page. */
export const defaultTitle = `${site.name} | Learn trading through visuals and sound`;

/**
 * Complete Open Graph object for the homepage and the root layout.
 * Next.js does not deep merge metadata: a page that sets openGraph replaces the parent's object,
 * so every override must carry the image, site name and type again.
 */
export function defaultOpenGraph(url?: string) {
  return {
    type: "website" as const,
    siteName: site.name,
    locale: "en_US",
    title: defaultTitle,
    description: site.description,
    images: [socialImage],
    ...(url ? { url } : {}),
  };
}

/** Absolute URL for a site path. Used where a full URL is required (sitemap, JSON-LD). */
export function absoluteUrl(path: string = "/") {
  return path === "/" || path === "" ? site.url : `${site.url}${path}`;
}

/** Per page metadata: title, description, canonical URL and matching social preview. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }) {
  const fullTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website" as const, siteName: site.name, locale: "en_US", title: fullTitle, description, url: path, images: [socialImage] },
    twitter: { card: "summary_large_image" as const, title: fullTitle, description, images: [socialImage] },
  };
}

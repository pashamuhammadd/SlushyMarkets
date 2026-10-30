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

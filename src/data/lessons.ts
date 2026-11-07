import type { Route } from "next";

/**
 * Honest status for every module.
 * - available: the full interactive lesson with quiz is live.
 * - preview: a working interactive preview exists; the full lesson is in development.
 * - in-development: being built now, nothing interactive yet.
 * - planned: on the roadmap, not started.
 */
export type LessonStatus = "available" | "preview" | "in-development" | "planned";

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  status: LessonStatus;
  /** Only set when the route exists. */
  href?: Route;
  topics: string[];
  minutes?: number;
  icon: "candles" | "profile" | "averages" | "renko" | "sound" | "onchain";
};

export const lessons: Lesson[] = [
  {
    slug: "candlesticks-and-volume",
    title: "Candlesticks and Volume",
    summary:
      "Watch every candle form from individual trades while volume stacks up at the prices where those trades happened.",
    status: "available",
    href: "/learn/candlesticks-and-volume",
    topics: ["Open, high, low, close", "Traded volume", "Volume by price"],
    minutes: 8,
    icon: "candles",
  },
  {
    slug: "volume-profile",
    title: "Volume Profile",
    summary:
      "See where the real trading happened. Spot high volume nodes, low volume nodes and the point of control, and learn what they do not tell you.",
    status: "available",
    href: "/learn/candlesticks-and-volume",
    topics: ["High volume node", "Low volume node", "Point of control"],
    minutes: 6,
    icon: "profile",
  },
  {
    slug: "sma-vs-ema",
    title: "SMA vs EMA",
    summary:
      "Compare the two most common moving averages step by step and see why one reacts faster to recent prices.",
    status: "available",
    href: "/learn/sma-vs-ema",
    topics: ["Equal weights", "Smoothing factor", "Lag"],
    minutes: 7,
    icon: "averages",
  },
  {
    slug: "renko-bricks",
    title: "Renko Bricks",
    summary:
      "Build a chart from equal bricks that only cares how far price moved, and see how box size and reversals change the picture.",
    status: "available",
    href: "/learn/renko-bricks",
    topics: ["Box size", "Two box reversal", "Price, not time"],
    minutes: 7,
    icon: "renko",
  },
  {
    slug: "on-chain-metrics",
    title: "On-Chain Metrics",
    summary:
      "Learn SOPR and MVRV with a tiny Bitcoin world of two coins: compare what coins were worth when they moved with what they are worth today.",
    status: "available",
    href: "/learn/on-chain-metrics",
    topics: ["SOPR", "MVRV", "Realized value"],
    minutes: 12,
    icon: "onchain",
  },
  {
    slug: "three-trends-one-piano",
    title: "Learn With Sound",
    summary:
      "Three Trends, One Piano turns daily, 4 hour and 15 minute trends into one piece of music so you can hear structure.",
    status: "preview",
    href: "/audio-lab",
    topics: ["Timeframes", "Trend direction", "Listening practice"],
    icon: "sound",
  },
];

export const statusLabel: Record<LessonStatus, string> = {
  available: "Available now",
  preview: "Preview available",
  "in-development": "In development",
  planned: "Planned",
};

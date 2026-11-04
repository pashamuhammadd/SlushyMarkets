import type { Route } from "next";

export type GameStatus = "available" | "planned";

export type Game = {
  slug: string;
  title: string;
  summary: string;
  status: GameStatus;
  /** Only set when the route exists. */
  href?: Route;
  practices: string;
};

/** Educational games. Simulated data only: no real money, no wallet, no blockchain transactions. */
export const games: Game[] = [
  {
    slug: "candle-builder",
    title: "Candle Builder",
    summary: "Read the trades of one minute and pick the open, high, low and close. Five rounds, twenty points.",
    status: "available",
    href: "/games/candle-builder",
    practices: "Candlesticks and Volume",
  },
  {
    slug: "market-music",
    title: "Market Music",
    summary: "A listening game built on the Audio Lab. It waits for the final sound mapping from Slushy.",
    status: "planned",
    practices: "Audio Lab",
  },
];

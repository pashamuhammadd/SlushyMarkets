import type { MascotPose } from "@/components/brand/Mascot";
import type { NodeVisibility } from "@/components/lessons/VolumeProfileChart";
import { DEMO_TRADES, DEMO_TRADES_PER_CANDLE } from "@/data/demo-trades";

export const LESSON_ID = "candlesticks-and-volume";

/**
 * One step of the guided lesson. A chapter covers the trades after the previous
 * chapter's `end`, up to and including its own `end` (cursor values).
 */
export type Chapter = {
  id: string;
  title: string;
  /** Label for the step navigation. */
  short: string;
  body: string;
  /** Cursor (number of revealed trades) where this chapter finishes. */
  end: number;
  nodes: NodeVisibility;
  pose: MascotPose;
  /** Short hint shown in the mascot bubble. */
  tip: string;
};

const perCandle = DEMO_TRADES_PER_CANDLE;

export const CHAPTERS: Chapter[] = [
  {
    id: "one-trade",
    title: "Every chart starts with one trade",
    short: "One trade",
    body: "A trade happens when a buyer and a seller agree on a price and a quantity. Execute the first simulated trade and look at the first candle: one trade means the open, high, low and close are all the same price.",
    end: 1,
    nodes: { poc: false, high: false, low: false },
    pose: "happy",
    tip: "Press Play this step to execute trade number one.",
  },
  {
    id: "candle-shape",
    title: "A candle takes shape",
    short: "Candle shape",
    body: "More trades arrive in the same minute. The first trade is the open, the highest is the high, the lowest is the low and the latest is the close. When the minute ends, the candle is finished and a new one begins.",
    end: perCandle,
    nodes: { poc: false, high: false, low: false },
    pose: "thinking",
    tip: "Watch the open, high, low and close update on the right.",
  },
  {
    id: "volume-stays",
    title: "Volume stays where it traded",
    short: "Volume stays",
    body: "Each trade's quantity is also added to its price band. As price climbs, the candles move on, but volume already recorded stays at the prices where those trades happened. The cups show the same idea with wider $50 ranges.",
    end: perCandle * 4,
    nodes: { poc: false, high: false, low: false },
    pose: "cool",
    tip: "Price moved, but executed volume remains attributed to where trades occurred.",
  },
  {
    id: "high-volume-node",
    title: "Busy prices build a high volume node",
    short: "High volume node",
    body: "Around $64,000 buyers and sellers traded a lot for several minutes. Those bands grow long and become a high volume node. The single busiest band is the point of control (POC), shown in gold.",
    end: perCandle * 9,
    nodes: { poc: true, high: true, low: false },
    pose: "excited",
    tip: "Look for the gold bar near $64,000. That is the POC.",
  },
  {
    id: "low-volume-node",
    title: "Fast moves leave low volume nodes",
    short: "Low volume node",
    body: "Then price rose quickly with fewer trades along the way. Bands it rushed through stay short. These thin areas are low volume nodes. Both node types describe past trading only. They are not orders waiting in a book and they do not predict where price goes next.",
    end: DEMO_TRADES.length,
    nodes: { poc: true, high: true, low: true },
    pose: "toTheMoon",
    tip: "Short dark blue bars show where trading was thin.",
  },
];

/** Index of the chapter that the cursor currently belongs to. */
export function chapterIndexFor(cursor: number): number {
  const index = CHAPTERS.findIndex((chapter) => cursor <= chapter.end);
  return index === -1 ? CHAPTERS.length - 1 : index;
}

/** First cursor value of a chapter (0 for the first one). */
export function chapterStart(index: number): number {
  return index === 0 ? 0 : CHAPTERS[index - 1].end;
}

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
};

export const QUIZ: QuizQuestion[] = [
  {
    id: "q-high",
    prompt: "What is the high of a candle?",
    options: [
      { id: "a", text: "The price where the most volume traded in that interval" },
      { id: "b", text: "The highest price of any trade executed in that interval" },
      { id: "c", text: "The highest buy order waiting in the order book" },
      { id: "d", text: "The close of the previous candle plus the current volume" },
    ],
    correct: "b",
    explanation:
      "A candle summarizes executed trades in one time interval. Its high is simply the highest trade price inside that interval. The busiest price is a volume profile idea, and waiting orders are not trades.",
  },
  {
    id: "q-stays",
    prompt: "A lot of BTC trades around $64,000, then price climbs to $64,300. What happens to the volume already recorded at $64,000?",
    options: [
      { id: "a", text: "It moves up with price to $64,300" },
      { id: "b", text: "It is deleted once price leaves that level" },
      { id: "c", text: "It stays in the $64,000 band, because that is where those trades happened" },
      { id: "d", text: "It is split evenly across all prices" },
    ],
    correct: "c",
    explanation:
      "Volume by price records where trades actually executed. New trades add to the bands where they happen, but nothing already recorded moves when price moves.",
  },
  {
    id: "q-node",
    prompt: "What does a high volume node tell you?",
    options: [
      { id: "a", text: "Price is guaranteed to bounce from that level" },
      { id: "b", text: "A lot of trading already happened in that price area" },
      { id: "c", text: "Many unfilled orders are waiting there right now" },
      { id: "d", text: "That is the price where you should buy" },
    ],
    correct: "b",
    explanation:
      "A high volume node only describes the past: many trades executed in that area. It is not a guarantee, not a count of waiting orders and not trading advice.",
  },
];

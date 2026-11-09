import type { MascotPose } from "@/components/brand/Mascot";
import { MA_DEMO_CANDLES, MA_DEMO_PEAK_INDEX, MA_DEMO_RANGE_START } from "@/data/ma-demo";
import type { QuizQuestion } from "./types";

export const LESSON_ID = "sma-vs-ema";

/**
 * One step of the guided lesson. A step covers the candles after the previous step's
 * `end`, up to and including its own `end` (cursor = number of candles revealed).
 */
export type MaChapter = {
  id: string;
  title: string;
  short: string;
  body: string;
  end: number;
  /** Mark where each line first turns down after the peak. */
  showTurns: boolean;
  /** Shade the sideways range and count direction changes. */
  showRange: boolean;
  pose: MascotPose;
  tip: string;
};

export const MA_CHAPTERS: MaChapter[] = [
  {
    id: "noisy-price",
    title: "Price is noisy, averages smooth it",
    short: "Smoothing",
    body: "Every candle closes at a slightly different price, so the chart zigzags. A moving average replaces the zigzag with the average of the last N closes, where N is the period. Nothing is drawn until there are N candles to average.",
    end: 10,
    showTurns: false,
    showRange: false,
    pose: "thinking",
    tip: "Change the period and watch how many candles pass before a line appears.",
  },
  {
    id: "sma",
    title: "SMA: every candle counts the same",
    short: "SMA",
    body: "The simple moving average (SMA) adds the last N closes and divides by N. Each close inside the window has the same weight, and a close that leaves the window stops counting at once. With a period of 10, every close counts 10%.",
    end: 16,
    showTurns: false,
    showRange: false,
    pose: "happy",
    tip: "Look at the weights panel: the SMA bars are all the same height.",
  },
  {
    id: "ema",
    title: "EMA: recent candles count more",
    short: "EMA",
    body: "The exponential moving average (EMA) gives the newest close the largest share, then a little less to each older close. The share for the newest close is 2 divided by (N + 1), about 18% for a period of 10. During the climb the EMA stays closer to price than the SMA.",
    end: MA_DEMO_PEAK_INDEX + 1,
    showTurns: false,
    showRange: false,
    pose: "cool",
    tip: "The EMA bars shrink step by step going back in time.",
  },
  {
    id: "turn",
    title: "After the peak, who turns first?",
    short: "The turn",
    body: "Price reverses sharply after the peak. Because the EMA leans on recent closes, it bends down sooner. The SMA keeps averaging older, higher closes for longer, so it turns later. That delay is called lag.",
    end: MA_DEMO_RANGE_START,
    showTurns: true,
    showRange: false,
    pose: "surprised",
    tip: "The markers show the first candle where each line moved lower.",
  },
  {
    id: "range",
    title: "Sideways: quick can also mean jumpy",
    short: "Trade off",
    body: "In a choppy range the same speed works against the EMA: it follows more of the small swings and changes direction more often. The SMA is slower but calmer. Neither is better in general. The period and the type decide how much you trade smoothness for speed.",
    end: MA_DEMO_CANDLES.length,
    showTurns: true,
    showRange: true,
    pose: "chill",
    tip: "Compare how often each line changes direction in the shaded area.",
  },
];

export function maChapterIndexFor(cursor: number): number {
  const index = MA_CHAPTERS.findIndex((chapter) => cursor <= chapter.end);
  return index === -1 ? MA_CHAPTERS.length - 1 : index;
}

export function maChapterStart(index: number): number {
  return index === 0 ? 0 : MA_CHAPTERS[index - 1].end;
}

export const MA_COMPLETION = "Great work. You can explain how SMA and EMA weigh prices differently and why one reacts faster.";

export const MA_QUIZ: QuizQuestion[] = [
  {
    id: "q-sma-calc",
    prompt: "The last three closes are $100, $103 and $106. What is the 3 period SMA?",
    options: [
      { id: "a", text: "$103" },
      { id: "b", text: "$104.50" },
      { id: "c", text: "$106" },
      { id: "d", text: "$309" },
    ],
    correct: "a",
    explanation: "Add the three closes and divide by three: (100 + 103 + 106) / 3 = 309 / 3 = $103. Each close counts exactly one third.",
  },
  {
    id: "q-why-faster",
    prompt: "With the same period, why does an EMA react faster than an SMA?",
    options: [
      { id: "a", text: "It uses more candles than the SMA" },
      { id: "b", text: "It gives more weight to the most recent closes" },
      { id: "c", text: "It looks ahead at future prices" },
      { id: "d", text: "It ignores the close and uses the high instead" },
    ],
    correct: "b",
    explanation:
      "Both use closes from the past only. The EMA simply leans on the newest ones, so a fresh move shows up in it sooner. Nothing in either average looks into the future.",
  },
  {
    id: "q-weights",
    prompt: "With a period of 10, how much does the newest close count in the SMA and in the EMA?",
    options: [
      { id: "a", text: "10% in both" },
      { id: "b", text: "About 18% in the SMA and 10% in the EMA" },
      { id: "c", text: "10% in the SMA and about 18% in the EMA" },
      { id: "d", text: "100% in the SMA and 50% in the EMA" },
    ],
    correct: "c",
    explanation:
      "The SMA splits the weight evenly: 1 / 10 = 10%. The EMA gives the newest close 2 / (10 + 1), which is about 18%, and less to every older close.",
  },
  {
    id: "q-trade-off",
    prompt: "Price is moving sideways in a choppy range. What is a common downside of the faster EMA?",
    options: [
      { id: "a", text: "It stops updating until a trend starts" },
      { id: "b", text: "It always lags more than the SMA" },
      { id: "c", text: "It follows more of the small swings and changes direction more often" },
      { id: "d", text: "It tells you exactly where price will go next" },
    ],
    correct: "c",
    explanation:
      "Reacting quickly helps in a clean move but also means reacting to noise. In a range the EMA tends to wiggle more. No moving average predicts price. They summarize what already happened.",
  },
];

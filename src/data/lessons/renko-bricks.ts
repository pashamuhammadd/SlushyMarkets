import type { MascotPose } from "@/components/brand/Mascot";
import { RENKO_PHASES } from "@/data/renko-demo";
import type { QuizQuestion } from "./types";

export const LESSON_ID = "renko-bricks";

/**
 * One step of the guided lesson. A step covers the candles after the previous step's
 * `end`, up to and including its own `end` (cursor = number of candles revealed).
 */
export type RenkoChapter = {
  id: string;
  title: string;
  short: string;
  body: string;
  end: number;
  /** Shade a span of candles on the time chart. */
  zone?: { start: number; end: number; label: string };
  /** Draw the next up and next down levels on the brick chart. */
  showThresholds: boolean;
  /** Show the brick count for every box size. */
  compareBoxes: boolean;
  pose: MascotPose;
  tip: string;
};

const { climb, quiet, spike, slide, finish } = RENKO_PHASES;

export const RENKO_CHAPTERS: RenkoChapter[] = [
  {
    id: "price-not-time",
    title: "Bricks count price, not time",
    short: "Price, not time",
    body: "A candle closes every hour, whatever price does. A Renko brick appears only when the close has moved a full box size (the default is $100) beyond the last brick. Each brick is the same height, and the bottom axis counts bricks instead of hours.",
    end: climb.end,
    showThresholds: true,
    compareBoxes: false,
    pose: "thinking",
    tip: "Watch the cyan last close line climb toward the green Next up level.",
  },
  {
    id: "quiet",
    title: "Small moves draw nothing",
    short: "Quiet hours",
    body: "For sixteen hours price wanders inside a narrow range. The candle chart keeps adding candles, but with $100 boxes no close gets a full box away, so the Renko chart does not change at all. Renko hides small noise and also hides how long a quiet period lasted.",
    end: quiet.end,
    zone: { start: quiet.start, end: quiet.end, label: "Quiet range" },
    showThresholds: true,
    compareBoxes: false,
    pose: "chill",
    tip: "Candles keep printing. Bricks wait.",
  },
  {
    id: "spike",
    title: "One big move, many bricks",
    short: "Spike",
    body: "Then price jumps hundreds of dollars in two hours. A single close can complete several bricks at once, so a fast move looks like a staircase. The outlined candle on the time chart is the one that completed the newest brick.",
    end: spike.end,
    zone: { start: spike.start, end: spike.end, label: "Spike" },
    showThresholds: true,
    compareBoxes: false,
    pose: "toTheMoon",
    tip: "Count how many bricks the last candle added.",
  },
  {
    id: "reversal",
    title: "Turning around takes two boxes",
    short: "Reversal",
    body: "When price slides lower, the first down brick does not appear after a one box drop. In classic Renko a reversal needs the close to fall two boxes below the top of the last up brick. After that, each further box lower adds another down brick.",
    end: slide.end,
    showThresholds: true,
    compareBoxes: false,
    pose: "surprised",
    tip: "The red Next down level sits two boxes under the top until the first down brick forms.",
  },
  {
    id: "box-size",
    title: "Box size decides what counts as a move",
    short: "Box size",
    body: "In the choppy finish, price swings about $150 back and forth. With $50 boxes every swing flips the bricks. With $100 or $200 boxes nothing new appears. A small box shows more detail and more noise; a large box is calmer but reacts later. Try each size.",
    end: finish.end,
    zone: { start: finish.start, end: finish.end, label: "Choppy finish" },
    showThresholds: true,
    compareBoxes: true,
    pose: "cool",
    tip: "Switch the box size and compare the brick counts.",
  },
];

export function renkoChapterIndexFor(cursor: number): number {
  const index = RENKO_CHAPTERS.findIndex((chapter) => cursor <= chapter.end);
  return index === -1 ? RENKO_CHAPTERS.length - 1 : index;
}

export function renkoChapterStart(index: number): number {
  return index === 0 ? 0 : RENKO_CHAPTERS[index - 1].end;
}

export const RENKO_COMPLETION = "Great work. You can explain how Renko bricks form from price movement instead of time.";

export const RENKO_QUIZ: QuizQuestion[] = [
  {
    id: "q-next-up",
    prompt: "Box size $100. The last brick is an up brick from $63,900 to $64,000. The next close is $64,080. What happens?",
    options: [
      { id: "a", text: "A new up brick from $64,000 to $64,100" },
      { id: "b", text: "Nothing yet, the close must reach $64,100" },
      { id: "c", text: "A down brick, because price did not rise a full box" },
      { id: "d", text: "A smaller brick of $80" },
    ],
    correct: "b",
    explanation: "Every brick is exactly one box tall. The close needs to reach $64,100 before the next up brick appears. Partial moves draw nothing.",
  },
  {
    id: "q-reversal",
    prompt: "Same chart: last up brick from $63,900 to $64,000. Which close creates the first down brick?",
    options: [
      { id: "a", text: "$63,950" },
      { id: "b", text: "$63,900" },
      { id: "c", text: "$63,800" },
      { id: "d", text: "Any close below $64,000" },
    ],
    correct: "c",
    explanation:
      "A reversal needs two boxes: $64,000 minus 2 x $100 = $63,800. The first down brick then runs from $63,900 down to $63,800, starting at the bottom of the last up brick.",
  },
  {
    id: "q-axis",
    prompt: "What does the horizontal axis of a Renko chart count?",
    options: [
      { id: "a", text: "Hours, like a normal candle chart" },
      { id: "b", text: "Bricks, so you cannot read how long a move took" },
      { id: "c", text: "Traded volume" },
      { id: "d", text: "Days until the next reversal" },
    ],
    correct: "b",
    explanation:
      "Renko ignores time. Sixteen quiet hours and a two hour spike can look very different on candles but are only counted in bricks on Renko. Check a time based chart when timing matters.",
  },
  {
    id: "q-box-size",
    prompt: "You switch from a $50 box to a $200 box on the same data. What usually happens?",
    options: [
      { id: "a", text: "More bricks and more reversals" },
      { id: "b", text: "Fewer bricks; small swings are filtered out, but new moves show up later" },
      { id: "c", text: "The same bricks, only taller" },
      { id: "d", text: "Renko becomes a price forecast" },
    ],
    correct: "b",
    explanation:
      "A bigger box needs a bigger move per brick, so you see fewer bricks and less noise, at the cost of reacting later. No box size predicts where price goes next.",
  },
];

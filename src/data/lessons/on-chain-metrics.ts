import type { Coin, SpentOutput } from "@/lib/onchain/metrics";
import type { QuizQuestion } from "./types";

/**
 * Content for the On-Chain Metrics lessons. The worked examples follow Slushy's
 * On-Chain Basics and SOPR Bucket prototypes. All numbers are invented for teaching.
 */

export const SOPR_LESSON_ID = "on-chain-sopr";
export const MVRV_LESSON_ID = "on-chain-mvrv";

/** Seed for the invented SOPR timeline, so everyone sees the same line. */
export const SOPR_TIMELINE_SEED = 20261108;

/** The two coin story: Coin A last moved at $40,000, Coin B at $60,000. */
export const TWO_COINS: readonly Coin[] = [
  { id: "a", label: "Coin A", amountBtc: 1, lastMovedPriceUsd: 40_000 },
  { id: "b", label: "Coin B", amountBtc: 1, lastMovedPriceUsd: 60_000 },
];

export const PRICE_SLIDER = { min: 25_000, max: 100_000, step: 5_000 } as const;

/** SOPR explorer defaults: Coin A created at $40,000 and spent at $75,000. */
export const SOPR_DEFAULTS = { createdUsd: 40_000, spentUsd: 75_000 } as const;

/** MVRV explorer starts just before Coin A moves, with BTC at $50,000. */
export const MVRV_START_PRICE = 50_000;

/** Bucket rounds from Slushy's SOPR Bucket Lesson: two outputs, value when created and when spent. */
export const SOPR_BUCKET_ROUNDS: readonly { label: string; outputs: readonly [SpentOutput, SpentOutput] }[] = [
  {
    label: "Example 1",
    outputs: [
      { createdUsd: 200, spentUsd: 400 },
      { createdUsd: 500, spentUsd: 400 },
    ],
  },
  {
    label: "Example 2",
    outputs: [
      { createdUsd: 200, spentUsd: 300 },
      { createdUsd: 600, spentUsd: 350 },
    ],
  },
  {
    label: "Example 3",
    outputs: [
      { createdUsd: 300, spentUsd: 400 },
      { createdUsd: 500, spentUsd: 400 },
    ],
  },
];

export const SOPR_COMPLETION =
  "Great job! You've completed the SOPR part of On-Chain Metrics and learned how blockchain analysis compares what moved Bitcoin was worth when created and when spent.";

export const MVRV_COMPLETION =
  "Great job! You've completed the On-Chain Metrics lesson and learned how SOPR and MVRV help explain Bitcoin's blockchain activity and valuation.";

/** Slushy's corrections, shown word for word in the lessons. */
export const SPEND_IS_NOT_A_SALE = "Moving BTC between your own wallets also counts as a blockchain spend. It does not necessarily mean someone sold.";
export const LAST_MOVED_IS_NOT_PAID = "This uses the price when coins last moved, not necessarily the price their owners actually paid.";

export const SOPR_QUIZ: QuizQuestion[] = [
  {
    id: "q-sopr-calc",
    prompt: "A coin was worth $40,000 when its output was created and $30,000 when it was spent. What is its SOPR?",
    options: [
      { id: "a", text: "0.75" },
      { id: "b", text: "1.33" },
      { id: "c", text: "1.00" },
      { id: "d", text: "10,000" },
    ],
    correct: "a",
    explanation: "SOPR divides the value when spent by the value when created: $30,000 / $40,000 = 0.75. Below 1.0 means it was spent for less than it was worth when created.",
  },
  {
    id: "q-sopr-one",
    prompt: "What does a SOPR of exactly 1.0 mean?",
    options: [
      { id: "a", text: "Price will go up tomorrow" },
      { id: "b", text: "The spent coins were worth the same as when they were created" },
      { id: "c", text: "No coins moved today" },
      { id: "d", text: "Every coin in existence is in profit" },
    ],
    correct: "b",
    explanation: "1.0 is the break even line: the total value when spent equals the total value when created. It describes coins that moved, not the future.",
  },
  {
    id: "q-sopr-who",
    prompt: "Only Coin A moves today. Coin B stays in its wallet. Which coins count in today's SOPR?",
    options: [
      { id: "a", text: "Both coins" },
      { id: "b", text: "Only Coin B" },
      { id: "c", text: "Only Coin A" },
      { id: "d", text: "Neither, SOPR uses the market price only" },
    ],
    correct: "c",
    explanation: "SOPR only looks at outputs that were spent in the period. A coin that does not move is not part of the calculation.",
  },
  {
    id: "q-sopr-limit",
    prompt: "Why should you be careful reading SOPR as a profit and loss score?",
    options: [
      { id: "a", text: "Because SOPR is only updated once a year" },
      { id: "b", text: "Because a spend can be a transfer between someone's own wallets, not a sale" },
      { id: "c", text: "Because SOPR is calculated from the order book" },
      { id: "d", text: "Because SOPR ignores the price when coins were created" },
    ],
    correct: "b",
    explanation: "Moving BTC between your own wallets also counts as a blockchain spend. It does not necessarily mean someone sold. Data providers try to filter some of these moves, but SOPR is still an estimate, not a list of trades.",
  },
  {
    id: "q-sopr-own-wallets",
    prompt: "Sam moves 1 BTC from one of Sam's wallets to another of Sam's wallets. What does the blockchain show?",
    options: [
      { id: "a", text: "A spend, even though nobody sold anything" },
      { id: "b", text: "Nothing, transfers to yourself are never recorded" },
      { id: "c", text: "Proof that Sam sold 1 BTC" },
      { id: "d", text: "Proof that someone else bought 1 BTC" },
    ],
    correct: "a",
    explanation: "The old output is spent and a new one is created, so the move is recorded. The blockchain shows that coins moved. It does not show why, so a spend alone does not prove a sale.",
  },
];

export const MVRV_QUIZ: QuizQuestion[] = [
  {
    id: "q-mvrv-calc",
    prompt: "Two coins last moved at $40,000 and $60,000. BTC is now $75,000. What is MVRV?",
    options: [
      { id: "a", text: "1.50" },
      { id: "b", text: "0.67" },
      { id: "c", text: "1.25" },
      { id: "d", text: "1.88" },
    ],
    correct: "a",
    explanation: "Market value is 2 x $75,000 = $150,000. Realized value is $40,000 + $60,000 = $100,000. MVRV = $150,000 / $100,000 = 1.50.",
  },
  {
    id: "q-mvrv-price",
    prompt: "BTC price rises, but no coin moves. What happens?",
    options: [
      { id: "a", text: "Market value rises, realized value stays the same, so MVRV rises" },
      { id: "b", text: "Both rise by the same amount, so MVRV stays the same" },
      { id: "c", text: "Realized value rises, market value stays the same" },
      { id: "d", text: "Nothing changes until a coin moves" },
    ],
    correct: "a",
    explanation: "Market value always uses today's price. Realized value only changes when a coin moves, because it uses each coin's last moved price.",
  },
  {
    id: "q-mvrv-move",
    prompt: "Coin A last moved at $40,000 and now moves at $75,000. What happens to realized value?",
    options: [
      { id: "a", text: "It falls by $35,000" },
      { id: "b", text: "It rises by $35,000" },
      { id: "c", text: "It does not change" },
      { id: "d", text: "It becomes equal to market value forever" },
    ],
    correct: "b",
    explanation: "Coin A is now valued at $75,000 instead of $40,000 in the realized bucket, so realized value rises by $35,000 and MVRV moves closer to 1.0.",
  },
  {
    id: "q-mvrv-limit",
    prompt: "Which statement about MVRV is fair?",
    options: [
      { id: "a", text: "An MVRV above a fixed number always marks the top" },
      { id: "b", text: "Lost coins and old levels can distort it, so it is context, not a signal" },
      { id: "c", text: "MVRV measures how much people traded today" },
      { id: "d", text: "MVRV below 1 means BTC is guaranteed to rise" },
    ],
    correct: "b",
    explanation: "Lost coins keep their old realized price, levels that mattered in past cycles may not repeat, and the ratio says nothing about timing. It describes the market, it does not predict it.",
  },
  {
    id: "q-mvrv-paid",
    prompt: "Dana bought 1 BTC at $30,000, then moved it to a new wallet when BTC was $70,000. Which price does realized value use for that coin?",
    options: [
      { id: "a", text: "$30,000, because that is what Dana paid" },
      { id: "b", text: "$70,000, because that is the price when the coin last moved" },
      { id: "c", text: "Today's price, whatever it is" },
      { id: "d", text: "The average of the two prices" },
    ],
    correct: "b",
    explanation: "Realized value uses the price when coins last moved, not necessarily the price their owners actually paid. Dana's own wallet transfer reset the coin's realized price to $70,000.",
  },
];

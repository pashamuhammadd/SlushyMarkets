import type { Route } from "next";

/**
 * Plain English glossary shown on /explore. Each term has a stable `id` used as a URL anchor
 * (for example /explore#renko-brick), so lessons and other pages can link to a definition.
 * Definitions describe how the terms are used in these lessons, not trading advice.
 */
export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
};

export type GlossarySection = {
  id: string;
  title: string;
  /** Lesson where these terms are taught, when one exists. */
  lesson?: { label: string; href: Route };
  terms: GlossaryTerm[];
};

export const GLOSSARY: GlossarySection[] = [
  {
    id: "candles-and-volume",
    title: "Candles and volume",
    lesson: { label: "Candlesticks and Volume", href: "/learn/candlesticks-and-volume" },
    terms: [
      { id: "trade", term: "Trade", definition: "One completed exchange between a buyer and a seller at a single price and quantity." },
      { id: "candle", term: "Candle", definition: "A summary of all trades in one time interval, drawn from its open, high, low and close." },
      { id: "ohlc", term: "OHLC", definition: "Open, high, low and close: the first, highest, lowest and last trade prices of an interval." },
      { id: "volume", term: "Volume", definition: "The total quantity traded. Here it is measured in BTC for a simulated BTC-like market." },
      {
        id: "volume-by-price",
        term: "Volume by price",
        definition: "Executed volume grouped into price bands instead of time intervals. Also called a volume profile.",
      },
      { id: "high-volume-node", term: "High volume node", definition: "A price band where a lot of trading happened compared to its neighbors." },
      {
        id: "low-volume-node",
        term: "Low volume node",
        definition: "A price band where little trading happened, often because price moved through it quickly.",
      },
      { id: "point-of-control", term: "Point of control", definition: "The single price band with the most executed volume in the selected data." },
      {
        id: "order-book-liquidity",
        term: "Order book liquidity",
        definition: "Orders still waiting to be filled. Different from executed volume, which has already traded.",
      },
    ],
  },
  {
    id: "moving-averages",
    title: "Moving averages",
    lesson: { label: "SMA vs EMA", href: "/learn/sma-vs-ema" },
    terms: [
      {
        id: "moving-average",
        term: "Moving average",
        definition: "The average of the last N closing prices, recalculated on every new candle so it moves along with the chart.",
      },
      { id: "period", term: "Period", definition: "How many candles a moving average looks back over. A shorter period reacts faster, a longer one is smoother." },
      {
        id: "sma",
        term: "SMA (simple moving average)",
        definition: "The plain mean of the last N closes. Every close in the window counts the same, 1 / N.",
      },
      {
        id: "ema",
        term: "EMA (exponential moving average)",
        definition: "A moving average that gives the newest close the largest share and lets older closes fade step by step.",
      },
      {
        id: "smoothing-factor",
        term: "Smoothing factor (alpha)",
        definition: "The share of the newest close in an EMA: 2 / (N + 1). About 18% for a period of 10.",
      },
      {
        id: "lag",
        term: "Lag",
        definition: "The delay between a change in price and the moment an average reflects it. Slower averages lag more.",
      },
    ],
  },
  {
    id: "renko",
    title: "Renko charts",
    lesson: { label: "Renko Bricks", href: "/learn/renko-bricks" },
    terms: [
      {
        id: "renko-chart",
        term: "Renko chart",
        definition: "A chart built from equal sized bricks that only appear when price moves a set amount. Time is left out.",
      },
      { id: "renko-brick", term: "Brick", definition: "One block on a Renko chart, exactly one box size tall, pointing up or down." },
      {
        id: "box-size",
        term: "Box size",
        definition: "How far price must move to draw one brick. A small box shows more detail and noise, a large box is calmer.",
      },
      {
        id: "renko-reversal",
        term: "Reversal (Renko)",
        definition: "A switch from up bricks to down bricks or back. In classic Renko it needs a move of two boxes.",
      },
      {
        id: "time-based-chart",
        term: "Time based chart",
        definition: "A chart that adds a new candle every fixed interval, such as every hour, whatever price does.",
      },
    ],
  },
  {
    id: "on-chain",
    title: "On-chain metrics",
    lesson: { label: "On-Chain Metrics", href: "/learn/on-chain-metrics" },
    terms: [
      {
        id: "output",
        term: "Output",
        definition: "A chunk of bitcoin recorded on the blockchain. It is created when coins arrive and spent when they move again.",
      },
      {
        id: "sopr",
        term: "SOPR",
        definition: "Spent Output Profit Ratio: value of moved coins when spent divided by value when created. 1.0 is break even. A spend is not always a sale.",
      },
      { id: "market-value", term: "Market value", definition: "Every coin priced at today's price." },
      {
        id: "realized-value",
        term: "Realized value",
        definition: "Every coin priced at the price when it last moved on chain, not necessarily the price its owner paid. It only changes when coins move.",
      },
      { id: "mvrv", term: "MVRV", definition: "Market value divided by realized value. Above 1, coins are worth more today than when they last moved." },
    ],
  },
  {
    id: "timeframes-and-sound",
    title: "Timeframes and sound",
    lesson: { label: "Audio Lab", href: "/audio-lab" },
    terms: [
      { id: "timeframe", term: "Timeframe", definition: "The interval each candle covers, such as 15 minutes (15m), 4 hours (4H) or one day (Daily)." },
      {
        id: "sonification",
        term: "Sonification",
        definition: "Turning data into sound. In the Audio Lab, pitch follows a trend line so you can hear its direction.",
      },
      {
        id: "register",
        term: "Register",
        definition: "A range of notes on the piano, from low to high. Each timeframe plays in its own register in the Audio Lab.",
      },
      {
        id: "average-range",
        term: "ATR (average range)",
        definition: "The typical size of recent bars. The Sound Playground smooths each bar's high minus low over 7 bars.",
      },
      {
        id: "sonar-cue",
        term: "Sonar cue",
        definition: "A repeating tone that gets louder as price gets closer to a line, like a sonar ping. Used by EMA Sonar and Sonar Bands.",
      },
      {
        id: "efficiency-ratio",
        term: "Efficiency Ratio (ER)",
        definition: "Net price change divided by the total distance travelled. Near 1 is a straight move, near 0 is choppy back and forth.",
      },
      {
        id: "price-channel",
        term: "Price channel",
        definition: "A band above and a band below a moving average. Sonar Bands sets them 1.7 average ranges from a 10 bar EMA.",
      },
      {
        id: "breakout",
        term: "Breakout",
        definition: "A close outside a channel or level. On SlushyMarkets it is a description of what happened, not a signal.",
      },
    ],
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = GLOSSARY.flatMap((section) => section.terms);

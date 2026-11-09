import { generateBaseBars, type Bar } from "@/lib/sonification/market";

/**
 * Virtual trading engine for Practice Mode, as pure functions. No real money, no exchange, no wallet.
 *
 * Accounting rule: balance = starting balance + realized P&L - fees, and it never goes below zero.
 * A position always uses the whole balance with no leverage. Orders fill at the close of the
 * latest revealed bar.
 */

export type Side = "long" | "short";
export type Position = { side: Side; quantity: number; entryPrice: number };

export type Account = {
  startingBalance: number;
  balance: number;
  position: Position | null;
  /** Closed trades only, before fees. */
  realizedPnl: number;
  fees: number;
  /** Every open or close counts as one transaction. */
  transactions: number;
  peakEquity: number;
  /** Largest fall from a peak, as a fraction of that peak. */
  maxDrawdown: number;
};

export const PRACTICE_CONFIG = {
  startingBalance: 10_000,
  /** Set by Slushy: 0.05% fee and 0.02% adverse slippage per side, no commission. */
  feeRate: 0.0005,
  slippageRate: 0.0002,
  rounds: 3,
  /** 120 bars at 0.5 seconds each is one minute. */
  barsPerRound: 120,
  barSeconds: 0.5,
  warmupBars: 60,
} as const;

/** Price actually received: buying pays a little more, selling receives a little less. */
const slipped = (price: number, buying: boolean) => price * (1 + (buying ? 1 : -1) * PRACTICE_CONFIG.slippageRate);
const exitFill = (account: Account, price: number) => slipped(price, account.position?.side === "short");

export function createAccount(startingBalance: number = PRACTICE_CONFIG.startingBalance): Account {
  return { startingBalance, balance: startingBalance, position: null, realizedPnl: 0, fees: 0, transactions: 0, peakEquity: startingBalance, maxDrawdown: 0 };
}

export function unrealizedPnl(account: Account, price: number): number {
  const p = account.position;
  if (!p) return 0;
  return p.quantity * (p.side === "long" ? price - p.entryPrice : p.entryPrice - price);
}

export function equity(account: Account, price: number): number {
  return Math.max(account.balance + unrealizedPnl(account, price), 0);
}

const validPrice = (price: number) => Number.isFinite(price) && price > 0;

export function closePosition(account: Account, price: number, feeRate: number = PRACTICE_CONFIG.feeRate): Account {
  if (!account.position || !validPrice(price)) return account;
  // A loss or fee cannot take more than the account holds.
  const pnl = Math.max(unrealizedPnl(account, price), -account.balance);
  const afterPnl = account.balance + pnl;
  const fee = Math.min(account.position.quantity * price * feeRate, afterPnl);
  return {
    ...account,
    balance: afterPnl - fee,
    position: null,
    realizedPnl: account.realizedPnl + pnl,
    fees: account.fees + fee,
    transactions: account.transactions + 1,
  };
}

/** Opens a full size position. Same side: no change. Opposite side: closes first, then opens. */
export function openPosition(account: Account, side: Side, price: number, feeRate: number = PRACTICE_CONFIG.feeRate): Account {
  if (!validPrice(price) || account.position?.side === side) return account;
  const flat = account.position ? closePosition(account, price, feeRate) : account;
  if (flat.balance <= 0) return flat;
  // Sized so the position value plus its fee equals the balance.
  const notional = flat.balance / (1 + feeRate);
  const fee = notional * feeRate;
  return {
    ...flat,
    balance: flat.balance - fee,
    position: { side, quantity: notional / price, entryPrice: price },
    fees: flat.fees + fee,
    transactions: flat.transactions + 1,
  };
}

/** Updates peak and drawdown at a new price. An account that reaches zero is closed. */
export function markToMarket(account: Account, price: number, feeRate: number = PRACTICE_CONFIG.feeRate): Account {
  if (!validPrice(price)) return account;
  const value = equity(account, price);
  const peakEquity = Math.max(account.peakEquity, value);
  const drawdown = peakEquity > 0 ? (peakEquity - value) / peakEquity : 0;
  const marked = { ...account, peakEquity, maxDrawdown: Math.max(account.maxDrawdown, drawdown) };
  return value <= 0 && marked.position ? closePosition(marked, price, feeRate) : marked;
}

export type RoundState = { bar: number; account: Account; finished: boolean };

export function createRound(): RoundState {
  return { bar: 0, account: createAccount(), finished: false };
}

/** Bars the player may see at `bar`. Nothing after it, so the chart cannot show the future. */
export function visibleBars<T>(series: readonly T[], bar: number): T[] {
  return series.slice(0, bar + 1);
}

/** Moves to `target`, marking every bar on the way. The last bar closes any open position. */
export function advanceRound(state: RoundState, bars: readonly Bar[], target: number): RoundState {
  if (state.finished) return state;
  const last = bars.length - 1;
  const to = Math.min(target, last);
  let account = state.account;
  for (let i = state.bar + 1; i <= to; i += 1) account = markToMarket(account, bars[i].close);
  if (to >= last) {
    account = markToMarket(closePosition(account, exitFill(account, bars[last].close)), bars[last].close);
    return { bar: last, account, finished: true };
  }
  return { ...state, bar: Math.max(state.bar, to), account };
}

export type TradeAction = Side | "close";

export function tradeRound(state: RoundState, bars: readonly Bar[], action: TradeAction): RoundState {
  if (state.finished) return state;
  const price = bars[state.bar].close;
  const next =
    action === "close"
      ? closePosition(state.account, exitFill(state.account, price))
      : state.account.position && state.account.position.side !== action
        ? openPosition(closePosition(state.account, exitFill(state.account, price)), action, slipped(price, action === "long"))
        : openPosition(state.account, action, slipped(price, action === "long"));
  return next === state.account ? state : { ...state, account: markToMarket(next, price) };
}

export type RoundResult = { netPnl: number; returnPct: number; maxDrawdownPct: number; transactions: number; fees: number };

export function summarize(account: Account): RoundResult {
  const netPnl = account.balance - account.startingBalance;
  return {
    netPnl,
    returnPct: (netPnl / account.startingBalance) * 100,
    maxDrawdownPct: account.maxDrawdown * 100,
    transactions: account.transactions,
    fees: account.fees,
  };
}

export function combineResults(results: readonly RoundResult[]): RoundResult {
  const sum = (pick: (r: RoundResult) => number) => results.reduce((total, r) => total + pick(r), 0);
  const netPnl = sum((r) => r.netPnl);
  return {
    netPnl,
    returnPct: (netPnl / (results.length * PRACTICE_CONFIG.startingBalance || 1)) * 100,
    maxDrawdownPct: Math.max(0, ...results.map((r) => r.maxDrawdownPct)),
    transactions: sum((r) => r.transactions),
    fees: sum((r) => r.fees),
  };
}

/** Simulated bars for one round: warm up (for indicators) followed by the bars that are played. */
export function practiceSeries(seed: number): Bar[] {
  return generateBaseBars(seed, PRACTICE_CONFIG.warmupBars + PRACTICE_CONFIG.barsPerRound);
}

/** Three different charts per attempt, and new ones on every attempt. */
export function practiceSeeds(attempt: number): number[] {
  return Array.from({ length: PRACTICE_CONFIG.rounds }, (_, round) => 20261200 + attempt * 10 + round);
}

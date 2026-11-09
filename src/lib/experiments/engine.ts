/**
 * Paper trading engine for the historical experiments, as pure functions. Virtual money only.
 *
 * Rules follow Slushy's original experiment: a button queues an order for the next daily open,
 * one position at a time, fixed trade size, adverse slippage and a fee on every fill, and any
 * open position closes at the final close of the year.
 */

export type ExperimentSettings = { initial: number; notional: number; fee: number; slippage: number; commission: number };

/** 0.05% fee and 0.02% slippage per side, no commission, as set by Slushy. */
export const EXPERIMENT_SETTINGS: ExperimentSettings = { initial: 10_000, notional: 2_000, fee: 0.0005, slippage: 0.0002, commission: 0 };

export type PaperSide = 1 | -1;
export type QueuedOrder = PaperSide | 0;
export type PaperBar = { date: string; o: number; c: number };
export type OpenPosition = { side: PaperSide; entry: number; quantity: number; entryFee: number; date: string; leverage: number };
export type ClosedTrade = OpenPosition & { exit: number; exitDate: string; gross: number; net: number; fees: number; forced: boolean; marginClose?: boolean };
export type Fill = { date: string; price: number; action: "LONG" | "SHORT" | "CLOSE" };

export type PaperAccount = {
  settings: ExperimentSettings;
  balance: number;
  fees: number;
  position: OpenPosition | null;
  pending: QueuedOrder | null;
  trades: ClosedTrade[];
  fills: Fill[];
  peak: number;
  maxDrawdown: number;
  /** Multiplier for the next entry. Only the Arcade round lets players change it. Open positions keep theirs. */
  leverage: number;
};

export function createPaperAccount(settings: ExperimentSettings = EXPERIMENT_SETTINGS): PaperAccount {
  return { settings, balance: settings.initial, fees: 0, position: null, pending: null, trades: [], fills: [], peak: settings.initial, maxDrawdown: 0, leverage: 1 };
}

export const MAX_LEVERAGE = 2;

export function setLeverage(account: PaperAccount, leverage: number): PaperAccount {
  return { ...account, leverage: Math.min(MAX_LEVERAGE, Math.max(1, Math.round(leverage))) };
}

export function queueOrder(account: PaperAccount, order: QueuedOrder): PaperAccount {
  return { ...account, pending: order };
}

const feeFor = (notional: number, s: ExperimentSettings) => Math.abs(notional) * s.fee + s.commission;

function open(account: PaperAccount, side: PaperSide, price: number, date: string): PaperAccount {
  const s = account.settings;
  if (account.balance <= 0) return account;
  const fill = price * (1 + side * s.slippage);
  const notional = Math.min(s.notional * account.leverage, account.balance);
  const fee = feeFor(notional, s);
  if (notional < 1 || fee >= account.balance) return account;
  return {
    ...account,
    balance: account.balance - fee,
    fees: account.fees + fee,
    position: { side, entry: fill, quantity: notional / fill, entryFee: fee, date, leverage: account.leverage },
    fills: [...account.fills, { date, price: fill, action: side === 1 ? "LONG" : "SHORT" }],
  };
}

function close(account: PaperAccount, price: number, date: string, forced: boolean, marginClose = false): PaperAccount {
  const p = account.position;
  if (!p) return account;
  const fill = price * (1 - p.side * account.settings.slippage);
  const gross = p.side * p.quantity * (fill - p.entry);
  const fee = feeFor(p.quantity * fill, account.settings);
  return {
    ...account,
    balance: account.balance + gross - fee,
    fees: account.fees + fee,
    position: null,
    trades: [...account.trades, { ...p, exit: fill, exitDate: date, gross, net: gross - p.entryFee - fee, fees: p.entryFee + fee, forced, ...(marginClose ? { marginClose } : {}) }],
    fills: [...account.fills, { date, price: fill, action: "CLOSE" }],
  };
}

export function unrealized(account: PaperAccount, price: number): number {
  const p = account.position;
  return p ? p.side * p.quantity * (price - p.entry) : 0;
}

export function accountEquity(account: PaperAccount, price: number): number {
  return account.balance + unrealized(account, price);
}

/** Moves to a new daily bar: fills any queued order at its open, then marks equity at its close. */
export function advanceBar(account: PaperAccount, bar: PaperBar, last = false): PaperAccount {
  let next = account;
  if (next.pending !== null) {
    const side = next.pending;
    next = { ...next, pending: null };
    if (side !== (next.position?.side ?? 0)) {
      next = close(next, bar.o, bar.date, false);
      if (side !== 0) next = open(next, side, bar.o, bar.date);
    }
  }
  if (last) next = close(next, bar.c, bar.date, true);
  else if (marginRisk(next, bar.c).ratio >= 1) next = close(next, bar.c, bar.date, true, true);
  const equity = accountEquity(next, bar.c);
  const peak = Math.max(next.peak, equity);
  return { ...next, peak, maxDrawdown: Math.max(next.maxDrawdown, (peak - equity) / peak) };
}

/**
 * Practice margin for leveraged positions: entry notional / leverage. When the open loss plus the
 * entry fee reaches it at a daily close, the position closes there with costs. 1x positions have none.
 */
export function marginRisk(account: PaperAccount, price: number): { margin: number; ratio: number } {
  const p = account.position;
  if (!p || p.leverage <= 1) return { margin: 0, ratio: 0 };
  const margin = (p.quantity * p.entry) / p.leverage;
  return { margin, ratio: Math.max(0, -unrealized(account, price) + p.entryFee) / margin };
}

export type LeverageReview = { used: boolean; actual: number; allOneX: number; effect: number };

/** What the same trades would have made at 1x. Gross and fees scale with leverage, commission does not. */
export function leverageReview(account: PaperAccount): LeverageReview {
  const c = account.settings.commission;
  let actual = 0;
  let allOneX = 0;
  for (const t of account.trades) {
    actual += t.net;
    allOneX += t.gross / t.leverage - ((t.fees - 2 * c) / t.leverage + 2 * c);
  }
  return { used: account.trades.some((t) => t.leverage > 1), actual, allOneX, effect: actual - allOneX };
}

export type ExperimentResult = {
  netPnl: number;
  returnPct: number;
  drawdownPct: number;
  tradeCount: number;
  wins: number;
  fees: number;
  winningPnl: number;
  losingPnl: number;
  /** null when there are no trades, Infinity when there are wins and no losses. */
  profitFactor: number | null;
};

export function experimentResult(account: PaperAccount): ExperimentResult {
  const netPnl = account.balance - account.settings.initial;
  const winningPnl = account.trades.reduce((sum, t) => sum + Math.max(0, t.net), 0);
  const losingPnl = account.trades.reduce((sum, t) => sum + Math.max(0, -t.net), 0);
  return {
    netPnl,
    returnPct: (netPnl / account.settings.initial) * 100,
    drawdownPct: account.maxDrawdown * 100,
    tradeCount: account.trades.length,
    wins: account.trades.filter((t) => t.net > 0).length,
    fees: account.fees,
    winningPnl,
    losingPnl,
    profitFactor: losingPnl > 0 ? winningPnl / losingPnl : winningPnl > 0 ? Infinity : null,
  };
}

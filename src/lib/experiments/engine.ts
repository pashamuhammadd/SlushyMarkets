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
export type OpenPosition = { side: PaperSide; entry: number; quantity: number; entryFee: number; date: string };
export type ClosedTrade = OpenPosition & { exit: number; exitDate: string; gross: number; net: number; fees: number; forced: boolean };
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
};

export function createPaperAccount(settings: ExperimentSettings = EXPERIMENT_SETTINGS): PaperAccount {
  return { settings, balance: settings.initial, fees: 0, position: null, pending: null, trades: [], fills: [], peak: settings.initial, maxDrawdown: 0 };
}

export function queueOrder(account: PaperAccount, order: QueuedOrder): PaperAccount {
  return { ...account, pending: order };
}

const feeFor = (notional: number, s: ExperimentSettings) => Math.abs(notional) * s.fee + s.commission;

function open(account: PaperAccount, side: PaperSide, price: number, date: string): PaperAccount {
  const s = account.settings;
  if (account.balance <= 0) return account;
  const fill = price * (1 + side * s.slippage);
  const notional = Math.min(s.notional, account.balance);
  const fee = feeFor(notional, s);
  if (notional < 1 || fee >= account.balance) return account;
  return {
    ...account,
    balance: account.balance - fee,
    fees: account.fees + fee,
    position: { side, entry: fill, quantity: notional / fill, entryFee: fee, date },
    fills: [...account.fills, { date, price: fill, action: side === 1 ? "LONG" : "SHORT" }],
  };
}

function close(account: PaperAccount, price: number, date: string, forced: boolean): PaperAccount {
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
    trades: [...account.trades, { ...p, exit: fill, exitDate: date, gross, net: gross - p.entryFee - fee, fees: p.entryFee + fee, forced }],
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
  const equity = accountEquity(next, bar.c);
  const peak = Math.max(next.peak, equity);
  return { ...next, peak, maxDrawdown: Math.max(next.maxDrawdown, (peak - equity) / peak) };
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

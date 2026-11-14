import type { ClosedTrade, ExperimentResult, ExperimentSettings } from "./engine";

/** A compact closed trade, small enough to keep in browser storage with a result. */
export type LoggedTrade = {
  side: 1 | -1;
  date: string;
  exitDate: string;
  quantity: number;
  entry: number;
  exit: number;
  gross: number;
  fees: number;
  net: number;
  forced: boolean;
  leverage?: number;
};

export function logTrades(trades: readonly ClosedTrade[]): LoggedTrade[] {
  return trades.map((t) => ({
    side: t.side,
    date: t.date,
    exitDate: t.exitDate,
    quantity: t.quantity,
    entry: t.entry,
    exit: t.exit,
    gross: t.gross,
    fees: t.fees,
    net: t.net,
    forced: t.forced,
    ...(t.leverage > 1 ? { leverage: t.leverage } : {}),
  }));
}

/** Quotes a cell and stops spreadsheet apps from treating text as a formula. */
export function csvCell(value: string | number | boolean): string {
  let text = typeof value === "number" ? (Number.isFinite(value) ? String(Math.round(value * 1e8) / 1e8) : "") : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export type TradeLogInput = {
  market: string;
  settings: ExperimentSettings;
  result: ExperimentResult;
  trades: readonly LoggedTrade[];
  /** Extra lines, for example how prices were indexed. */
  notes?: string[];
};

const NOTICE =
  "Simulation result, not a live trading record. Real-money trading involves emotional pressure, execution uncertainty and risk decisions this experiment does not reproduce. Do not use this score alone to decide whether to trade real money.";

export function tradeLogCsv({ market, settings, result, trades, notes = [] }: TradeLogInput): string {
  const s = settings;
  const pf = result.profitFactor === null ? "N/A" : Number.isFinite(result.profitFactor) ? result.profitFactor.toFixed(2) : "No losing trades";
  const rows: Array<Array<string | number | boolean>> = [
    ["Notice", NOTICE],
    ["Educational use", "Not personalized investment advice. Cryptocurrency trading can cause substantial losses."],
    ["Market", market],
    [
      "Execution assumptions",
      `Virtual starting balance ${s.initial} USD; trade size ${s.notional} USD; fee ${s.fee * 100}% per side; adverse slippage ${s.slippage * 100}% per side; commission ${s.commission} USD per order. Orders fill at the next daily open; drawdown uses daily closes.`,
    ],
    ...notes.map((n) => ["Note", n]),
    [],
    ["Result", "Value"],
    ["Net P&L (USD)", result.netPnl],
    ["Return (%)", result.returnPct],
    ["Profit factor", pf],
    ["Max daily-close drawdown (%)", result.drawdownPct],
    ["Winning / closed trades", `${result.wins} / ${result.tradeCount}`],
    ["Fees (USD)", result.fees],
    [],
    ["side", "entry_date", "exit_date", "leverage", "quantity", "entry_fill", "exit_fill", "gross_pnl_usd", "fees_usd", "net_pnl_usd", "forced_final_close"],
    ...trades.map((t) => [t.side === 1 ? "LONG" : "SHORT", t.date, t.exitDate, t.leverage ?? 1, t.quantity, t.entry, t.exit, t.gross, t.fees, t.net, t.forced]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export const tradeLogFileName = (label: string) => `SlushyMarkets_${label.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "")}_paper_trades.csv`;

/** Browser only: saves the CSV through a temporary link. */
export function downloadCsv(fileName: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import { describe, expect, it } from "vitest";
import { advanceBar, createPaperAccount, experimentResult, queueOrder, setLeverage, EXPERIMENT_SETTINGS } from "./engine";
import { csvCell, logTrades, tradeLogCsv, tradeLogFileName } from "./trade-log";

describe("trade log CSV", () => {
  let a = advanceBar(queueOrder(createPaperAccount(), 1), { date: "2025-01-02", o: 100, c: 101 });
  a = advanceBar(queueOrder(a, -1), { date: "2025-01-03", o: 110, c: 108 });
  a = advanceBar(a, { date: "2025-01-04", o: 108, c: 100 }, true);
  const csv = tradeLogCsv({ market: "BTC 2025", settings: EXPERIMENT_SETTINGS, result: experimentResult(a), trades: logTrades(a.trades) });
  const lines = csv.split("\n");

  it("lists every closed trade after the header", () => {
    const header = lines.findIndex((l) => l.startsWith('"side"'));
    expect(lines.slice(header + 1)).toHaveLength(2);
    expect(lines[header + 1]).toContain('"LONG","2025-01-02","2025-01-03","1"');
    expect(lines[header + 2]).toContain('"SHORT","2025-01-03","2025-01-04"');
    expect(lines[header + 2].endsWith('"true"')).toBe(true);
  });

  it("states it is a simulation and lists the costs", () => {
    expect(csv).toContain("Simulation result, not a live trading record");
    expect(csv).toContain("fee 0.05% per side");
    expect(csv).toContain("adverse slippage 0.02% per side");
  });

  it("escapes quotes and blocks formulas", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell(-5)).toBe('"-5"');
    expect(csvCell(Number.NaN)).toBe('""');
  });

  it("records leverage and makes safe file names", () => {
    let b = advanceBar(queueOrder(setLeverage(createPaperAccount(), 2), 1), { date: "d1", o: 100, c: 100 });
    b = advanceBar(b, { date: "d2", o: 100, c: 101 }, true);
    expect(logTrades(b.trades)[0].leverage).toBe(2);
    expect(tradeLogFileName("SOL 2020 / bonus")).toBe("SlushyMarkets_SOL_2020_bonus_paper_trades.csv");
  });
});

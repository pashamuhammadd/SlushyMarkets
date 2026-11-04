const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdPlain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const btc = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });

export const formatUsd = (value: number) => usd.format(value);
export const formatPrice = (value: number) => usdPlain.format(value);
export const formatBtc = (value: number) => `${btc.format(value)} BTC`;
/** Times are shown in UTC so server and browser renders always match. */
export const formatClock = (ms: number) => time.format(ms);
const timeSeconds = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});
/** Clock with seconds, in UTC, for trade lists inside one minute. */
export const formatClockSeconds = (ms: number) => timeSeconds.format(ms);

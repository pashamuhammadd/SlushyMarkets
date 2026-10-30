/** One executed (filled) trade. Synthetic in this MVP, never live market data. */
export type Trade = {
  id: string;
  timestampMs: number;
  priceUsd: number;
  quantityBtc: number;
};

/** OHLC summary of every trade executed inside one time bucket. */
export type Candle = {
  /** Bucket number counted from the series origin. Gaps in this number mean empty intervals. */
  index: number;
  startMs: number;
  endMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeBtc: number;
  tradeCount: number;
};

/** Executed volume accumulated inside one price band. */
export type PriceBand = {
  index: number;
  lowUsd: number;
  highUsd: number;
  volumeBtc: number;
  tradeCount: number;
};

export type VolumeProfile = {
  bandUsd: number;
  bands: PriceBand[];
  totalVolumeBtc: number;
  /** Index into `bands` of the point of control (largest volume), or null before any trade. */
  pocBandIndex: number | null;
};

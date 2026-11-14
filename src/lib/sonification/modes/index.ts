/**
 * Sound Playground modes. Only modes marked "live" are playable and have their own page.
 * The others are Slushy's prototype ideas that will be ported one at a time, after each is
 * reviewed and tested.
 */
export type PlayableModeId = "ema-sonar" | "sonar-bands" | "sonar-er-drums" | "sonar-volume";

export type ModeListing = {
  id: string;
  title: string;
  summary: string;
  status: "live" | "planned";
  href?: "/audio-lab/playground" | "/audio-lab/playground/sonar-bands" | "/audio-lab/playground/er-drums" | "/audio-lab/playground/sonar-volume";
};

export const MODE_LISTINGS: readonly ModeListing[] = [
  {
    id: "ema-sonar",
    title: "EMA Sonar",
    summary: "Hear how close price is to the 7, 20 and 50 EMAs.",
    status: "live",
    href: "/audio-lab/playground",
  },
  {
    id: "sonar-bands",
    title: "Sonar Bands",
    summary: "Organ tones for a moving channel around the EMA, with chimes for breakouts and knocks for returns.",
    status: "live",
    href: "/audio-lab/playground/sonar-bands",
  },
  {
    id: "sonar-er-drums",
    title: "Sonar Channels and ER drums",
    summary: "The Sonar Bands channel plus drums whenever the Efficiency Ratio shows a choppy market.",
    status: "live",
    href: "/audio-lab/playground/er-drums",
  },
  {
    id: "sonar-volume",
    title: "Sonar Channels and volume",
    summary: "Quick high and low drum hits for simulated buyer and seller volume, on top of the Sonar Bands channel.",
    status: "live",
    href: "/audio-lab/playground/sonar-volume",
  },
  {
    id: "multi-timeframe",
    title: "Two or three timeframes",
    summary: "Layer price from several timeframes, with optional indicator cues.",
    status: "planned",
  },
  {
    id: "fractals",
    title: "Fractals: confirm or reject",
    summary: "Cues when a swing high or low forms, confirms or gets rejected.",
    status: "planned",
  },
];

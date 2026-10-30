import localFont from "next/font/local";

/**
 * Fonts are self hosted (SIL Open Font License, see the .txt files in this folder)
 * so builds never depend on a third party font CDN and visitors are not tracked.
 */
export const fontDisplay = localFont({
  src: "./fonts/Fredoka-Variable.woff2",
  variable: "--font-fredoka",
  weight: "300 700",
  display: "swap",
});

export const fontSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

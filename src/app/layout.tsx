import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultOpenGraph, defaultTitle, site, socialImage } from "@/lib/site";
import { siteGraph } from "@/lib/structured-data";
import { fontDisplay, fontSans } from "./fonts";
import "./globals.css";

// No canonical here on purpose: each page sets its own, so error and 404 pages never point at the homepage.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: defaultTitle,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.studio }],
  creator: site.studio,
  publisher: site.name,
  openGraph: defaultOpenGraph(),
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.description,
    images: [socialImage],
  },
  // Filled from an environment variable so the Search Console token never needs a code change.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#071124",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable} h-full antialiased`}>
      <body className="bg-atmosphere flex min-h-full flex-col">
        <JsonLd data={siteGraph()} />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

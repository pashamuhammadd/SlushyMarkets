import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Only routes that really exist and work. Planned lessons are not listed until they ship. */
const routes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/learn", priority: 0.9, changeFrequency: "weekly" },
  { path: "/learn/candlesticks-and-volume", priority: 0.9, changeFrequency: "monthly" },
  { path: "/audio-lab", priority: 0.8, changeFrequency: "monthly" },
  { path: "/explore", priority: 0.7, changeFrequency: "monthly" },
  { path: "/feedback", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${site.url}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { TrendState } from "@/lib/audio/trend-scenario";

export const STATE_UI: Record<TrendState, { tone: "success" | "neutral" | "danger"; icon: LucideIcon; text: string }> = {
  bullish: { tone: "success", icon: ArrowUpRight, text: "Bullish" },
  sideways: { tone: "neutral", icon: ArrowRight, text: "Sideways" },
  bearish: { tone: "danger", icon: ArrowDownRight, text: "Bearish" },
};

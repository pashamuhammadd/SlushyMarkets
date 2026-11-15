import "server-only";
import { FEEDBACK_TOPICS, type FeedbackInput } from "@/lib/validation/feedback";

/**
 * Feedback notifications for the team's private Discord channel, through an incoming webhook.
 * Set DISCORD_FEEDBACK_WEBHOOK_URL in Vercel (server only, never NEXT_PUBLIC_). Without it,
 * nothing is sent. The notification never decides whether a submission succeeded: feedback is
 * saved in Supabase first, and a failed or slow Discord call is only logged.
 *
 * Privacy: the email address is never sent to Discord, only whether one was given.
 * Safety: user text cannot ping anyone (allowed_mentions is empty) and is cut to Discord's limits.
 */

const WEBHOOK_RE = /^https:\/\/(?:discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
export const SITE_URL = "https://slushymarkets.com";

export function feedbackWebhookUrl(env: Record<string, string | undefined> = process.env): string | null {
  const url = env.DISCORD_FEEDBACK_WEBHOOK_URL?.trim();
  return url && WEBHOOK_RE.test(url) ? url : null;
}

const RATING_COLORS = [0x8b93b5, 0xff6b8b, 0xff9f6b, 0xffd166, 0x7dd3fc, 0x44d9a4];

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function feedbackWebhookPayload(feedback: FeedbackInput, now: Date = new Date()) {
  const topic = FEEDBACK_TOPICS.find((t) => t.value === feedback.topic)?.label ?? feedback.topic;
  const stars = feedback.rating ? `${"★".repeat(feedback.rating)}${"☆".repeat(5 - feedback.rating)}` : "No rating";
  const page = feedback.page && feedback.page.startsWith("/") ? `${SITE_URL}${feedback.page}` : "Unknown page";
  return {
    username: "SlushyMarkets Feedback",
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: clip(`New feedback: ${topic}`, 256),
        description: clip(feedback.message, 3500),
        color: RATING_COLORS[feedback.rating ?? 0],
        fields: [
          { name: "Rating", value: stars, inline: true },
          { name: "Reply wanted", value: feedback.email && feedback.contactConsent ? "Yes, email in Supabase" : "No", inline: true },
          { name: "Page", value: clip(page, 1024), inline: false },
        ],
        footer: { text: "Full record in Supabase, table feedback" },
        timestamp: now.toISOString(),
      },
    ],
  };
}

/** Sends the notification. Returns whether Discord accepted it; never throws. */
export async function notifyFeedback(feedback: FeedbackInput, url = feedbackWebhookUrl()): Promise<boolean> {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(feedbackWebhookPayload(feedback)),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`Discord feedback webhook failed with status ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error("Discord feedback webhook failed", error instanceof Error ? error.name : "unknown error");
    return false;
  }
}

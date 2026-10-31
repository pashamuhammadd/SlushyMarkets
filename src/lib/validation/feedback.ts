/**
 * Feedback validation. Runs on the server for every submission; the form reuses the
 * same limits for helpful hints, but the server result is the only one that counts.
 */

export const FEEDBACK_TOPICS = [
  { value: "general", label: "General" },
  { value: "lesson-clarity", label: "Lesson clarity" },
  { value: "audio", label: "Audio experience" },
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
] as const;

export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number]["value"];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;
export const EMAIL_MAX = 254;
/** Humans need a moment to write something. Faster submissions are treated as bots. */
export const MIN_FILL_MS = 2500;

export type FeedbackInput = {
  topic: FeedbackTopic;
  rating: number | null;
  message: string;
  email: string | null;
  contactConsent: boolean;
  page: string | null;
};

export type FeedbackField = "topic" | "rating" | "message" | "email" | "contactConsent" | "form";

export type ValidationResult =
  | { ok: true; data: FeedbackInput }
  | { ok: false; spam: boolean; errors: Partial<Record<FeedbackField, string>> };

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
// Control characters except tab and newlines.
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function validateFeedback(raw: unknown, now: number = Date.now()): ValidationResult {
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const errors: Partial<Record<FeedbackField, string>> = {};

  // Spam checks first: a filled honeypot or an instant submission.
  const honeypot = asString(body.website).trim();
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : Number.NaN;
  if (honeypot.length > 0 || !Number.isFinite(startedAt) || now - startedAt < MIN_FILL_MS) {
    return { ok: false, spam: true, errors: { form: "We could not accept this submission. Please try again." } };
  }

  const topic = asString(body.topic);
  if (!FEEDBACK_TOPICS.some((t) => t.value === topic)) errors.topic = "Choose a topic.";

  let rating: number | null = null;
  if (body.rating !== null && body.rating !== undefined && body.rating !== "") {
    const n = Number(body.rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) errors.rating = "Rating must be a whole number from 1 to 5.";
    else rating = n;
  }

  const message = asString(body.message).replace(CONTROL_RE, "").trim();
  if (message.length < MESSAGE_MIN) errors.message = `Please write at least ${MESSAGE_MIN} characters.`;
  else if (message.length > MESSAGE_MAX) errors.message = `Please keep it under ${MESSAGE_MAX} characters.`;

  const emailRaw = asString(body.email).trim();
  const email = emailRaw.length ? emailRaw.toLowerCase() : null;
  if (email && (email.length > EMAIL_MAX || !EMAIL_RE.test(email))) errors.email = "Enter a valid email or leave it empty.";

  const contactConsent = body.contactConsent === true;
  if (email && !contactConsent) errors.contactConsent = "Tick the box so we may use your email to reply, or remove the email.";

  const pageRaw = asString(body.page).trim();
  const page = pageRaw.startsWith("/") && pageRaw.length <= 200 && !pageRaw.startsWith("//") ? pageRaw : null;

  if (Object.keys(errors).length > 0) return { ok: false, spam: false, errors };

  return {
    ok: true,
    data: { topic: topic as FeedbackTopic, rating, message, email, contactConsent: email ? contactConsent : false, page },
  };
}

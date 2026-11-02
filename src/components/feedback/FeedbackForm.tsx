"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { cn } from "@/lib/cn";
import { FEEDBACK_TOPICS, MESSAGE_MAX, MESSAGE_MIN, type FeedbackField } from "@/lib/validation/feedback";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type ApiResponse = { ok: boolean; message?: string; fields?: Partial<Record<FeedbackField, string>> };

const inputBase =
  "w-full rounded-xl bg-navy-950/60 px-4 text-sm text-ink ring-1 ring-white/10 placeholder:text-subtle transition focus:outline-none focus:ring-2 focus:ring-cyan aria-[invalid=true]:ring-danger/70";

/**
 * Feedback form. Success is shown ONLY when the server answers 201 after storing the row.
 * Every other outcome shows an honest error and keeps what the person typed.
 */
export function FeedbackForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Partial<Record<FeedbackField, string>>>({});
  const [topic, setTopic] = useState("general");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const startedAt = useRef<number | null>(null);
  const id = useId();

  function clearError(field: FeedbackField) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    if (status.kind === "error") setStatus({ kind: "idle" });
  }

  function markStarted() {
    if (startedAt.current === null) startedAt.current = Date.now();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;
    const form = new FormData(event.currentTarget);
    setStatus({ kind: "submitting" });
    setErrors({});

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          rating,
          message,
          email,
          contactConsent: consent,
          page: document.referrer ? safePath(document.referrer) : null,
          website: String(form.get("website") ?? ""),
          startedAt: startedAt.current ?? Date.now(),
        }),
      });
      const data = (await response.json().catch(() => ({ ok: false }))) as ApiResponse;

      if (response.status === 201 && data.ok) {
        setStatus({ kind: "success" });
        return;
      }
      if (data.fields) setErrors(data.fields);
      setStatus({ kind: "error", message: data.message ?? "Something went wrong. Nothing was saved, please try again." });
    } catch {
      setStatus({ kind: "error", message: "Network error. Nothing was saved, please check your connection and try again." });
    }
  }

  if (status.kind === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-center">
        <Mascot pose="celebrate" sizes="200px" className="w-44" />
        <p className="flex items-center gap-2 font-display text-2xl font-semibold text-ink">
          <CheckCircle2 aria-hidden="true" className="size-6 text-success" /> Thank you, it is saved
        </p>
        <p className="max-w-md text-sm text-muted">
          Your feedback reached the Slushy Markets team. {email ? "If we reply, it will be to the email you gave." : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setRating(null);
            setStatus({ kind: "idle" });
            startedAt.current = null;
          }}
          className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-white/15 transition hover:bg-white/5"
        >
          Send another message
        </button>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  const remaining = MESSAGE_MAX - message.length;

  return (
    <form onSubmit={onSubmit} onFocus={markStarted} noValidate className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Topic</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEEDBACK_TOPICS.map((t) => (
            <label
              key={t.value}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-sm ring-1 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan",
                topic === t.value ? "bg-cyan/15 text-ink ring-cyan/50" : "text-muted ring-white/10 hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="topic"
                value={t.value}
                checked={topic === t.value}
                onChange={() => {
                  setTopic(t.value);
                  clearError("topic");
                }}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
        {errors.topic ? <p className="mt-1.5 text-sm text-danger">{errors.topic}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          Rating <span className="font-normal text-subtle">(optional)</span>
        </legend>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? null : n)}
              aria-pressed={rating !== null && n <= rating}
              aria-label={`${n} out of 5`}
              className="grid size-11 place-items-center rounded-xl transition hover:bg-white/5"
            >
              <Star
                aria-hidden="true"
                className={cn("size-6", rating !== null && n <= rating ? "fill-gold text-gold" : "text-subtle")}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted" aria-live="polite">
            {rating ? `${rating} of 5` : "No rating"}
          </span>
        </div>
        {errors.rating ? <p className="mt-1.5 text-sm text-danger">{errors.rating}</p> : null}
      </fieldset>

      <div>
        <label htmlFor={`${id}-message`} className="text-sm font-semibold text-ink">
          Your feedback
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          rows={6}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearError("message");
          }}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={`${id}-message-hint`}
          placeholder="What clicked, what confused you, which lesson should come next?"
          className={cn(inputBase, "mt-2 py-3")}
        />
        <p id={`${id}-message-hint`} className={cn("mt-1.5 text-xs", errors.message ? "text-danger" : "text-subtle")}>
          {errors.message ?? `At least ${MESSAGE_MIN} characters. ${remaining} left.`}
        </p>
      </div>

      <div>
        <label htmlFor={`${id}-email`} className="text-sm font-semibold text-ink">
          Email <span className="font-normal text-subtle">(optional, only if you want a reply)</span>
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
            clearError("contactConsent");
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
          className={cn(inputBase, "mt-2 h-12")}
        />
        {errors.email ? (
          <p id={`${id}-email-error`} className="mt-1.5 text-sm text-danger">
            {errors.email}
          </p>
        ) : null}
        {email.trim() ? (
          <label className="mt-3 flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                clearError("contactConsent");
              }}
              aria-invalid={Boolean(errors.contactConsent)}
              className="mt-0.5 size-5 shrink-0 accent-cyan"
            />
            <span>
              Slushy Markets may use this email only to reply to this feedback. It is never shared or used for marketing.
            </span>
          </label>
        ) : null}
        {errors.contactConsent ? <p className="mt-1.5 text-sm text-danger">{errors.contactConsent}</p> : null}
      </div>

      {/* Honeypot: hidden from people and screen readers, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger ring-1 ring-danger/30">
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-linear-to-r from-cyan to-icy px-6 text-sm font-semibold text-navy-950 shadow-glow-cyan transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
          {submitting ? "Sending..." : "Send feedback"}
        </button>
        <p className="text-xs text-subtle">No account, no wallet address, no tracking.</p>
      </div>
    </form>
  );
}

function safePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin ? parsed.pathname : null;
  } catch {
    return null;
  }
}

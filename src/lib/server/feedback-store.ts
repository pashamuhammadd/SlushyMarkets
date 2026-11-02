import "server-only";
import type { FeedbackInput } from "@/lib/validation/feedback";
import { supabaseAuthHeaders } from "./supabase-headers";

/**
 * Feedback storage in Supabase through its REST API (PostgREST). No client library needed.
 * The service role key stays on the server: it is never prefixed with NEXT_PUBLIC_
 * and this module cannot be imported into client components ("server-only").
 * The table has Row Level Security enabled with no public policies (see supabase/migrations).
 */

type SupabaseConfig = { url: string; serviceKey: string };

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  // HTTPS only, except a local Supabase (supabase start) during development and tests.
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url ?? "");
  if (!url || !serviceKey || !(url.startsWith("https://") || local)) return null;
  return { url, serviceKey };
}

export function isFeedbackConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export type StoreResult = { ok: true } | { ok: false; reason: "not_configured" | "storage_failed" };

export async function storeFeedback(input: FeedbackInput, meta: { userAgent: string | null }): Promise<StoreResult> {
  const config = getSupabaseConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  const row = {
    topic: input.topic,
    rating: input.rating,
    message: input.message,
    email: input.email,
    contact_consent: input.contactConsent,
    page: input.page,
    user_agent: meta.userAgent ? meta.userAgent.slice(0, 300) : null,
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/feedback`, {
      method: "POST",
      headers: supabaseAuthHeaders(config.serviceKey),
      body: JSON.stringify(row),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("Feedback insert failed", response.status, await response.text().catch(() => ""));
      return { ok: false, reason: "storage_failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Feedback insert error", error);
    return { ok: false, reason: "storage_failed" };
  }
}

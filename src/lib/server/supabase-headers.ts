/**
 * Request headers for the Supabase REST API (PostgREST).
 * Pure helper with no environment access, so it can be unit tested.
 *
 * New Supabase secret keys (sb_secret_...) are not JWTs and belong only in the apikey header.
 * Sending one as a Bearer token can be rejected as an invalid JWT. Legacy service_role keys
 * (JWTs starting with eyJ) are also sent as Authorization: Bearer.
 */
export function supabaseAuthHeaders(serviceKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: serviceKey,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (serviceKey.startsWith("eyJ")) headers.Authorization = `Bearer ${serviceKey}`;
  return headers;
}

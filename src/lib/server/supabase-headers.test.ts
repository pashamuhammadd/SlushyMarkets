import { describe, expect, it } from "vitest";
import { supabaseAuthHeaders } from "./supabase-headers";

describe("supabaseAuthHeaders", () => {
  it("sends new sb_secret_ keys only in the apikey header", () => {
    const headers = supabaseAuthHeaders("sb_secret_example");
    expect(headers.apikey).toBe("sb_secret_example");
    expect(headers.Authorization).toBeUndefined();
  });

  it("also sends legacy JWT keys as a Bearer token", () => {
    const headers = supabaseAuthHeaders("eyJexample.payload.sig");
    expect(headers.apikey).toBe("eyJexample.payload.sig");
    expect(headers.Authorization).toBe("Bearer eyJexample.payload.sig");
  });

  it("asks PostgREST not to echo the inserted row", () => {
    expect(supabaseAuthHeaders("sb_secret_example").Prefer).toBe("return=minimal");
  });
});

"use client";

import { useEffect } from "react";

/**
 * Last resort fallback if the root layout itself fails. It renders its own document,
 * so it uses inline styles in the Slushy Markets colors instead of the global stylesheet.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#071124",
          color: "#F0F7FF",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <title>Something went wrong | Slushy Markets</title>
        <main>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#A8BCD4", maxWidth: 420, margin: "12px auto 24px" }}>
            Slushy Markets could not load. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#37D5FA",
              color: "#050C1B",
              border: 0,
              borderRadius: 999,
              padding: "12px 22px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

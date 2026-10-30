"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks the rendered width of an element so SVG charts can draw at real pixel size
 * (crisp text at every breakpoint). Server render and first client render use `fallback`.
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

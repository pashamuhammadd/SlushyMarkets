"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns during server rendering; on the server there is nothing to measure anyway.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Tracks the rendered width of an element so SVG charts can draw at real pixel size
 * (crisp text at every breakpoint). Server render and first client render use `fallback`.
 *
 * The width is read once right after mount, before paint, and then kept up to date with a
 * ResizeObserver. Reading it immediately means charts never overflow their container while
 * waiting for the first observer callback (which only arrives when the page renders a frame,
 * so it can be delayed in background tabs).
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (value: number) => {
      const next = Math.round(value);
      if (next > 0) setWidth(next);
    };
    measure(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

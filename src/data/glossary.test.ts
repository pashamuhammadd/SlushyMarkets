import { describe, expect, it } from "vitest";
import { lessons } from "./lessons";
import { GLOSSARY, GLOSSARY_TERMS } from "./glossary";

describe("glossary", () => {
  it("has unique, URL safe anchor ids", () => {
    const ids = [...GLOSSARY.map((s) => s.id), ...GLOSSARY_TERMS.map((t) => t.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("links each section to a page that exists", () => {
    const routes = new Set<string>(["/audio-lab", ...lessons.flatMap((l) => (l.href ? [l.href] : []))]);
    for (const section of GLOSSARY) if (section.lesson) expect(routes.has(section.lesson.href)).toBe(true);
  });

  it("uses no em or en dashes and keeps definitions short", () => {
    for (const t of GLOSSARY_TERMS) {
      expect(`${t.term} ${t.definition}`).not.toMatch(/[–—]/);
      expect(t.definition.length).toBeLessThanOrEqual(160);
    }
  });

  it("states the EMA smoothing factor correctly", () => {
    const alpha = GLOSSARY_TERMS.find((t) => t.id === "smoothing-factor");
    expect(alpha?.definition).toContain("2 / (N + 1)");
    expect(Math.round((2 / 11) * 100)).toBe(18);
  });
});

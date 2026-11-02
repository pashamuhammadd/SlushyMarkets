import { describe, expect, it } from "vitest";
import { absoluteUrl, pageMetadata, site } from "./site";
import { breadcrumbGraph, learningResourceGraph, siteGraph } from "./structured-data";

describe("brand", () => {
  it("uses the official full and short names without em or en dashes", () => {
    expect(site.fullName).toBe("Slushy Markets - a Liquidity joke");
    expect(site.name).toBe("Slushy Markets");
    for (const value of [site.fullName, site.description, site.tagline]) {
      expect(value).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("suffixes page titles with the short name and sets a canonical path", () => {
    const meta = pageMetadata({ title: "Lessons", description: "d", path: "/learn" });
    expect(meta.openGraph.title).toBe("Lessons | Slushy Markets");
    expect(meta.alternates.canonical).toBe("/learn");
  });
});

describe("absoluteUrl", () => {
  it("matches the canonical form without a trailing slash on the homepage", () => {
    expect(absoluteUrl("/")).toBe("https://slushymarkets.com");
    expect(absoluteUrl("/learn")).toBe("https://slushymarkets.com/learn");
  });
});

describe("structured data", () => {
  it("describes the site and organization with the full brand name", () => {
    const graph = siteGraph()["@graph"];
    expect(graph.map((node) => node["@type"])).toEqual(["EducationalOrganization", "WebSite"]);
    expect(graph.every((node) => node.name === site.fullName)).toBe(true);
  });

  it("numbers breadcrumbs from 1 with absolute URLs", () => {
    const crumbs = breadcrumbGraph([
      { name: "Home", path: "/" },
      { name: "Learn", path: "/learn" },
    ]);
    expect(crumbs.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://slushymarkets.com" },
      { "@type": "ListItem", position: 2, name: "Learn", item: "https://slushymarkets.com/learn" },
    ]);
  });

  it("marks lessons as free beginner resources with an ISO 8601 duration", () => {
    const [resource] = learningResourceGraph({
      name: "Lesson",
      description: "d",
      path: "/learn/x",
      crumbs: [{ name: "Home", path: "/" }],
      teaches: ["Candlesticks"],
      minutes: 8,
      resourceType: "Interactive lesson",
    })["@graph"];
    expect(resource).toMatchObject({ isAccessibleForFree: true, educationalLevel: "Beginner", timeRequired: "PT8M" });
  });
});

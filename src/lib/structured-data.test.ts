import { describe, expect, it } from "vitest";
import { absoluteUrl, defaultOpenGraph, defaultTitle, pageMetadata, site, socialImage } from "./site";
import { breadcrumbGraph, learningResourceGraph, siteGraph } from "./structured-data";

describe("brand", () => {
  it("uses the official one word brand name without em or en dashes", () => {
    expect(site.name).toBe("SlushyMarkets");
    expect(site.name).not.toMatch(/liquidity joke/i);
    for (const value of [site.name, site.description, site.tagline, defaultTitle]) {
      expect(value).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("suffixes page titles with the short name and sets a canonical path", () => {
    const meta = pageMetadata({ title: "Lessons", description: "d", path: "/learn" });
    expect(meta.openGraph.title).toBe("Lessons | SlushyMarkets");
    expect(meta.alternates.canonical).toBe("/learn");
  });
});

describe("open graph", () => {
  it("keeps the social image, site name and type when the homepage sets its url", () => {
    const og = defaultOpenGraph("/");
    expect(og).toMatchObject({ url: "/", type: "website", siteName: site.name, images: [socialImage] });
  });

  it("gives every page override the social image", () => {
    expect(pageMetadata({ title: "T", description: "d", path: "/x" }).openGraph.images).toEqual([socialImage]);
  });
});

describe("absoluteUrl", () => {
  it("matches the canonical form without a trailing slash on the homepage", () => {
    expect(absoluteUrl("/")).toBe("https://slushymarkets.com");
    expect(absoluteUrl("/learn")).toBe("https://slushymarkets.com/learn");
  });
});

describe("structured data", () => {
  it("describes the site and organization with the official brand name", () => {
    const graph = siteGraph()["@graph"];
    expect(graph.map((node) => node["@type"])).toEqual(["EducationalOrganization", "WebSite"]);
    expect(graph.every((node) => node.name === "SlushyMarkets")).toBe(true);
    expect(JSON.stringify(graph)).not.toMatch(/liquidity joke/i);
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

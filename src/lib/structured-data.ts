import { absoluteUrl, site, socialImage } from "@/lib/site";

const ORGANIZATION_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

/** Site wide graph: the brand as an educational organization plus the website itself. */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": ORGANIZATION_ID,
        name: site.name,
        alternateName: [site.legacyName],
        url: site.url,
        logo: absoluteUrl("/icon.png"),
        image: absoluteUrl(socialImage.url),
        description: site.description,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: site.name,
        alternateName: [site.legacyName],
        url: site.url,
        inLanguage: "en",
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** A single free, interactive learning resource page with its breadcrumb trail. */
export function learningResourceGraph({
  name,
  description,
  path,
  crumbs,
  teaches,
  minutes,
  resourceType,
}: {
  name: string;
  description: string;
  path: string;
  crumbs: Crumb[];
  teaches: string[];
  minutes?: number;
  resourceType: string;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name,
        description,
        url: absoluteUrl(path),
        inLanguage: "en",
        learningResourceType: resourceType,
        educationalLevel: "Beginner",
        teaches,
        ...(minutes ? { timeRequired: `PT${minutes}M` } : {}),
        isAccessibleForFree: true,
        image: absoluteUrl(socialImage.url),
        provider: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": WEBSITE_ID },
      },
      breadcrumbList(crumbs),
    ],
  };
}

/** A section page (lesson directory, demo, feedback) with only a breadcrumb trail. */
export function breadcrumbGraph(crumbs: Crumb[]) {
  return { "@context": "https://schema.org", ...breadcrumbList(crumbs) };
}

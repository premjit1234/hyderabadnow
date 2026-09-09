// Shared search-engine-facing helpers used across listing, project, and blog
// post pages (see listingSeo.ts, projectSeo.ts, blogSeo.ts) — kept here
// rather than duplicated three times since none of this is specific to one
// content type.

/** Relative upload paths (e.g. "/uploads/xyz.jpg") need the site's own
 * origin prepended before they're valid outside the page itself — search
 * crawlers and link-preview bots fetch metadata URLs standalone, with no
 * browser tab supplying a base URL the way a normal <img> would get one. */
export function absoluteUrl(pathOrUrl: string, appUrl: string): string {
  return pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") ? pathOrUrl : `${appUrl}${pathOrUrl}`;
}

/** JSON.stringify alone isn't safe to drop into a <script> tag as-is: a
 * listing description, project name, or blog excerpt is free text someone
 * typed, and if it ever contains the literal characters "</script>" that
 * would prematurely close the tag and let the rest be interpreted as HTML.
 * Escaping "<" neutralizes that while staying valid, parseable JSON. */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** schema.org BreadcrumbList — one of Google's documented rich-result types
 * (unlike the more specific per-page-type schemas below, which are valid
 * markup but not tied to a particular search-result treatment), so a
 * well-formed one has a real shot at showing the breadcrumb trail directly
 * in the search result instead of a raw URL. `items` should be ordered from
 * the homepage down to the current page. */
export function buildBreadcrumbJsonLd(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/site";

// Tells crawlers which parts of the site are worth indexing — everything
// public (listings, projects, blog, the browse/search pages) stays open;
// auth-gated or account-specific pages (nothing a search result should ever
// land someone on, since they can't do anything there without logging in
// first) are excluded. /admin is excluded for the same reason it should
// never end up in search results at all, not because it's secret. Points at
// sitemap.ts so crawlers discover every listing/project/post without having
// to follow links from the homepage alone.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const appUrl = await getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/login", "/signup", "/complete-profile", "/api/"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

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
      // /api/uploads/[filename] isn't an API endpoint in the "don't index
      // this" sense — it's how every admin-uploaded image is actually served
      // (listing/project photos, blog images, and a custom favicon set from
      // /admin/settings; see lib/uploads.ts), because the app's standalone
      // server can't pick up files written to public/ after it has started.
      // A blanket "/api/" disallow below was silently blocking Googlebot
      // from ever fetching any of them — including, per Google's own
      // requirement that "Googlebot-Image must be able to crawl the favicon
      // file," any custom favicon an admin uploads. This more-specific allow
      // rule wins over the disallow for that one path (longest-match-wins is
      // how Google resolves overlapping robots.txt rules) while every other
      // /api/ route (auth, payments, listings/confirm, etc.) stays blocked.
      allow: ["/", "/api/uploads/"],
      disallow: ["/admin", "/dashboard", "/login", "/signup", "/complete-profile", "/api/"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

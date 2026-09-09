import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/site";
import { getActiveListingsForSitemap, getProjectsForSitemap, getPublishedBlogPostsForSitemap } from "@/db/queries";

// Auto-generated at /sitemap.xml (Next's file-based convention — see
// node_modules/next/dist/docs/.../metadata/sitemap.md). This is the biggest
// lever for getting Google to actually find and (re)crawl every listing,
// project, and blog post rather than relying on it stumbling across links
// from the homepage/browse pages, which it may or may not fully crawl on
// its own, especially for a small/new site with few inbound links yet.
//
// Only "active" listings are included — a sold/rented/expired listing has
// nothing left to convert a searcher into, and pointing Google at pages that
// no longer represent an available property works against the exact goal
// this file exists for. (See generateMetadata in listing/[id]/page.tsx for
// the corresponding noindex on those pages directly, for anyone who reaches
// one by a link rather than by search.)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = await getAppUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: appUrl, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/browse`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${appUrl}/browse?listingType=sale`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${appUrl}/browse?listingType=rent`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${appUrl}/projects`, changeFrequency: "daily", priority: 0.7 },
    { url: `${appUrl}/blog`, changeFrequency: "daily", priority: 0.6 },
    { url: `${appUrl}/post-listing`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [listingRows, projectRows, blogRows] = await Promise.all([
    getActiveListingsForSitemap(),
    getProjectsForSitemap(),
    getPublishedBlogPostsForSitemap(),
  ]);

  const listingEntries: MetadataRoute.Sitemap = listingRows.map((l) => ({
    url: `${appUrl}/listing/${l.id}`,
    lastModified: l.createdAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Same slug-or-id fallback as lib/format.ts's projectHref, so this always
  // matches the actual URL the project page resolves at.
  const projectEntries: MetadataRoute.Sitemap = projectRows.map((p) => ({
    url: `${appUrl}/projects/${p.slug || p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogRows.map((b) => ({
    url: `${appUrl}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...listingEntries, ...projectEntries, ...blogEntries];
}

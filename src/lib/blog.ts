// Shared helpers for the blog feature — used by both the admin actions
// (validation, slug/embed generation) and the public pages (rendering).

export const BLOG_CATEGORIES = [
  "Market Trends",
  "Buying Guide",
  "Neighborhood Spotlight",
  "News",
  "General",
] as const;

/** Turns a title into a URL-safe slug, e.g. "3 BHK Trends!" -> "3-bhk-trends". */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "post";
}

// Moved to lib/video.ts (Sept 2026) since project and listing video links now
// reuse the same YouTube/Vimeo embed helper — re-exported here so existing
// imports of `getVideoEmbedUrl` from "@/lib/blog" keep working unchanged.
export { getVideoEmbedUrl } from "./video";

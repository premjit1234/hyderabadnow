// Microsite pages (see schema.ts's micrositePages) live at a root-level URL
// — hyderabadnow.in/<slug> — with no "/pages/" or "/projects/" prefix, so a
// slug an admin picks must never collide with one of the site's own
// top-level routes. Next.js itself would actually resolve a real static
// route (e.g. /blog) before ever falling through to the catch-all
// [micrositeSlug] page — see src/app/(site)/[micrositeSlug]/page.tsx's own
// comment — but that's a routing accident worth not depending on: a page
// named "blog" would still be permanently unreachable even though it "saved
// successfully", which is a confusing failure mode for an admin. Validating
// against this list up front turns that into a clear error message instead.
//
// Keep this in sync with the top-level folders under src/app/(site)/ and
// src/app/ (admin, api) whenever a new one is added.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "areas",
  "blog",
  "browse",
  "complete-profile",
  "cookies",
  "dashboard",
  "listing",
  "login",
  "messages",
  "nri-guide",
  "post-listing",
  "privacy",
  "projects",
  "signup",
  "terms",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "manifest.json",
  "buy",
  "rent",
  "sell",
  "about",
  "contact",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Same shape of validation as a blog/project slug (lib/blog.ts's slugify),
 * plus the reserved-word check above — used both to validate an admin-typed
 * slug and to judge whether an auto-suggested one needs a numeric suffix. */
export function isValidMicrositeSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 60;
}

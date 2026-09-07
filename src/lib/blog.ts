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

// Videos are a YouTube/Vimeo link only (see schema.ts comment on blogPosts) —
// this both validates what an admin pastes in and converts it to the
// embeddable player URL at render time. Deliberately strict: only these two
// hosts are recognized, so the stored value can never end up driving an
// <iframe src> pointed at an arbitrary site.
export function getVideoEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtube.com") {
    if (parsed.pathname.startsWith("/embed/")) {
      const id = parsed.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const id = parsed.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

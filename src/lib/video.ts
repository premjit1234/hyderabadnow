// Shared YouTube/Vimeo video-link helper — originally written for blog posts
// (see lib/blog.ts's history) and now reused for project and listing video
// links too (schema.ts's projects.videoUrl / listings.videoUrl). Deliberately
// strict: only these two hosts are recognized, so a stored value can never
// end up driving an <iframe src> pointed at an arbitrary site. Both the admin
// validation (`.refine(...)`) and every render-time embed conversion should
// go through this single function.
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

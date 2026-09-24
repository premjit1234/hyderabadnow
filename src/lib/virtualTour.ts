// Validates a 360°/virtual-tour embed URL — deliberately provider-agnostic,
// unlike lib/video.ts's getVideoEmbedUrl (which recognizes only YouTube/
// Vimeo and rewrites the URL into that host's specific embed format).
// Matterport, Kuula, momento360, and most other tour hosts already hand out
// a share link that works as a plain iframe src, so there's no per-provider
// URL rewriting to do here — just enough validation to make sure whatever
// gets stored can only ever end up as an http(s) iframe src, never a
// `javascript:`/`data:` URI or similar.
//
// This is intentionally looser than getVideoEmbedUrl's host allowlist: any
// agent/owner posting a listing can set this field, so in principle it lets
// them iframe any page they choose, not just a recognized tour host. That's
// the accepted tradeoff for staying provider-agnostic — if abuse becomes a
// real problem, the fix is adding a host allowlist here (same shape as
// getVideoEmbedUrl's), not touching any of this function's callers.
export function isEmbeddableTourUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

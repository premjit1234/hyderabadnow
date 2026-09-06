import { headers } from "next/headers";

/**
 * Resolves the app's own public base URL (no trailing slash), for building
 * absolute links — e.g. the listing URL embedded in a WhatsApp pre-filled
 * message. Prefers the explicit APP_URL env var (same one Google OAuth uses —
 * see .env.example) since behind a reverse proxy Next.js can't reliably infer
 * this from the incoming request; falls back to the request's own host, then
 * to the production domain as a last resort.
 */
export async function getAppUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() throws outside a request context (e.g. during static generation)
  }
  return "https://hyderabadnow.in";
}

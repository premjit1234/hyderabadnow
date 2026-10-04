import { getAppUrl } from "./site";

// IndexNow (https://www.indexnow.org) — a shared protocol Bing, Yandex,
// Seznam.cz, Naver and a few others participate in (Google does not) that
// lets a site push "this URL is new or changed" the instant it happens,
// instead of waiting for each crawler to rediscover it on its own schedule
// via sitemap.ts. For a small, young site like this one — few inbound
// links yet, so crawlers have little reason to revisit often on their own —
// that gap between "a listing/post goes live" and "a crawler notices" is
// exactly the kind of thing worth closing with a one-line API call.
//
// No account or API key signup required: a site proves ownership by
// hosting a self-chosen key at a predictable URL (see
// src/app/api/indexnow-key/route.ts, referenced below via keyLocation), and
// is then free to ping any URL on its own host. The key itself has no
// secrecy requirement — it's a domain-ownership proof, not a credential —
// so it's safe to hardcode here rather than add yet another .env var;
// generated once with `openssl rand -hex 16`. Changing it is harmless as
// long as the route above is updated to match.
const INDEXNOW_KEY = "8f3e2a6c1d9b4057a2e6c8f1b3d5e7a9c4b6d8e0f2a4c6e8";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Fire-and-forget: tells IndexNow-participating search engines that the
 * given path(s) on this site are new or just changed. Call this right after
 * a listing/blog post/project goes live or gets re-published — never
 * awaited by the caller in a way that would delay a redirect or response,
 * and never throws, since a slow or failed ping to a third-party service
 * should never be allowed to break the action that triggered it. Worst case
 * on failure: those search engines simply find the page on their own
 * schedule, exactly as they did before this existed.
 */
export function pingIndexNow(paths: string[]): void {
  if (paths.length === 0) return;

  void (async () => {
    try {
      const appUrl = await getAppUrl();
      const host = new URL(appUrl).host;
      const urlList = paths.map((p) => `${appUrl}${p.startsWith("/") ? p : `/${p}`}`);

      await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key: INDEXNOW_KEY,
          keyLocation: `${appUrl}/api/indexnow-key`,
          urlList,
        }),
      });
      // Response status isn't checked — IndexNow returns 200/202 for an
      // accepted submission, but even a non-2xx here is something to shrug
      // off rather than retry or surface, per the fire-and-forget contract
      // above.
    } catch (err) {
      console.error("[indexnow] ping failed:", err);
    }
  })();
}

export { INDEXNOW_KEY };

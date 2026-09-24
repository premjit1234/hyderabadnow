// Saved-search alert sweep — the "notify me when something new matches"
// half of saved searches (see schema.ts's comment on the savedSearches
// table and app/actions.ts's saveSearchAction for how a search gets saved
// in the first place). Runs on a repeating timer alongside the stale-listing
// sweep (see instrumentation.ts) rather than as a separate job, since this
// app is a single Node.js process with no cron container to add one to.
//
// For each saved search: re-run its stored filters through the exact same
// searchListings() query /browse itself uses (via parseBrowseSearchParams,
// shared with the /browse page — see lib/browseFilters.ts), find any result
// with an id higher than lastSeenListingId (ids are assigned in increasing
// creation order, so "higher id" is exactly "created since we last checked"),
// email the owner a short digest, and move the cursor forward.
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { savedSearches, users } from "@/db/schema";
import { searchListings } from "@/db/queries";
import { parseBrowseSearchParams, browseParamsToQueryString, type BrowseSearchParams } from "@/lib/browseFilters";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/site";
import { formatPrice, propertyTypeLabel } from "@/lib/format";

// Caps how many new listings are actually named in one email — a saved
// search with a very broad filter (or one that hasn't fired in a while)
// could otherwise match dozens at once; the email links back to /browse with
// the search's own filters for the full list instead of trying to be
// exhaustive.
const MAX_LISTINGS_PER_EMAIL = 6;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function alertEmailHtml(opts: {
  userName: string;
  label: string;
  browseUrl: string;
  listings: { title: string; locality: string; price: number; listingType: "sale" | "rent"; propertyType: string; listingUrl: string }[];
  moreCount: number;
}): string {
  const rows = opts.listings
    .map(
      (l) => `
        <li style="margin-bottom:10px;">
          <a href="${l.listingUrl}" style="color:#047857;font-weight:600;text-decoration:none;">${escapeHtml(l.title)}</a><br/>
          <span style="color:#57534e;font-size:13px;">
            ${escapeHtml(l.locality)} · ${propertyTypeLabel(l.propertyType)} · ${formatPrice(l.price, l.listingType)}
          </span>
        </li>`
    )
    .join("");

  return `
    <p>Hi ${escapeHtml(opts.userName)},</p>
    <p>New listings match your saved search "<strong>${escapeHtml(opts.label)}</strong>" on HyderabadNow:</p>
    <ul style="list-style:none;padding:0;margin:16px 0;">${rows}</ul>
    ${opts.moreCount > 0 ? `<p style="color:#78716c;font-size:13px;">...and ${opts.moreCount} more.</p>` : ""}
    <p>
      <a href="${opts.browseUrl}" style="display:inline-block;background:#047857;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">
        See all matches
      </a>
    </p>
    <p style="color:#78716c;font-size:13px;">
      You're getting this because you saved this search on HyderabadNow. Delete it from your dashboard any time to
      stop these emails.
    </p>
  `;
}

export async function runSavedSearchAlertSweep(): Promise<{ checked: number; notified: number }> {
  const appUrl = await getAppUrl();
  const searches = await db.select().from(savedSearches);
  if (searches.length === 0) return { checked: 0, notified: 0 };

  const userIds = Array.from(new Set(searches.map((s) => s.userId)));
  const owners = await db.select().from(users).where(inArray(users.id, userIds));
  const ownerById = new Map(owners.map((u) => [u.id, u]));

  let notified = 0;

  for (const search of searches) {
    const owner = ownerById.get(search.userId);
    if (!owner) continue; // orphaned row — shouldn't happen given the FK's onDelete cascade, but never crash the sweep over it

    let params: BrowseSearchParams;
    try {
      params = JSON.parse(search.filters);
    } catch {
      continue; // corrupted filters JSON — skip rather than throw and stop every other search this cycle
    }

    const { filters } = parseBrowseSearchParams(params);
    const results = await searchListings(filters);
    const newMatches = results.filter((r) => r.id > search.lastSeenListingId);

    if (newMatches.length === 0) continue;

    const highestId = Math.max(...results.map((r) => r.id));
    const browseUrl = `${appUrl}/browse?${browseParamsToQueryString(params)}`;

    const sent = await sendEmail({
      to: owner.email,
      subject: `${newMatches.length} new listing${newMatches.length === 1 ? "" : "s"} match "${search.label}"`,
      html: alertEmailHtml({
        userName: owner.name,
        label: search.label,
        browseUrl,
        listings: newMatches.slice(0, MAX_LISTINGS_PER_EMAIL).map((l) => ({
          title: l.title,
          locality: l.locality,
          price: l.price,
          listingType: l.listingType,
          propertyType: l.propertyType,
          listingUrl: `${appUrl}/listing/${l.id}`,
        })),
        moreCount: Math.max(0, newMatches.length - MAX_LISTINGS_PER_EMAIL),
      }),
    });

    // The cursor only advances once the email actually went out — same
    // "don't silently drop it" reasoning as staleListings.ts's nudge flow: a
    // Resend outage this cycle just means the same matches get retried (and
    // re-emailed) next cycle instead of being marked "seen" and lost.
    if (sent) {
      await db.update(savedSearches).set({ lastSeenListingId: highestId, lastNotifiedAt: new Date().toISOString() }).where(eq(savedSearches.id, search.id));
      notified++;
    }
  }

  return { checked: searches.length, notified };
}

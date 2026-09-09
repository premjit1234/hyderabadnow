// Core "is this listing still real?" logic — the automated half of the
// trust-and-verification nudge (the manual half is an admin just looking at
// a listing). Two things happen on a schedule (see src/instrumentation.ts,
// and the manual-run script src/db/checkStaleListings.ts):
//
//   1. Any *active* listing nobody has confirmed in STALE_NUDGE_AFTER_DAYS
//      gets a "still available?" email with one-click Yes/No links.
//   2. Any listing that was nudged and got no response within
//      STALE_AUTO_FLAG_AFTER_DAYS after that flips to status "expired" —
//      off the public site until someone confirms it again — rather than
//      sitting there active and stale forever, which is the exact complaint
//      this whole feature exists to fix.
//
// confirmListingStillAvailable / markListingNoLongerAvailable are the two
// "someone responded" endpoints, shared by both the emailed link (see
// app/api/listings/confirm/route.ts, no login required) and the logged-in
// owner's dashboard (a plain server action, ownership-checked there).
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { listings, users } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { signConfirmToken } from "@/lib/confirmToken";

export const STALE_NUDGE_AFTER_DAYS = 14;
export const STALE_AUTO_FLAG_AFTER_DAYS = 7;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function staleNudgeEmailHtml(opts: {
  ownerName: string;
  title: string;
  locality: string;
  confirmUrl: string;
  removeUrl: string;
}): string {
  return `
    <p>Hi ${escapeHtml(opts.ownerName)},</p>
    <p>Your listing "<strong>${escapeHtml(opts.title)}</strong>" in ${escapeHtml(opts.locality)} on HyderabadNow
       hasn't been confirmed in a while. Is it still available?</p>
    <p>
      <a href="${opts.confirmUrl}" style="display:inline-block;background:#047857;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:10px;">Yes, still available</a>
      <a href="${opts.removeUrl}" style="display:inline-block;background:#e7e5e4;color:#292524;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">No, take it down</a>
    </p>
    <p style="color:#78716c;font-size:13px;">If we don't hear back within ${STALE_AUTO_FLAG_AFTER_DAYS} days, we'll
       automatically mark it as expired and remove it from search results — you can always relist it later.</p>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function runStaleListingCheck(): Promise<{ nudged: number; expired: number }> {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const nudgeCutoff = daysAgoIso(STALE_NUDGE_AFTER_DAYS);

  const needsNudge = await db
    .select({
      id: listings.id,
      title: listings.title,
      locality: listings.locality,
      ownerEmail: users.email,
      ownerName: users.name,
    })
    .from(listings)
    .innerJoin(users, eq(listings.ownerId, users.id))
    .where(
      and(
        eq(listings.status, "active"),
        isNull(listings.staleNudgeSentAt),
        sql`coalesce(${listings.lastConfirmedAt}, ${listings.createdAt}) <= ${nudgeCutoff}`
      )
    );

  let nudged = 0;
  for (const row of needsNudge) {
    const confirmUrl = `${appUrl}/api/listings/confirm?token=${encodeURIComponent(
      signConfirmToken({ listingId: row.id, action: "confirm", purpose: "stale-check" })
    )}`;
    const removeUrl = `${appUrl}/api/listings/confirm?token=${encodeURIComponent(
      signConfirmToken({ listingId: row.id, action: "remove", purpose: "stale-check" })
    )}`;
    const sent = await sendEmail({
      to: row.ownerEmail,
      subject: `Is "${row.title}" still available?`,
      html: staleNudgeEmailHtml({ ownerName: row.ownerName, title: row.title, locality: row.locality, confirmUrl, removeUrl }),
    });
    // Only mark as nudged if the email actually went out — a Resend outage
    // shouldn't quietly start the auto-flag clock on a listing whose owner
    // was never actually notified.
    if (sent) {
      await db.update(listings).set({ staleNudgeSentAt: new Date().toISOString() }).where(eq(listings.id, row.id));
      nudged++;
    }
  }

  const flagCutoff = daysAgoIso(STALE_AUTO_FLAG_AFTER_DAYS);
  const toExpire = await db
    .select({ id: listings.id })
    .from(listings)
    .where(
      and(eq(listings.status, "active"), isNotNull(listings.staleNudgeSentAt), sql`${listings.staleNudgeSentAt} <= ${flagCutoff}`)
    );

  for (const row of toExpire) {
    await db
      .update(listings)
      .set({ status: "expired", autoFlaggedStaleAt: new Date().toISOString() })
      .where(eq(listings.id, row.id));
  }

  return { nudged, expired: toExpire.length };
}

/** "Yes, still available" — reactivates the listing and resets its staleness clock. */
export async function confirmListingStillAvailable(listingId: number): Promise<boolean> {
  const result = await db
    .update(listings)
    .set({
      status: "active",
      lastConfirmedAt: new Date().toISOString(),
      staleNudgeSentAt: null,
      autoFlaggedStaleAt: null,
    })
    .where(eq(listings.id, listingId))
    .returning({ id: listings.id });
  return result.length > 0;
}

/** "No, take it down" — an owner-initiated equivalent of the automatic expiry. */
export async function markListingNoLongerAvailable(listingId: number): Promise<boolean> {
  const result = await db
    .update(listings)
    .set({ status: "expired", staleNudgeSentAt: null, autoFlaggedStaleAt: null })
    .where(eq(listings.id, listingId))
    .returning({ id: listings.id });
  return result.length > 0;
}

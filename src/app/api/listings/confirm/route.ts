import { NextRequest, NextResponse } from "next/server";
import { verifyConfirmToken } from "@/lib/confirmToken";
import { confirmListingStillAvailable, markListingNoLongerAvailable } from "@/lib/staleListings";
import { db } from "@/db/client";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";

// The two links in the "still available?" nudge email (lib/staleListings.ts)
// land here — deliberately no-login-required (see confirmToken.ts for why),
// same trade-off as an unsubscribe link. Renders a tiny standalone HTML page
// rather than redirecting into the app, since there's no guarantee the
// clicker is signed in or ever will be.
function page(title: string, body: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
     <title>${title}</title>
     <style>body{font-family:system-ui,sans-serif;background:#fafaf9;color:#292524;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;}
     .card{max-width:420px;background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:32px;text-align:center;}
     a{color:#047857;font-weight:600;}</style></head>
     <body><div class="card">${body}</div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const payload = token ? verifyConfirmToken(token) : null;

  if (!payload) {
    return page("Link expired", "<h1>This link has expired or is invalid.</h1><p>Log in to your dashboard to manage your listing instead.</p>");
  }

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, payload.listingId) });
  if (!listing) {
    return page("Listing not found", "<h1>We couldn't find that listing.</h1><p>It may have already been removed.</p>");
  }

  if (payload.action === "confirm") {
    await confirmListingStillAvailable(payload.listingId);
    return page(
      "Thanks!",
      `<h1>Marked as still available</h1><p>"${listing.title}" is live again on HyderabadNow.</p><p><a href="/listing/${listing.id}">View your listing</a></p>`
    );
  }

  await markListingNoLongerAvailable(payload.listingId);
  return page(
    "Done",
    `<h1>Listing taken down</h1><p>"${listing.title}" is no longer showing in search. You can relist it anytime from your dashboard.</p><p><a href="/dashboard">Go to dashboard</a></p>`
  );
}

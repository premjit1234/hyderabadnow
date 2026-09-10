import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getListingsByOwner, getSiteSettings, getUserById } from "@/db/queries";
import { formatPrice } from "@/lib/format";
import { dashboardConfirmListingAction } from "@/app/actions";
import DashboardBanner from "@/components/DashboardBanner";
import DeleteListingButton from "@/components/DeleteListingButton";
import StatCard from "@/components/admin/StatCard";
import ListingFinancialTools from "@/components/ListingFinancialTools";
import { computeDashboardNudges } from "@/lib/dashboardNudges";

// Fallback starting price for the EMI/stamp-duty calculator when the owner
// has no sale listings of their own to derive a realistic default from (or
// for a buyer, who has none at all) — a round, plausible Hyderabad
// apartment price, not a real figure of any kind.
const DEFAULT_EMI_CALCULATOR_PRICE = 5_000_000;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-stone-900">Log in to view your dashboard</h1>
        <Link
          href="/login"
          className="mt-6 rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Log in
        </Link>
      </main>
    );
  }

  const canPost = session.role === "agent" || session.role === "seller" || session.role === "admin";
  const [myListings, { dashboardBannerImageUrl, dashboardBannerLinkUrl }, freshUser] = await Promise.all([
    canPost ? getListingsByOwner(session.id) : Promise.resolve([]),
    getSiteSettings(),
    getUserById(session.id),
  ]);

  const nudges = canPost
    ? computeDashboardNudges({ listings: myListings, phoneVerified: freshUser?.phoneVerified ?? false })
    : [];

  const saleListingPrices = myListings.filter((l) => l.listingType === "sale").map((l) => l.price);
  const emiDefaultPrice =
    saleListingPrices.length > 0
      ? Math.round(saleListingPrices.reduce((sum, p) => sum + p, 0) / saleListingPrices.length)
      : DEFAULT_EMI_CALCULATOR_PRICE;

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <DashboardBanner imageUrl={dashboardBannerImageUrl} linkUrl={dashboardBannerLinkUrl} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome, {session.name}</h1>
          <p className="text-sm text-stone-500">
            {session.email} · {session.role === "agent" ? "Agent" : session.role === "seller" ? "Owner" : session.role === "admin" ? "Admin" : "Buyer"}
          </p>
        </div>
        {canPost && (
          <Link
            href="/post-listing"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            + New listing
          </Link>
        )}
      </div>

      {canPost && myListings.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Listings" value={myListings.length} />
          <StatCard label="Total views" value={myListings.reduce((sum, l) => sum + l.views, 0)} />
          <StatCard label="Verified" value={`${myListings.filter((l) => l.verified).length}/${myListings.length}`} />
        </div>
      )}

      {nudges.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {nudges.map((n) => (
            <div
              key={n.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm ${
                n.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-stone-200 bg-stone-50 text-stone-600"
              }`}
            >
              <span>{n.message}</span>
              {n.actionHref && n.actionLabel && (
                <Link href={n.actionHref} className="shrink-0 font-semibold text-emerald-700 hover:text-emerald-800">
                  {n.actionLabel} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {canPost ? (
        myListings.length === 0 ? (
          <p className="text-stone-500">You haven&apos;t posted any listings yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {myListings.map((l) => (
                  <tr key={l.id} className="border-t border-stone-100">
                    <td className="px-4 py-3">
                      <Link href={`/listing/${l.id}`} className="font-medium text-stone-900 hover:text-emerald-700">
                        {l.title}
                      </Link>
                      <p className="text-xs text-stone-500">{l.locality}, Hyderabad</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatPrice(l.price, l.listingType as "sale" | "rent")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize">{l.status}</span>
                      {l.status === "active" && l.staleNudgeSentAt && (
                        <form action={dashboardConfirmListingAction} className="mt-1">
                          <input type="hidden" name="listingId" value={l.id} />
                          <p className="text-[11px] text-amber-600">Still available?</p>
                          <button
                            type="submit"
                            className="mt-0.5 rounded-md border border-emerald-600 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Yes, confirm
                          </button>
                        </form>
                      )}
                      {l.status === "expired" && (
                        <form action={dashboardConfirmListingAction} className="mt-1">
                          <input type="hidden" name="listingId" value={l.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-emerald-600 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            Relist as available
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          l.verified ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {l.verified ? "✓ Verified" : "Not Verified"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{l.views}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/listings/${l.id}/edit`}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          View/Edit
                        </Link>
                        <DeleteListingButton listingId={l.id} listingTitle={l.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <p className="text-stone-500">
          You&apos;re browsing as a buyer. Want to list a property?{" "}
          <span className="text-stone-700">Contact us to switch your account to an agent or owner.</span>
        </p>
      )}

      {/* Same calculator shown on a listing page (src/lib/finance.ts has the
          actual math) — here it's general-purpose rather than tied to one
          property, so buyers can plan a budget and owners/agents can sanity
          check a price even without an active sale listing. */}
      <div className="mt-8">
        <ListingFinancialTools price={emiDefaultPrice} />
      </div>
    </main>
  );
}

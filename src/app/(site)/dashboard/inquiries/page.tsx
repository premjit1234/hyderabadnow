import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getInquiriesForOwner, getOwnerLeadStats } from "@/db/queries";
import { markInquiryRespondedAction } from "@/app/actions";
import StatCard from "@/components/admin/StatCard";
import { formatDate } from "@/lib/format";

export default async function DashboardInquiriesPage() {
  const session = await getSession();
  const canPost = !!session && (session.role === "agent" || session.role === "seller" || session.role === "admin");

  if (!session || !canPost) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-stone-900">Log in to view your leads</h1>
        <Link
          href="/login"
          className="mt-6 rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Log in
        </Link>
      </main>
    );
  }

  const [allInquiries, stats] = await Promise.all([
    getInquiriesForOwner(session.id),
    getOwnerLeadStats(session.id),
  ]);

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Leads</h1>
          <p className="text-sm text-stone-500">Every inquiry sent through your listings&apos; contact forms.</p>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total inquiries" value={stats.total} />
        <StatCard label="Awaiting reply" value={stats.pending} />
        <StatCard label="Response rate" value={stats.responseRatePct != null ? `${stats.responseRatePct}%` : "—"} />
        <StatCard
          label="Avg. response time"
          value={stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : "—"}
        />
      </div>

      {allInquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No inquiries yet — they&apos;ll show up here as soon as a buyer or renter contacts you through a listing.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {allInquiries.map((inq) => (
            <div
              key={inq.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                inq.respondedAt ? "border-stone-200" : "border-amber-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{inq.name}</p>
                  <p className="text-xs text-stone-500">
                    <a href={`mailto:${inq.email}`} className="hover:underline">
                      {inq.email}
                    </a>
                    {inq.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${inq.phone}`} className="hover:underline">
                          {inq.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-400">{formatDate(inq.createdAt)}</div>
              </div>

              <p className="mt-3 text-sm text-stone-700">{inq.message}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {inq.listingId ? (
                  <Link
                    href={`/listing/${inq.listingId}`}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    About: {inq.listingTitle} →
                  </Link>
                ) : (
                  <p className="text-xs text-stone-400">Listing no longer exists</p>
                )}

                <form action={markInquiryRespondedAction}>
                  <input type="hidden" name="inquiryId" value={inq.id} />
                  {inq.respondedAt ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                        ✓ Responded {formatDate(inq.respondedAt)}
                      </span>
                      <button type="submit" className="text-xs font-medium text-stone-500 hover:underline">
                        Undo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-600 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Mark as responded
                    </button>
                  )}
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

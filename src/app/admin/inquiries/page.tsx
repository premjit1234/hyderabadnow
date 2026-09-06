import Link from "next/link";
import { getAllInquiriesForAdmin } from "@/db/queries";

export default async function AdminInquiriesPage() {
  const allInquiries = await getAllInquiriesForAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Inquiries ({allInquiries.length})</h1>
      <p className="mt-1 mb-5 text-sm text-stone-500">Messages buyers and renters sent through listing contact forms.</p>

      {allInquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No inquiries yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {allInquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{inq.name}</p>
                  <p className="text-xs text-stone-500">
                    {inq.email}
                    {inq.phone && ` · ${inq.phone}`}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-400">
                  {new Date(inq.createdAt).toLocaleString("en-IN")}
                </div>
              </div>
              <p className="mt-3 text-sm text-stone-700">{inq.message}</p>
              {inq.listingId ? (
                <Link
                  href={`/listing/${inq.listingId}`}
                  className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline"
                >
                  About: {inq.listingTitle} →
                </Link>
              ) : (
                <p className="mt-3 text-xs text-stone-400">Listing no longer exists</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

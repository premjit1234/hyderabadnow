import Link from "next/link";
import { getAllInquiriesForAdmin, getAllProjectInquiriesForAdmin, getAllMicrositePageInquiriesForAdmin } from "@/db/queries";

export default async function AdminInquiriesPage() {
  const [allInquiries, allProjectInquiries, allPageInquiries] = await Promise.all([
    getAllInquiriesForAdmin(),
    getAllProjectInquiriesForAdmin(),
    getAllMicrositePageInquiriesForAdmin(),
  ]);

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

      {/* Separate section rather than merging into the list above — projects
          have no ownerId the way listings do (they're admin-curated, not
          user-submitted), so these don't belong to any one agent/seller and
          only ever show up here. See projectInquiries' schema.ts comment. */}
      <h2 className="mt-10 text-xl font-bold text-stone-900">Project inquiries ({allProjectInquiries.length})</h2>
      <p className="mt-1 mb-5 text-sm text-stone-500">Messages sent through project showcase pages.</p>

      {allProjectInquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No project inquiries yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {allProjectInquiries.map((inq) => (
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
              {inq.projectId ? (
                <Link
                  href={`/projects/${inq.projectSlug ?? inq.projectId}`}
                  className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline"
                >
                  About: {inq.projectName} →
                </Link>
              ) : (
                <p className="mt-3 text-xs text-stone-400">Project no longer exists</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Third and final section — microsite pages (/admin/pages) are a
          fully independent content type from both listings and projects, so
          their enquiries get their own parallel table and section here too.
          See micrositePageInquiries' schema.ts comment. */}
      <h2 className="mt-10 text-xl font-bold text-stone-900">Page inquiries ({allPageInquiries.length})</h2>
      <p className="mt-1 mb-5 text-sm text-stone-500">Messages sent through standalone pages (/admin/pages).</p>

      {allPageInquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No page inquiries yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {allPageInquiries.map((inq) => (
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
              {inq.pageId ? (
                <Link href={`/${inq.pageSlug}`} className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline">
                  About: {inq.pageName} →
                </Link>
              ) : (
                <p className="mt-3 text-xs text-stone-400">Page no longer exists</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

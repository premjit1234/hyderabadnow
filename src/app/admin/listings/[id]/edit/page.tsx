import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById, getProjectsForSelect } from "@/db/queries";
import { formatPrice } from "@/lib/format";
import AdminListingEditForm from "@/components/admin/AdminListingEditForm";

export default async function AdminEditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const listing = await getListingById(listingId);
  if (!listing) notFound();

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const projects = await getProjectsForSelect();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Listing detail</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">{listing.title}</p>
      {saved && (
        <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Owner</p>
          <p className="text-sm font-medium text-stone-900">{listing.owner?.name ?? "deleted user"}</p>
          {listing.owner?.email && <p className="text-xs text-stone-500">{listing.owner.email}</p>}
          {listing.owner?.phone && <p className="text-xs text-stone-500">{listing.owner.phone}</p>}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Listed price</p>
          <p className="text-sm font-medium text-stone-900">
            {formatPrice(listing.price, listing.listingType as "sale" | "rent")}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Views</p>
          <p className="text-sm font-medium text-stone-900">{listing.views}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Posted</p>
          <p className="text-sm font-medium text-stone-900">
            {new Date(listing.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        {listing.project && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Project</p>
            <Link href={`/projects/${listing.project.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
              {listing.project.name} →
            </Link>
          </div>
        )}
        <div className="col-span-2 sm:col-span-4">
          <Link href={`/listing/${listing.id}`} className="text-xs font-medium text-stone-500 hover:text-indigo-700 hover:underline">
            View public listing page →
          </Link>
        </div>
      </div>

      <AdminListingEditForm listing={listing} projects={projects} />
    </div>
  );
}

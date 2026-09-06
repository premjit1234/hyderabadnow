import { notFound } from "next/navigation";
import { getListingById, getProjectsForSelect } from "@/db/queries";
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
      <h1 className="text-xl font-bold text-stone-900">Edit listing</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">{listing.title}</p>
      {saved && (
        <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>
      )}
      <AdminListingEditForm listing={listing} projects={projects} />
    </div>
  );
}

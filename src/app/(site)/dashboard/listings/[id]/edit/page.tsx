import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getListingById, getProjectsForSelect, getLocationNames, getAmenityCatalog } from "@/db/queries";
import { getSession } from "@/lib/auth";
import OwnListingEditForm from "@/components/OwnListingEditForm";

// Owner-facing counterpart to admin/listings/[id]/edit/page.tsx — reached
// from the dashboard's "View/Edit" link. Same data-fetching shape as the
// admin page (listing + projects/localities/amenities in parallel, "saved=1"
// banner), but gated by ownership instead of the /admin layout's
// requireAdmin(): anyone not logged in, or logged in as someone else
// entirely, is bounced before the listing (or even its existence) is
// revealed. An admin can also reach this page directly, matching the
// ownership-or-admin check already used in updateOwnListingAction and
// deleteOwnListingAction.
export default async function DashboardEditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const listing = await getListingById(listingId);
  if (!listing) notFound();
  if (listing.ownerId !== session.id && session.role !== "admin") notFound();

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const [projects, localities, amenityCatalog] = await Promise.all([
    getProjectsForSelect(),
    getLocationNames(),
    getAmenityCatalog(),
  ]);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 text-xl font-bold text-stone-900">Edit listing</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">{listing.title}</p>
      {saved && (
        <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>
      )}

      <OwnListingEditForm listing={listing} projects={projects} localities={localities} amenityCatalog={amenityCatalog} />
    </main>
  );
}

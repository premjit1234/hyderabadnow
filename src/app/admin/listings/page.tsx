import Link from "next/link";
import { getAllListingsForAdmin } from "@/db/queries";
import { formatPrice } from "@/lib/format";
import {
  adminUpdateListingStatusAction,
  adminToggleFeaturedAction,
  adminToggleVerifiedAction,
  adminDeleteListingAction,
} from "@/app/admin/actions";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const ownerParam = typeof sp.owner === "string" ? Number(sp.owner) : undefined;
  const ownerId = ownerParam && Number.isInteger(ownerParam) ? ownerParam : undefined;

  const allListings = await getAllListingsForAdmin({ ownerId, q });
  const ownerLabel = ownerId ? allListings[0]?.ownerName ?? `owner #${ownerId}` : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Listings ({allListings.length})</h1>
          <p className="mt-1 text-sm text-stone-500">Change status, feature, edit, or remove any listing.</p>
        </div>
        <form className="flex gap-2">
          {ownerId && <input type="hidden" name="owner" value={ownerId} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search title or locality…"
            className="w-56 rounded-md border border-stone-200 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Search
          </button>
        </form>
      </div>

      {ownerId && (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-indigo-50 p-3 text-sm text-indigo-800">
          Showing listings owned by <strong>{ownerLabel}</strong>.
          <Link href="/admin/listings" className="font-medium underline">
            Clear filter
          </Link>
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {allListings.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <Link href={`/listing/${l.id}`} className="font-medium text-stone-900 hover:text-indigo-700">
                    {l.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {l.ownerName ?? <span className="text-stone-400">deleted user</span>}
                  {l.ownerEmail && <p className="text-xs text-stone-400">{l.ownerEmail}</p>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                  {formatPrice(l.price, l.listingType as "sale" | "rent")}
                </td>
                <td className="px-4 py-3">
                  <form action={adminUpdateListingStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="listingId" value={l.id} />
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="rounded-md border border-stone-200 px-2 py-1 text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:border-indigo-600 hover:text-indigo-700"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={adminToggleFeaturedAction}>
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        l.featured ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {l.featured ? "Featured" : "Not featured"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={adminToggleVerifiedAction}>
                    <input type="hidden" name="listingId" value={l.id} />
                    <button
                      type="submit"
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        l.verified ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {l.verified ? "✓ Verified" : "Not Verified"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-stone-600">{l.views}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/listings/${l.id}/edit`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <form action={adminDeleteListingAction}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {allListings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                  No listings match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

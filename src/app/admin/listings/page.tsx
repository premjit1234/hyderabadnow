import Link from "next/link";
import { getAllListingsForAdmin } from "@/db/queries";
import { formatPrice } from "@/lib/format";
import {
  adminUpdateListingStatusAction,
  adminToggleFeaturedAction,
  adminDeleteListingAction,
} from "@/app/admin/actions";

export default async function AdminListingsPage() {
  const allListings = await getAllListingsForAdmin();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-stone-900">All listings ({allListings.length})</h2>
      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {allListings.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <Link href={`/listing/${l.id}`} className="font-medium text-stone-900 hover:text-emerald-700">
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
                      className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:border-emerald-600 hover:text-emerald-700"
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
                        l.featured ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {l.featured ? "Featured" : "Not featured"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-stone-600">{l.views}</td>
                <td className="px-4 py-3">
                  <form action={adminDeleteListingAction}>
                    <input type="hidden" name="listingId" value={l.id} />
                    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getListingsByOwner } from "@/db/queries";
import { formatPrice } from "@/lib/format";

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
  const myListings = canPost ? await getListingsByOwner(session.id) : [];

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-10 sm:px-6">
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
                  <th className="px-4 py-3">Views</th>
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
                    <td className="px-4 py-3 capitalize">{l.status}</td>
                    <td className="px-4 py-3">{l.views}</td>
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
    </main>
  );
}

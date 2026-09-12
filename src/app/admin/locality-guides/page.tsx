import Link from "next/link";
import { getAllLocalityGuidesForAdmin } from "@/db/queries";
import { formatDate } from "@/lib/format";
import { adminDeleteLocalityGuideAction } from "@/app/admin/actions";

export default async function AdminLocalityGuidesPage() {
  const guides = await getAllLocalityGuidesForAdmin();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Locality guides ({guides.length})</h1>
          <p className="mt-1 text-sm text-stone-500">
            Area pages for local SEO — connectivity, infra, and a full write-up per locality.
          </p>
        </div>
        <Link
          href="/admin/locality-guides/new"
          className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New guide
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Locality</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {guides.map((g) => (
              <tr key={g.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">{g.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      g.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {g.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">{g.displayOrder}</td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-500">{formatDate(g.publishedAt ?? g.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/locality-guides/${g.id}/edit`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <form action={adminDeleteLocalityGuideAction}>
                      <input type="hidden" name="guideId" value={g.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {guides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No locality guides yet — write your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

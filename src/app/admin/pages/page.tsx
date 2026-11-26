import Link from "next/link";
import { getAllMicrositePagesForAdmin } from "@/db/queries";
import { adminDeleteMicrositePageAction } from "@/app/admin/micrositeActions";

export default async function AdminMicrositePagesListPage() {
  const pages = await getAllMicrositePagesForAdmin();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Pages ({pages.length})</h1>
          <p className="mt-1 text-sm text-stone-500">
            Standalone, full-detail pages for flagship developments — each lives at its own hyderabadnow.in/&lt;url&gt;,
            independent of /admin/projects.
          </p>
        </div>
        <Link href="/admin/pages/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          + New page
        </Link>
      </div>

      {pages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No pages yet — create one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Locality</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        /{p.slug} →
                      </a>
                    ) : (
                      <span className="text-stone-400">/{p.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.locality}, {p.city}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.published ? "Published" : "Draft"}
                    </span>
                    {p.featured && <span className="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Featured</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/pages/${p.id}/edit`} className="text-xs font-medium text-indigo-600 hover:underline">
                        Edit
                      </Link>
                      <form action={adminDeleteMicrositePageAction}>
                        <input type="hidden" name="pageId" value={p.id} />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

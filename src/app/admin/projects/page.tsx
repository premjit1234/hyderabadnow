import Link from "next/link";
import Image from "next/image";
import { getAllProjectsForAdmin } from "@/db/queries";
import { adminDeleteProjectAction } from "@/app/admin/actions";

export default async function AdminProjectsPage() {
  const allProjects = await getAllProjectsForAdmin();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Projects ({allProjects.length})</h1>
          <p className="mt-1 text-sm text-stone-500">
            Developer communities. Any listing can optionally belong to one — see its Sale/Rent counts below.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add project
        </Link>
      </div>

      {allProjects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No projects yet — add one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Locality</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((p) => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-stone-100">
                        {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="60px" className="object-cover" />}
                      </div>
                      <Link href={`/projects/${p.id}`} className="font-medium text-stone-900 hover:text-indigo-700">
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{p.locality}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{p.totalUnits ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.saleListings} sale · {p.rentListings} rent
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/projects/${p.id}/edit`} className="text-xs font-medium text-indigo-600 hover:underline">
                        Edit
                      </Link>
                      <form action={adminDeleteProjectAction}>
                        <input type="hidden" name="projectId" value={p.id} />
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

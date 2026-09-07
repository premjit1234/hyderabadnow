import Link from "next/link";
import { getAllBlogPostsForAdmin } from "@/db/queries";
import { formatDate } from "@/lib/format";
import { adminDeleteBlogPostAction } from "@/app/admin/actions";

export default async function AdminBlogPage() {
  const posts = await getAllBlogPostsForAdmin();
  const totalPending = posts.reduce((sum, p) => sum + p.pendingComments, 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Blog ({posts.length})</h1>
          <p className="mt-1 text-sm text-stone-500">Write, edit, and publish articles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog/comments"
            className="whitespace-nowrap rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-300"
          >
            Comments{totalPending > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{totalPending} pending</span>}
          </Link>
          <Link
            href="/admin/blog/new"
            className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New post
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Comments</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">{p.title}</td>
                <td className="px-4 py-3 text-stone-600">{p.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {p.pendingComments > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {p.pendingComments} pending
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-500">{formatDate(p.publishedAt ?? p.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/blog/${p.id}/edit`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <form action={adminDeleteBlogPostAction}>
                      <input type="hidden" name="postId" value={p.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  No posts yet — write your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

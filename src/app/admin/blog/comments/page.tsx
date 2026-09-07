import Link from "next/link";
import { getAllBlogCommentsForAdmin } from "@/db/queries";
import { formatDate } from "@/lib/format";
import { adminModerateBlogCommentAction, adminDeleteBlogCommentAction } from "@/app/admin/actions";

export default async function AdminBlogCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : "pending";
  const status = statusParam === "all" ? undefined : (statusParam as "pending" | "approved" | "rejected");

  const comments = await getAllBlogCommentsForAdmin(status);

  const tabs: { key: string; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <div className="mb-5">
        <Link href="/admin/blog" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to blog
        </Link>
        <h1 className="mt-2 text-xl font-bold text-stone-900">Comments</h1>
        <p className="mt-1 text-sm text-stone-500">
          New comments are hidden from the site until approved.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/blog/comments?status=${t.key}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              statusParam === t.key ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
              <div>
                <span className="font-semibold text-stone-800">{c.userName}</span> on{" "}
                <Link href={`/blog/${c.postSlug}`} target="_blank" className="font-medium text-indigo-600 hover:underline">
                  {c.postTitle}
                </Link>
                {" · "}
                {formatDate(c.createdAt)}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : c.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                {c.status}
              </span>
            </div>
            <p className="mb-3 whitespace-pre-line text-sm text-stone-800">{c.content}</p>
            <div className="flex items-center gap-3">
              {c.status !== "approved" && (
                <form action={adminModerateBlogCommentAction}>
                  <input type="hidden" name="commentId" value={c.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                    Approve
                  </button>
                </form>
              )}
              {c.status !== "rejected" && (
                <form action={adminModerateBlogCommentAction}>
                  <input type="hidden" name="commentId" value={c.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit" className="text-xs font-medium text-stone-500 hover:underline">
                    Reject
                  </button>
                </form>
              )}
              <form action={adminDeleteBlogCommentAction}>
                <input type="hidden" name="commentId" value={c.id} />
                <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-400">
            No comments here.
          </p>
        )}
      </div>
    </div>
  );
}

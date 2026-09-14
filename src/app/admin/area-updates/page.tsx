import Link from "next/link";
import Image from "next/image";
import { getAllAreaUpdatesForAdmin } from "@/db/queries";
import { formatDate } from "@/lib/format";
import { adminDeleteAreaUpdateAction, adminDeleteAreaUpdateCommentAction } from "@/app/admin/actions";

export default async function AdminAreaUpdatesPage() {
  const updates = await getAllAreaUpdatesForAdmin();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-stone-900">Neighborhood updates</h1>
        <p className="mt-1 text-sm text-stone-500">
          Posted by logged-in users directly on area guide pages — these go live immediately, with no pre-approval.
          Remove anything spammy, off-topic, or inappropriate here.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {updates.map((u) => (
          <div key={u.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
              <div>
                <span className="font-semibold text-stone-800">{u.authorName ?? "Deleted user"}</span> on{" "}
                <Link
                  href={`/areas/${u.localityGuideSlug}#update-${u.id}`}
                  target="_blank"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {u.localityGuideName}
                </Link>
                {" · "}
                {formatDate(u.createdAt)}
                {" · "}
                score {u.score >= 0 ? `+${u.score}` : u.score}
                {" · "}
                {u.commentCount} comment{u.commentCount === 1 ? "" : "s"}
              </div>
              <form action={adminDeleteAreaUpdateAction}>
                <input type="hidden" name="id" value={u.id} />
                <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                  Delete post
                </button>
              </form>
            </div>

            <p className="mb-3 whitespace-pre-line text-sm text-stone-800">{u.content}</p>

            {u.images.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {u.images.map((img) => (
                  <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-md bg-stone-100">
                    <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {u.comments.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
                {u.comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-stone-700">{c.userName}</span>{" "}
                      <span className="text-stone-400">{formatDate(c.createdAt)}</span>
                      <p className="mt-0.5 whitespace-pre-line text-stone-600">{c.content}</p>
                    </div>
                    <form action={adminDeleteAreaUpdateCommentAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="shrink-0 font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {updates.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-400">
            No neighborhood updates posted yet.
          </p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostForAdminEdit } from "@/db/queries";
import AdminBlogPostForm from "@/components/admin/AdminBlogPostForm";

export default async function AdminEditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const post = await getBlogPostForAdminEdit(postId);
  if (!post) notFound();

  const sp = await searchParams;
  const saved = sp.saved === "1";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Edit post</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        {post.status === "published" ? (
          <Link href={`/blog/${post.slug}`} target="_blank" className="text-indigo-600 hover:underline">
            View live post →
          </Link>
        ) : (
          "Not published yet."
        )}
      </p>
      {saved && <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>}
      <AdminBlogPostForm post={post} />
    </div>
  );
}

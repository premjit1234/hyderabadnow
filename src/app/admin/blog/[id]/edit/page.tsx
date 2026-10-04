import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostForAdminEdit } from "@/db/queries";
import { getAppUrl } from "@/lib/site";
import { buildBlogSocialCaption } from "@/lib/socialCaption";
import AdminBlogPostForm from "@/components/admin/AdminBlogPostForm";
import PromoteShareLinks from "@/components/admin/PromoteShareLinks";

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

  const appUrl = await getAppUrl();
  const postUrl = `${appUrl}/blog/${post.slug}`;
  const caption = buildBlogSocialCaption(post, postUrl);

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

      {post.status === "published" && (
        <div className="mb-6">
          <PromoteShareLinks url={postUrl} caption={caption} />
        </div>
      )}

      <AdminBlogPostForm post={post} />
    </div>
  );
}

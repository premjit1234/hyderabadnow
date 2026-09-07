import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { sanitizeBlogContent } from "@/lib/sanitizeHtml";
import { getVideoEmbedUrl } from "@/lib/blog";
import BlogCommentForm from "@/components/BlogCommentForm";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, session] = await Promise.all([getBlogPostBySlug(slug), getSession()]);

  if (!post || post.status !== "published") notFound();

  const embedUrl = post.videoUrl ? getVideoEmbedUrl(post.videoUrl) : null;
  // Sanitized again here at render time, on top of the sanitizing already
  // done when the post was saved — see lib/sanitizeHtml.ts for why.
  const safeContent = sanitizeBlogContent(post.contentHtml);

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/blog" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to blog
      </Link>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">{post.category}</p>
      <h1 className="mt-1 text-3xl font-bold text-stone-900">{post.title}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {formatDate(post.publishedAt ?? post.createdAt)}
        {post.author && <> · By {post.author.name}</>}
      </p>

      {post.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-stone-100">
          <Image src={post.coverImageUrl} alt={post.title} fill sizes="768px" className="object-cover" priority />
        </div>
      )}

      {embedUrl && (
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={embedUrl}
            title={post.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div
        className="blog-content mt-6"
        // Rendered from HTML sanitized against a narrow tag/attribute
        // allowlist immediately above — see lib/sanitizeHtml.ts.
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      {post.images.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {post.images.map((img) => (
            <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
              <Image src={img.url} alt="" fill sizes="240px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <section className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="mb-4 text-lg font-bold text-stone-900">
          Comments {post.comments.length > 0 && `(${post.comments.length})`}
        </h2>

        {session ? (
          <BlogCommentForm postId={post.id} />
        ) : (
          <p className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>{" "}
            to leave a comment.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {post.comments.map((c) => (
            <div key={c.id} className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm font-semibold text-stone-900">{c.userName}</p>
              <p className="text-xs text-stone-400">{formatDate(c.createdAt)}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{c.content}</p>
            </div>
          ))}
          {post.comments.length === 0 && <p className="text-sm text-stone-400">Be the first to comment.</p>}
        </div>
      </section>
    </main>
  );
}

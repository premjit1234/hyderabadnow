import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogPosts, getBlogCategoriesInUse } from "@/db/queries";
import { formatDate } from "@/lib/format";

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPublishedBlogPosts({ page, category }),
    getBlogCategoriesInUse(),
  ]);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Blog</h1>
      <p className="mt-1 mb-6 text-stone-500">
        Market trends, buying guides, and neighborhood spotlights for Hyderabad real estate.
      </p>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              !category ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                category === c ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-500">
          No posts yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                {post.coverImageUrl ? (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">No photo</div>
                )}
                <span className="absolute left-2 top-2 rounded bg-stone-900/80 px-2 py-0.5 text-xs font-semibold text-white">
                  {post.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <p className="line-clamp-2 text-base font-bold text-stone-900">{post.title}</p>
                {post.excerpt && <p className="line-clamp-2 text-sm text-stone-500">{post.excerpt}</p>}
                <p className="mt-1 text-xs text-stone-400">{formatDate(post.publishedAt ?? post.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/blog?${new URLSearchParams({ ...(category ? { category } : {}), page: String(p) }).toString()}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                p === page ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

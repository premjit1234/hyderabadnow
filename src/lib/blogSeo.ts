// Search-engine-facing helpers for a blog post's page (see
// src/app/(site)/blog/[slug]/page.tsx) — same pattern as listingSeo.ts and
// projectSeo.ts, applied to blog posts.
import { absoluteUrl, buildBreadcrumbJsonLd } from "./seo";

type BlogPostForSeo = {
  slug: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  authorName?: string | null;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Falls back to the post's own rendered content when no excerpt was set at
// write time — every published post ends up with a real description either
// way, rather than search engines seeing nothing or falling back to the
// site-wide description every other page used to share.
export function buildBlogSeoDescription(post: Pick<BlogPostForSeo, "excerpt" | "contentHtml">): string {
  const source = post.excerpt && post.excerpt.trim() ? post.excerpt.trim() : stripHtml(post.contentHtml);
  return source.slice(0, 158);
}

/** schema.org BlogPosting — Google's documented type for blog/article
 * content; unlike RealEstateListing/ApartmentComplex above, this one can
 * actually surface as an Article-type rich result (byline, date) when the
 * rest of the page's signals support it. */
export function buildBlogPostJsonLd(post: BlogPostForSeo, appUrl: string) {
  const url = `${appUrl}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    url,
    mainEntityOfPage: url,
    headline: post.title,
    description: buildBlogSeoDescription(post),
    ...(post.coverImageUrl && { image: [absoluteUrl(post.coverImageUrl, appUrl)] }),
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    dateModified: post.updatedAt,
    ...(post.authorName && { author: { "@type": "Person", name: post.authorName } }),
    publisher: {
      "@type": "Organization",
      name: "HyderabadNow",
      url: appUrl,
    },
  };
}

export function buildBlogBreadcrumbJsonLd(post: Pick<BlogPostForSeo, "slug" | "title">, appUrl: string) {
  return buildBreadcrumbJsonLd([
    { name: "Home", item: appUrl },
    { name: "Blog", item: `${appUrl}/blog` },
    { name: post.title, item: `${appUrl}/blog/${post.slug}` },
  ]);
}

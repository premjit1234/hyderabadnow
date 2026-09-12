import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocalityGuideBySlug } from "@/db/queries";
import { getAppUrl } from "@/lib/site";
import { getVideoEmbedUrl } from "@/lib/video";
import { sanitizeBlogContent } from "@/lib/sanitizeHtml";
import { absoluteUrl, jsonLdScriptContent, buildBreadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getLocalityGuideBySlug(slug);
  if (!guide || guide.status !== "published") return {};

  const appUrl = await getAppUrl();
  const url = `${appUrl}/areas/${guide.slug}`;
  const description = guide.excerpt || `${guide.name} area guide: connectivity, infrastructure, and what it's like to live there.`;
  const image = guide.heroImageUrl ? absoluteUrl(guide.heroImageUrl, appUrl) : null;

  return {
    title: `${guide.title} | HyderabadNow`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description,
      url,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function AreaGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [guide, appUrl] = await Promise.all([getLocalityGuideBySlug(slug), getAppUrl()]);

  if (!guide || guide.status !== "published") notFound();

  // Sanitized again here at render time, on top of the sanitizing already
  // done when the guide was saved — same defense-in-depth as blog posts,
  // see lib/sanitizeHtml.ts.
  const safeContent = sanitizeBlogContent(guide.contentHtml);
  const embedUrl = guide.videoUrl ? getVideoEmbedUrl(guide.videoUrl) : null;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", item: appUrl },
    { name: "Area guides", item: `${appUrl}/areas` },
    { name: guide.name, item: `${appUrl}/areas/${guide.slug}` },
  ]);

  const highlights = [
    { label: "Metro connectivity", value: guide.metroConnectivity },
    { label: "ORR access", value: guide.orrAccess },
    { label: "Upcoming infrastructure", value: guide.upcomingInfra },
  ].filter((h) => h.value);

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(breadcrumbJsonLd) }}
      />

      <Link href="/areas" className="text-sm font-medium text-indigo-600 hover:underline">
        ← All area guides
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-stone-900">{guide.title}</h1>
      {guide.author && <p className="mt-2 text-sm text-stone-500">By {guide.author.name}</p>}

      {guide.heroImageUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-stone-100">
          <Image src={guide.heroImageUrl} alt={guide.name} fill sizes="768px" className="object-cover" priority />
        </div>
      )}

      {embedUrl && (
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={embedUrl}
            title={guide.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {highlights.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.label} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{h.label}</p>
              <p className="mt-1 text-sm text-stone-700">{h.value}</p>
            </div>
          ))}
        </div>
      )}

      <div
        className="blog-content mt-8"
        // Rendered from HTML sanitized against a narrow tag/attribute
        // allowlist immediately above — see lib/sanitizeHtml.ts.
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      <div className="mt-10 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-medium text-stone-800">Looking for a property in {guide.name}?</p>
        <Link
          href={`/browse?q=${encodeURIComponent(guide.name)}`}
          className="mt-3 inline-block rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Browse listings in {guide.name}
        </Link>
      </div>

      <p className="mt-6 text-xs text-stone-400">
        Infrastructure timelines are based on public reporting and can change — always confirm current status with
        the relevant authority (HMDA/NHAI/L&amp;TMRHL) before making a buying decision based on planned projects.
      </p>
    </main>
  );
}

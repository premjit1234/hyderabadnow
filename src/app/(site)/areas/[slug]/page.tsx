import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocalityGuideBySlug, getAreaUpdatesForGuide } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/site";
import { getVideoEmbedUrl } from "@/lib/video";
import { sanitizeBlogContent } from "@/lib/sanitizeHtml";
import { absoluteUrl, jsonLdScriptContent, buildBreadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import AreaUpdatePostForm from "@/components/AreaUpdatePostForm";
import AreaUpdateCommentForm from "@/components/AreaUpdateCommentForm";
import AreaUpdateVoteButtons from "@/components/AreaUpdateVoteButtons";
import AreaUpdateShareButton from "@/components/AreaUpdateShareButton";

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
  const [guide, appUrl, session] = await Promise.all([getLocalityGuideBySlug(slug), getAppUrl(), getSession()]);

  if (!guide || guide.status !== "published") notFound();

  const updates = await getAreaUpdatesForGuide(guide.id, session?.id);

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

      <section className="mt-10 border-t border-stone-200 pt-8">
        <h2 className="text-lg font-bold text-stone-900">Latest neighborhood updates</h2>
        <p className="mt-1 text-sm text-stone-500">
          New roads, restaurants opening, anything worth flagging about {guide.name} — posted by people living here.
        </p>

        {session ? (
          <div className="mt-4">
            <AreaUpdatePostForm localityGuideId={guide.id} />
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>{" "}
            to post an update.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6">
          {updates.map((u) => (
            <div key={u.id} id={`update-${u.id}`} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{u.authorName ?? "A HyderabadNow user"}</p>
                  <p className="text-xs text-stone-400">{formatDate(u.createdAt)}</p>
                </div>
                <AreaUpdateShareButton
                  url={`${appUrl}/areas/${guide.slug}#update-${u.id}`}
                  title={`Update in ${guide.name}`}
                />
              </div>

              <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{u.content}</p>

              {u.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {u.images.map((img) => (
                    <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                      <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <AreaUpdateVoteButtons
                  areaUpdateId={u.id}
                  localitySlug={guide.slug}
                  score={u.score}
                  myVote={u.myVote}
                  canVote={Boolean(session)}
                />
              </div>

              <div className="mt-4 border-t border-stone-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Comments {u.comments.length > 0 && `(${u.comments.length})`}
                </p>

                {session ? (
                  <div className="mt-2">
                    <AreaUpdateCommentForm areaUpdateId={u.id} />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-stone-400">
                    <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                      Log in
                    </Link>{" "}
                    to comment.
                  </p>
                )}

                <div className="mt-3 flex flex-col gap-3">
                  {u.comments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-semibold text-stone-800">{c.userName}</span>{" "}
                      <span className="text-xs text-stone-400">{formatDate(c.createdAt)}</span>
                      <p className="mt-0.5 whitespace-pre-line text-stone-700">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {updates.length === 0 && (
            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-400">
              No updates yet — be the first to share what&apos;s new in {guide.name}.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

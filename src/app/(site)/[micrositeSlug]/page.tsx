import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublishedMicrositePageBySlug, getRelatedMicrositePages } from "@/db/queries";
import { propertyTypeLabel } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getAppUrl } from "@/lib/site";
import { AMENITIES, parseAmenities } from "@/lib/amenities";
import { getVideoEmbedUrl } from "@/lib/video";
import { isEmbeddableTourUrl } from "@/lib/virtualTour";
import { absoluteUrl } from "@/lib/seo";
import AmenityIcon from "@/components/AmenityIcon";
import ProjectGallery from "@/components/ProjectGallery";
import MicrositePageInquiryForm from "@/components/MicrositePageInquiryForm";
import { nearestMetroStation, distancesToHubs } from "@/lib/hyderabadGeo";
import { isReservedSlug } from "@/lib/reservedSlugs";

// Root-level microsite pages — hyderabadnow.in/<slug> — for one flagship
// development at a time, independent of /admin/projects (see
// schema.ts's micrositePages comment). This dynamic segment is a *sibling*
// of every other folder under src/app/(site)/ (blog, projects, browse, …),
// and Next.js always resolves a matching static route before ever falling
// through to a dynamic one at the same level — so /blog still serves the
// real blog, and only a slug with no matching static route (and not in
// lib/reservedSlugs.ts, which adminCreateMicrositePageAction/
// adminUpdateMicrositePageAction both check before ever saving a slug)
// reaches this file.
export async function generateMetadata({ params }: { params: Promise<{ micrositeSlug: string }> }): Promise<Metadata> {
  const { micrositeSlug } = await params;
  if (isReservedSlug(micrositeSlug)) return {};

  const page = await getPublishedMicrositePageBySlug(micrositeSlug);
  if (!page) return {};

  const appUrl = await getAppUrl();
  const url = `${appUrl}/${page.slug}`;
  const title = `${page.name} — ${page.locality}, ${page.city}`;
  const description =
    page.description?.slice(0, 160) ||
    `${page.name} in ${page.locality}, ${page.city}. ${propertyTypeLabel(page.propertyType)} by ${page.developerName ?? "a leading developer"}.`;
  const firstImage = page.images[0] ? absoluteUrl(page.images[0].url, appUrl) : null;

  return {
    title: `${title} | HyderabadNow`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: firstImage ? [{ url: firstImage }] : undefined },
  };
}

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M4.5 4h3l1.5 5-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3 5.6 1.5 1.5 0 0 1 4.5 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.44 1.32 4.94L2 22l5.31-1.39a9.9 9.9 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.45 9.9-9.91C22 6.45 17.5 2 12.04 2Zm5.8 14.15c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11a16 16 0 0 1-1.65-.61c-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36h.55c.18 0 .43-.03.66.51.24.56.83 1.94.9 2.08.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.26.13.44.19.5.3.06.11.06.62-.18 1.3Z" />
    </svg>
  );
}
function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "master-plan", label: "Master Plan" },
  { id: "floor-plans", label: "Floor Plans" },
  { id: "amenities", label: "Amenities" },
  { id: "specifications", label: "Specifications" },
  { id: "location", label: "Location" },
  { id: "gallery", label: "Gallery" },
  { id: "videos", label: "Videos" },
  { id: "contact", label: "Contact" },
] as const;

const sectionCard = "rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8";
const sectionHeading = "mb-1 text-2xl font-bold tracking-tight text-stone-900";

/** Parses a nearbyPlaces row's newline-separated "Name — distance" lines into
 * a plain list — see micrositePageNearbyPlaces's schema.ts comment. Each
 * line is shown as-is; a line with no " — " just renders as a bare name. */
function parseNearbyItems(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function MicrositePage({ params }: { params: Promise<{ micrositeSlug: string }> }) {
  const { micrositeSlug } = await params;
  if (isReservedSlug(micrositeSlug)) notFound();

  const page = await getPublishedMicrositePageBySlug(micrositeSlug);
  if (!page) notFound();

  const relatedPages = await getRelatedMicrositePages(page.id);

  const amenityKeys = parseAmenities(page.amenities);
  const pageAmenities = AMENITIES.filter((a) => amenityKeys.includes(a.key));
  const bhkList = page.bhkOptions ? page.bhkOptions.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const videoEmbeds = page.videos
    .map((v) => ({ title: v.title, embedUrl: getVideoEmbedUrl(v.url) }))
    .filter((v): v is { title: string | null; embedUrl: string } => v.embedUrl !== null);
  const specRows = page.specifications.filter((s) => s.details.trim().length > 0);

  const nearestMetro = page.latitude != null && page.longitude != null ? nearestMetroStation(page.latitude, page.longitude) : null;
  const hubDistances = page.latitude != null && page.longitude != null ? distancesToHubs(page.latitude, page.longitude) : [];

  const whatsappMessage = `Hi, I'm interested in ${page.name} (${page.locality}, ${page.city}). Could you share more details?`;
  const whatsappLink = page.whatsappEnabled && page.contactPhone ? buildWhatsAppLink(page.contactPhone, whatsappMessage) : null;

  const heroImage = page.images[0] ?? null;

  // Only list a nav item for a section that actually has content — an empty
  // "Specifications" link (say, before an admin has filled any category in)
  // would be a dead jump to nothing.
  const visibleSections = NAV_SECTIONS.filter((s) => {
    if (s.id === "master-plan") return !!page.masterPlanImageUrl;
    if (s.id === "floor-plans") return page.floorPlans.length > 0;
    if (s.id === "amenities") return pageAmenities.length > 0;
    if (s.id === "specifications") return specRows.length > 0 || !!page.specificationsIntro;
    if (s.id === "location") return !!page.locationMapImageUrl || page.nearbyPlaces.length > 0 || !!nearestMetro || hubDistances.length > 0;
    if (s.id === "gallery") return page.images.length > 0;
    if (s.id === "videos") return videoEmbeds.length > 0;
    return true;
  });

  return (
    <main className="flex-1 bg-stone-50">
      {/* Hero */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900 sm:aspect-[21/9]">
        {heroImage && <Image src={heroImage.url} alt={page.name} fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <p className="flex items-center gap-1 text-sm text-white/80">
            <PinIcon className="h-4 w-4 shrink-0" />
            {page.locality}, {page.city}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-5xl">{page.name}</h1>
          {page.tagline && <p className="mt-2 max-w-xl text-base text-white/90 sm:text-lg">{page.tagline}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {page.contactPhone && (
              <a
                href={`tel:${page.contactPhone}`}
                className="flex items-center gap-1.5 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-stone-100"
              >
                <PhoneIcon className="h-4 w-4 shrink-0" />
                Call Now
              </a>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5a]"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Anchor nav — see this file's own header comment on why this isn't
          position: sticky: the site Header above is already sticky at
          top-0, and a second sticky bar needs a hand-tuned offset that
          would silently drift out of sync with that header's own height
          (e.g. when the social-links bar is configured). A plain in-flow
          bar avoids that fragility entirely. */}
      <nav className="sticky top-0 z-30 overflow-x-auto border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 px-4 py-2.5 sm:px-6">
          {visibleSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-indigo-600"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Overview */}
        <section id="overview" className={`${sectionCard} scroll-mt-16`}>
          <h2 className={sectionHeading}>Overview</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <span>{propertyTypeLabel(page.propertyType)}</span>
            {page.reraNumber && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                <ShieldIcon className="h-3.5 w-3.5" />
                RERA {page.reraNumber}
                {page.reraVerified && " · Verified"}
              </span>
            )}
          </div>
          {page.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-stone-700">{page.description}</p>}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-6 sm:grid-cols-4">
            {page.areaAcres != null && (
              <div>
                <p className="text-2xl font-bold text-stone-900">{page.areaAcres}</p>
                <p className="text-xs uppercase tracking-wide text-stone-500">Acres</p>
              </div>
            )}
            {page.totalUnits != null && (
              <div>
                <p className="text-2xl font-bold text-stone-900">{page.totalUnits.toLocaleString("en-IN")}</p>
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  {page.propertyType === "villa" || page.propertyType === "independent_house" ? "Villas" : "Units"}
                </p>
              </div>
            )}
            {page.minAreaSqft != null && page.maxAreaSqft != null && (
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {page.minAreaSqft.toLocaleString("en-IN")}–{page.maxAreaSqft.toLocaleString("en-IN")}
                </p>
                <p className="text-xs uppercase tracking-wide text-stone-500">Sq Ft</p>
              </div>
            )}
            {bhkList.length > 0 && (
              <div>
                <p className="text-2xl font-bold text-stone-900">{bhkList.join(", ")}</p>
                <p className="text-xs uppercase tracking-wide text-stone-500">BHK</p>
              </div>
            )}
            {page.possessionYear != null && (
              <div>
                <p className="text-2xl font-bold text-stone-900">{page.possessionYear}</p>
                <p className="text-xs uppercase tracking-wide text-stone-500">Possession</p>
              </div>
            )}
          </div>
          {page.developerName && (
            <p className="mt-4 text-sm text-stone-500">
              Developed by{" "}
              {page.developerUrl ? (
                <a href={page.developerUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">
                  {page.developerName}
                </a>
              ) : (
                <span className="font-semibold text-stone-700">{page.developerName}</span>
              )}
            </p>
          )}
          {page.brochureUrl && (
            <a
              href={page.brochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:border-indigo-500 hover:text-indigo-600"
            >
              Download Brochure
            </a>
          )}
        </section>

        {/* Master Plan */}
        {page.masterPlanImageUrl && (
          <section id="master-plan" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Master Plan</h2>
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
              <Image src={page.masterPlanImageUrl} alt={`${page.name} master plan`} fill sizes="(max-width: 1024px) 100vw, 1100px" className="object-cover" />
            </div>
          </section>
        )}

        {/* Floor Plans */}
        {page.floorPlans.length > 0 && (
          <section id="floor-plans" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Floor Plans</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {page.floorPlans.map((fp) => (
                <div key={fp.id} className="rounded-lg border border-stone-200 p-4">
                  <p className="text-lg font-bold text-stone-900">{fp.label}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                    {fp.plotAreaSqyd != null && <span>{fp.plotAreaSqyd} Sq Yd</span>}
                    {fp.builtUpAreaSqft != null && <span>{fp.builtUpAreaSqft.toLocaleString("en-IN")} Sq Ft</span>}
                    {fp.bedrooms && <span>{fp.bedrooms}</span>}
                  </div>
                  {fp.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {fp.images.map((img) => (
                        <div key={img.id} className="relative aspect-square overflow-hidden rounded-md border border-stone-200">
                          <Image src={img.url} alt={img.label ?? fp.label} fill sizes="150px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  {fp.virtualTourUrl && isEmbeddableTourUrl(fp.virtualTourUrl) && (
                    <a
                      href={fp.virtualTourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Enter Virtual Walkthrough
                      <ArrowRightIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        {pageAmenities.length > 0 && (
          <section id="amenities" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Amenities</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              {pageAmenities.map((a) => (
                <div key={a.key} className="flex items-center gap-2 text-sm text-stone-700">
                  <AmenityIcon icon={a.icon} className="h-5 w-5 shrink-0 text-indigo-600" />
                  {a.label}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Specifications */}
        {(specRows.length > 0 || page.specificationsIntro) && (
          <section id="specifications" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Specifications</h2>
            {page.specificationsIntro && <p className="mt-2 text-sm text-stone-600">{page.specificationsIntro}</p>}
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {specRows.map((s) => (
                <div key={s.category} className="border-b border-stone-100 pb-3">
                  <dt className="text-sm font-bold text-stone-900">{s.category}</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm text-stone-600">{s.details}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Location */}
        {(page.locationMapImageUrl || page.nearbyPlaces.length > 0 || nearestMetro || hubDistances.length > 0) && (
          <section id="location" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Location</h2>
            {page.locationMapImageUrl && (
              <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
                <Image src={page.locationMapImageUrl} alt={`${page.name} location map`} fill sizes="(max-width: 1024px) 100vw, 1100px" className="object-cover" />
              </div>
            )}
            {(nearestMetro || hubDistances.length > 0) && (
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {nearestMetro && (
                  <div>
                    <dt className="text-xs text-stone-500">Nearest Metro station</dt>
                    <dd className="text-sm font-medium text-stone-900">
                      {nearestMetro.name} ({nearestMetro.distanceKm} km)
                    </dd>
                  </div>
                )}
                {hubDistances.map((hub) => (
                  <div key={hub.name}>
                    <dt className="text-xs text-stone-500">{hub.name}</dt>
                    <dd className="text-sm font-medium text-stone-900">{hub.distanceKm} km</dd>
                  </div>
                ))}
              </dl>
            )}
            {page.nearbyPlaces.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-6 border-t border-stone-100 pt-5 sm:grid-cols-2">
                {page.nearbyPlaces.map((group) => (
                  <div key={group.id}>
                    <p className="text-sm font-bold text-stone-900">{group.category}</p>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {parseNearbyItems(group.items).map((item, i) => (
                        <li key={i} className="text-sm text-stone-600">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Gallery */}
        {page.images.length > 0 && (
          <section id="gallery" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Gallery</h2>
            <div className="mt-4">
              <ProjectGallery images={page.images} alt={page.name} />
            </div>
          </section>
        )}

        {/* Videos — explicitly placed near the bottom, just above Contact,
            per how this feature was requested. */}
        {videoEmbeds.length > 0 && (
          <section id="videos" className={`${sectionCard} mt-6 scroll-mt-16`}>
            <h2 className={sectionHeading}>Video{videoEmbeds.length > 1 ? "s" : ""}</h2>
            <div className={`mt-4 ${videoEmbeds.length > 1 ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}`}>
              {videoEmbeds.map((v, i) => (
                <div key={i}>
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <iframe
                      src={v.embedUrl}
                      title={v.title || page.name}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {v.title && <p className="mt-1.5 text-sm text-stone-600">{v.title}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section id="contact" className={`${sectionCard} mt-6 scroll-mt-16`}>
          <h2 className={sectionHeading}>Enquire Now</h2>
          <p className="mt-1 mb-4 text-sm text-stone-500">Share your details and our team will get back to you.</p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="max-w-md">
              <MicrositePageInquiryForm pageId={page.id} pageName={page.name} />
            </div>
            <div className="flex flex-col gap-2 text-sm text-stone-600">
              {page.contactPhone && (
                <a href={`tel:${page.contactPhone}`} className="flex items-center gap-2 font-medium text-stone-900 hover:text-indigo-600">
                  <PhoneIcon className="h-4 w-4 shrink-0" />
                  {page.contactPhone}
                </a>
              )}
              <p className="flex items-center gap-2">
                <PinIcon className="h-4 w-4 shrink-0 text-stone-400" />
                {page.locality}, {page.city}
              </p>
            </div>
          </div>
        </section>

        {/* Explore our other addresses */}
        {relatedPages.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-stone-900">Explore Our Other Addresses</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {relatedPages.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/${rp.slug}`}
                  className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-video w-full bg-stone-100">
                    {rp.imageUrl && <Image src={rp.imageUrl} alt={rp.name} fill sizes="400px" className="object-cover transition group-hover:scale-105" />}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-stone-900 group-hover:text-indigo-600">{rp.name}</p>
                    <p className="text-xs text-stone-500">
                      {rp.locality}, {rp.city}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

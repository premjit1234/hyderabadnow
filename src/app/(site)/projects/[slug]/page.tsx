import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getProjectById, getProjectBySlug, getListingsByProject, getPageViewCountForPath } from "@/db/queries";
import { propertyTypeLabel, formatPrice } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { AMENITIES, parseAmenities } from "@/lib/amenities";
import { getVideoEmbedUrl } from "@/lib/video";
import AmenityIcon from "@/components/AmenityIcon";
import ProjectGallery from "@/components/ProjectGallery";
import ProjectListingsTabs from "@/components/ProjectListingsTabs";
import ProjectSaveShareButtons from "@/components/ProjectSaveShareButtons";

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M12 21V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12M4 21h16M8 8h1M8 12h1M8 16h1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AreaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UnitsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  );
}

function TowerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="7" y="3" width="10" height="18" rx="1" />
      <path d="M10 7h4M10 11h4M10 15h4" strokeLinecap="round" />
    </svg>
  );
}

function BedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 18v2M21 18v2M3 12V8a1 1 0 0 1 1-1h6v5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="9.5" r="1.25" />
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

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ReraBadge({ year }: { year: number | null }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-8 w-8 text-emerald-700">
        <path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-2.5Z" strokeLinejoin="round" />
        <path d="m9.5 12 1.8 1.8 3.2-3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[10px] font-semibold uppercase text-stone-500">RERA{year ? ` '${String(year).slice(2)}` : ""}</p>
    </div>
  );
}

function PossessionBadge({ year }: { year: number | null }) {
  if (!year) return null;
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-8 w-8 text-stone-700">
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M3.5 9.5h17M8 3v3M16 3v3" strokeLinecap="round" />
      </svg>
      <p className="text-[10px] font-semibold uppercase text-stone-500">{year}</p>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let project = await getProjectBySlug(slug);
  if (!project) {
    // Fall back to the old /projects/[id] shape — covers bookmarks/backlinks
    // to a numeric URL, and the brief window on a legacy project between a
    // deploy adding the slug column and ensure-project-slugs.ts backfilling
    // it. Once a slug exists, the numeric URL redirects to it permanently
    // (it's the canonical one now) rather than serving duplicate content at
    // two URLs.
    const numericId = Number(slug);
    if (Number.isInteger(numericId) && String(numericId) === slug) {
      const byId = await getProjectById(numericId);
      if (byId) {
        if (byId.slug) permanentRedirect(`/projects/${byId.slug}`);
        project = byId;
      }
    }
  }
  if (!project) notFound();

  const [saleListings, rentListings, viewCount] = await Promise.all([
    getListingsByProject(project.id, "sale"),
    getListingsByProject(project.id, "rent"),
    getPageViewCountForPath(`/projects/${project.slug ?? project.id}`),
  ]);

  const amenityKeys = parseAmenities(project.amenities);
  const projectAmenities = AMENITIES.filter((a) => amenityKeys.includes(a.key));
  const bhkList = project.bhkOptions ? project.bhkOptions.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const videoEmbedUrl = project.videoUrl ? getVideoEmbedUrl(project.videoUrl) : null;

  // Price bands straight from this project's own active listings — sale and
  // rent are kept separate since they're not comparable figures (an
  // absolute price vs. a monthly one).
  const salePrices = saleListings.map((l) => l.price);
  const rentPrices = rentListings.map((l) => l.price);
  const salePriceRange =
    salePrices.length > 0 ? { min: Math.min(...salePrices), max: Math.max(...salePrices) } : null;
  const rentPriceRange =
    rentPrices.length > 0 ? { min: Math.min(...rentPrices), max: Math.max(...rentPrices) } : null;

  const whatsappMessage = `Hi, I'm interested in ${project.name} (${project.locality}, ${project.city}). Could you share more details?`;
  const whatsappLink =
    project.whatsappEnabled && project.contactPhone
      ? buildWhatsAppLink(project.contactPhone, whatsappMessage)
      : null;

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-emerald-700">
        ← Back to projects
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProjectGallery images={project.images} alt={project.name} />
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-sm text-stone-500">
                <PinIcon className="h-4 w-4 shrink-0" />
                {project.locality}, {project.city}
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{project.name}</h1>
            </div>
            <div className="flex shrink-0 gap-3">
              <ReraBadge year={project.reraApprovalYear} />
              <PossessionBadge year={project.possessionYear} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-y-4 border-y border-stone-200 py-4 text-sm">
            <div className="flex items-center gap-2">
              <BuildingIcon className="h-5 w-5 shrink-0 text-stone-400" />
              <span className="text-stone-700">{propertyTypeLabel(project.propertyType)}</span>
            </div>
            {project.areaAcres != null && (
              <div className="flex items-center gap-2">
                <AreaIcon className="h-5 w-5 shrink-0 text-stone-400" />
                <span className="text-stone-700">{project.areaAcres} acres</span>
              </div>
            )}
            {project.totalUnits != null && (
              <div className="flex items-center gap-2">
                <UnitsIcon className="h-5 w-5 shrink-0 text-stone-400" />
                <span className="text-stone-700">{project.totalUnits.toLocaleString("en-IN")} Units</span>
              </div>
            )}
            {project.towers != null && project.maxFloors != null && (
              <div className="flex items-center gap-2">
                <TowerIcon className="h-5 w-5 shrink-0 text-stone-400" />
                <span className="text-stone-700">
                  {project.towers}T × {project.maxFloors}F
                </span>
              </div>
            )}
            {project.minAreaSqft != null && project.maxAreaSqft != null && (
              <div className="flex items-center gap-2">
                <AreaIcon className="h-5 w-5 shrink-0 text-stone-400" />
                <span className="text-stone-700">
                  {project.minAreaSqft.toLocaleString("en-IN")}-{project.maxAreaSqft.toLocaleString("en-IN")} sft
                </span>
              </div>
            )}
            {bhkList.length > 0 && (
              <div className="flex items-center gap-2">
                <BedIcon className="h-5 w-5 shrink-0 text-stone-400" />
                <span className="text-stone-700">{bhkList.join(", ")} BHK</span>
              </div>
            )}
          </div>

          <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2.5 text-sm text-stone-600">
            {saleListings.length + rentListings.length} active listing
            {saleListings.length + rentListings.length === 1 ? "" : "s"} in this project — {saleListings.length} for
            sale, {rentListings.length} for rent.
          </p>

          {(salePriceRange || rentPriceRange) && (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              {salePriceRange && (
                <p className="text-lg font-bold text-emerald-800">
                  {salePriceRange.min === salePriceRange.max
                    ? formatPrice(salePriceRange.min, "sale")
                    : `${formatPrice(salePriceRange.min, "sale")} – ${formatPrice(salePriceRange.max, "sale")}`}
                  <span className="ml-1.5 text-xs font-normal text-emerald-700">for sale</span>
                </p>
              )}
              {rentPriceRange && (
                <p className={salePriceRange ? "mt-1 text-sm font-semibold text-emerald-800" : "text-lg font-bold text-emerald-800"}>
                  {rentPriceRange.min === rentPriceRange.max
                    ? formatPrice(rentPriceRange.min, "rent")
                    : `${formatPrice(rentPriceRange.min, "rent")} – ${formatPrice(rentPriceRange.max, "rent")}`}
                  <span className="ml-1.5 text-xs font-normal text-emerald-700">for rent</span>
                </p>
              )}
            </div>
          )}

          {(project.contactPhone || whatsappLink) && (
            <div className="mt-4 flex gap-2">
              {project.contactPhone && (
                <a
                  href={`tel:${project.contactPhone}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
                >
                  <PhoneIcon className="h-4 w-4 shrink-0" />
                  Call
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:bg-[#1ebe5a]"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  Connect on WhatsApp
                </a>
              )}
            </div>
          )}

          <div className="mt-4">
            <ProjectSaveShareButtons projectId={project.id} projectName={project.name} />
          </div>

          {viewCount > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
              <EyeIcon className="h-3.5 w-3.5 shrink-0" />
              {viewCount.toLocaleString("en-IN")} {viewCount === 1 ? "view" : "views"} on this project
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-stone-900">About</h2>
          <p className="whitespace-pre-line leading-relaxed text-stone-700">
            {project.description ||
              `${project.name} is a ${project.constructionStatus === "ready_to_move" ? "ready to move" : "under construction"} ${propertyTypeLabel(project.propertyType).toLowerCase()} project${
                project.towers ? ` with ${project.towers} towers` : ""
              }${project.totalUnits ? ` and ${project.totalUnits.toLocaleString("en-IN")} units` : ""}. It is located in ${project.locality}, ${project.city}.`}
            {project.developerName && (
              <>
                {" "}
                It is being developed by <span className="font-semibold text-emerald-700">{project.developerName}</span>.
              </>
            )}
          </p>

          {(project.unitsPerFloor || project.unitDensityPerAcre || project.floorAreaRatio) && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <h3 className="mb-2 text-sm font-bold text-stone-900">Key Stats</h3>
              <dl className="flex flex-col gap-1.5 text-sm text-stone-700">
                {project.unitsPerFloor && (
                  <div className="flex items-center gap-1.5">
                    <UnitsIcon className="h-4 w-4 text-stone-400" />
                    <dt className="font-medium">Units/floor:</dt>
                    <dd>{project.unitsPerFloor}</dd>
                  </div>
                )}
                {project.unitDensityPerAcre != null && (
                  <div className="flex items-center gap-1.5">
                    <BuildingIcon className="h-4 w-4 text-stone-400" />
                    <dt className="font-medium">Unit Density:</dt>
                    <dd>{project.unitDensityPerAcre} units/acre</dd>
                  </div>
                )}
                {project.floorAreaRatio != null && (
                  <div className="flex items-center gap-1.5">
                    <AreaIcon className="h-4 w-4 text-stone-400" />
                    <dt className="font-medium">Floor Area Ratio:</dt>
                    <dd>{project.floorAreaRatio}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-stone-900">Amenities</h2>
          {projectAmenities.length === 0 ? (
            <p className="text-sm text-stone-500">No amenities listed.</p>
          ) : (
            <div className="grid max-h-52 grid-cols-2 gap-x-4 gap-y-3 overflow-y-auto pr-2 sm:grid-cols-3">
              {projectAmenities.map((a) => (
                <div key={a.key} className="flex items-center gap-2 text-sm text-stone-700">
                  <AmenityIcon icon={a.icon} className="h-5 w-5 shrink-0 text-emerald-700" />
                  {a.label}
                </div>
              ))}
            </div>
          )}
          {(project.brochureUrl || project.developerUrl) && (
            <div className="mt-4 flex gap-3 border-t border-stone-100 pt-4">
              {project.brochureUrl && (
                <a
                  href={project.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
                >
                  Brochure
                </a>
              )}
              {project.developerUrl && (
                <a
                  href={project.developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
                >
                  Developer
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {videoEmbedUrl && (
        <div className="mt-10">
          <h2 className="mb-2 text-lg font-bold text-stone-900">Video</h2>
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={videoEmbedUrl}
              title={project.name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-1 text-xl font-bold text-stone-900">Active Listings</h2>
        <p className="mb-5 text-sm text-stone-500">Available units in this community</p>
        <ProjectListingsTabs saleListings={saleListings} rentListings={rentListings} />
      </div>
    </main>
  );
}

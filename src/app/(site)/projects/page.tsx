import Link from "next/link";
import Image from "next/image";
import { getProjectsForPublic, getLocationNames } from "@/db/queries";
import { propertyTypeLabel, formatPrice, projectHref } from "@/lib/format";
import ProjectsViewSwitcher from "@/components/ProjectsViewSwitcher";
import ProjectsMap from "@/components/ProjectsMap";

const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"];
const BHK_OPTIONS = [1, 2, 3, 4, 5];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  const locality = typeof sp.locality === "string" && sp.locality ? sp.locality : undefined;
  const propertyType = typeof sp.propertyType === "string" && sp.propertyType ? sp.propertyType : undefined;
  const constructionStatus =
    sp.constructionStatus === "ready_to_move" || sp.constructionStatus === "under_construction"
      ? sp.constructionStatus
      : undefined;
  const bhk = typeof sp.bhk === "string" && sp.bhk ? Number(sp.bhk) : undefined;
  const minArea = typeof sp.minArea === "string" && sp.minArea ? Number(sp.minArea) : undefined;
  const maxArea = typeof sp.maxArea === "string" && sp.maxArea ? Number(sp.maxArea) : undefined;
  const sort = sp.sort === "name" || sp.sort === "price_asc" ? sp.sort : "newest";

  const hasFilters = !!(q || locality || propertyType || constructionStatus || bhk || minArea || maxArea);

  const [allProjects, localities] = await Promise.all([
    getProjectsForPublic({ q, locality, propertyType, constructionStatus, bhk, minArea, maxArea, sort }),
    getLocationNames(),
  ]);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">
        {locality ? `Projects in ${locality}` : "Projects in Hyderabad"}
      </h1>
      <p className="mt-1 mb-6 text-stone-500">
        Gated communities and developer-built projects with active listings.
      </p>

      <form
        method="GET"
        className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-3"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Project or developer name"
          className="min-w-[180px] flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm"
        />
        <select
          name="locality"
          defaultValue={locality ?? ""}
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
        >
          <option value="">Any locality</option>
          {localities.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          name="propertyType"
          defaultValue={propertyType ?? ""}
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
        >
          <option value="">Property type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {propertyTypeLabel(t)}
            </option>
          ))}
        </select>
        <select
          name="constructionStatus"
          defaultValue={constructionStatus ?? ""}
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
        >
          <option value="">Any status</option>
          <option value="ready_to_move">Ready to move</option>
          <option value="under_construction">Under construction</option>
        </select>
        <select
          name="bhk"
          defaultValue={bhk ? String(bhk) : ""}
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
        >
          <option value="">Beds &amp; baths</option>
          {BHK_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} BHK
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
        >
          <option value="newest">Newest</option>
          <option value="name">Name (A–Z)</option>
          <option value="price_asc">Price (low to high)</option>
        </select>
        <details className="relative">
          <summary className="list-none rounded-full border border-stone-300 px-3 py-2 text-sm text-stone-700 select-none [&::-webkit-details-marker]:hidden">
            Area range ▾
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Area (sqft)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="minArea"
                defaultValue={minArea}
                placeholder="Min"
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              />
              <input
                type="number"
                name="maxArea"
                defaultValue={maxArea}
                placeholder="Max"
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              />
            </div>
          </div>
        </details>
        <button
          type="submit"
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Apply
        </button>
        {hasFilters && (
          <a href="/projects" className="text-xs text-stone-500 hover:underline">
            Clear filters
          </a>
        )}
      </form>

      <div>
        <p className="mb-4 text-sm text-stone-500">
          {allProjects.length} {allProjects.length === 1 ? "project" : "projects"} found
        </p>

          {allProjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-500">
              {hasFilters
                ? "No projects match those filters yet. Try widening your search."
                : "No projects listed yet — check back soon."}
            </p>
          ) : (
            <ProjectsViewSwitcher
              map={
                <ProjectsMap
                  projects={allProjects.map((p) => ({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    locality: p.locality,
                    city: p.city,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    propertyType: p.propertyType,
                    constructionStatus: p.constructionStatus,
                    imageUrl: p.imageUrl,
                    minSalePrice: p.minSalePrice,
                    minRentPrice: p.minRentPrice,
                    saleListings: p.saleListings,
                    rentListings: p.rentListings,
                  }))}
                />
              }
              grid={
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {allProjects.map((p) => {
                const startingPrice = p.minSalePrice ?? p.minRentPrice;
                const startingPriceType: "sale" | "rent" = p.minSalePrice != null ? "sale" : "rent";
                return (
                  <div
                    key={p.id}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone-400">No photo</div>
                      )}
                      <span className="absolute left-2 top-2 rounded bg-stone-900/80 px-2 py-0.5 text-xs font-semibold text-white">
                        {p.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction"}
                      </span>
                      {p.reraApprovalYear && (
                        <span className="absolute right-2 top-2 rounded bg-emerald-700/90 px-2 py-0.5 text-xs font-semibold text-white">
                          RERA
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3.5">
                      <Link
                        href={projectHref(p)}
                        className="line-clamp-1 text-base font-bold text-stone-900 hover:underline"
                      >
                        <span className="absolute inset-0" />
                        {p.name}
                      </Link>
                      <p className="text-sm text-stone-500">
                        <Link
                          href={`/projects?locality=${encodeURIComponent(p.locality)}`}
                          className="relative z-10 hover:text-emerald-700 hover:underline"
                        >
                          {p.locality}
                        </Link>
                        , {p.city}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span>{propertyTypeLabel(p.propertyType)}</span>
                        {p.bhkOptions && <span>{p.bhkOptions.split(",").join(", ")} BHK</span>}
                        {p.minAreaSqft && p.maxAreaSqft && (
                          <span>
                            {p.minAreaSqft.toLocaleString("en-IN")}–{p.maxAreaSqft.toLocaleString("en-IN")} sqft
                          </span>
                        )}
                        {p.constructionStatus === "under_construction" && p.possessionYear && (
                          <span>Possession {p.possessionYear}</span>
                        )}
                      </div>
                      {startingPrice != null && (
                        <p className="mt-1 text-sm font-semibold text-stone-900">
                          Starting from {formatPrice(startingPrice, startingPriceType)}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-indigo-700">
                        {p.saleListings} for sale · {p.rentListings} for rent
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
              }
            />
          )}
        </div>
    </main>
  );
}

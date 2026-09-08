import Link from "next/link";
import Image from "next/image";
import { getProjectsForPublic, getLocationNames } from "@/db/queries";
import { propertyTypeLabel, formatPrice, projectHref } from "@/lib/format";

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

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <form method="GET" className="flex flex-col gap-4 rounded-lg border border-stone-200 p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Search
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Project or developer name"
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Locality
              </label>
              <select
                name="locality"
                defaultValue={locality ?? ""}
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              >
                <option value="">Any</option>
                {localities.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Property type
              </label>
              <select
                name="propertyType"
                defaultValue={propertyType ?? ""}
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              >
                <option value="">Any</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {propertyTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Construction status
              </label>
              <select
                name="constructionStatus"
                defaultValue={constructionStatus ?? ""}
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              >
                <option value="">Any</option>
                <option value="ready_to_move">Ready to move</option>
                <option value="under_construction">Under construction</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Bedrooms (BHK)
              </label>
              <select
                name="bhk"
                defaultValue={bhk ? String(bhk) : ""}
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              >
                <option value="">Any</option>
                {BHK_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} BHK
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Min area (sqft)
                </label>
                <input
                  type="number"
                  name="minArea"
                  defaultValue={minArea}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Max area (sqft)
                </label>
                <input
                  type="number"
                  name="maxArea"
                  defaultValue={maxArea}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Sort by
              </label>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="name">Name (A–Z)</option>
                <option value="price_asc">Price (low to high)</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Apply filters
            </button>
            {hasFilters && (
              <a href="/projects" className="text-center text-xs text-stone-500 hover:underline">
                Clear filters
              </a>
            )}
          </form>
        </aside>

        <div className="flex-1">
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
          )}
        </div>
      </div>
    </main>
  );
}

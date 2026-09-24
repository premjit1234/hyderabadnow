import Link from "next/link";
import { cookies } from "next/headers";
import ListingCard from "@/components/ListingCard";
import AdSlot from "@/components/AdSlot";
import {
  searchListings,
  searchListingsForListView,
  getProjectsForSelect,
  getListingFieldSettings,
  getListViewFieldSettings,
  getFeaturedProjects,
  getFeaturedLocalities,
} from "@/db/queries";
import { propertyTypeLabel } from "@/lib/format";
import { FACING_OPTIONS, FURNISHING_OPTIONS } from "@/lib/listingFields";
import { getEffectiveListViewFields } from "@/lib/listViewFields";
import { FLOOR_RANGES, PRICE_RANGES, parseBrowseSearchParams, browseParamsToQueryString } from "@/lib/browseFilters";
import SaveSearchButton from "@/components/SaveSearchButton";
import ListingsViewSwitcher, { type ListingsView } from "@/components/ListingsViewSwitcher";
import ListingsListView from "@/components/ListingsListView";
import { getSession } from "@/lib/auth";

const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"];

// These price brackets are really meant for Buy (sale) listings — Rent
// listings are priced in monthly rupees (tens of thousands), so on a Rent
// search "Below 1 Cr" will match virtually every result. Left as one shared
// control rather than two separate rent/sale scales since that's what was
// asked for; worth revisiting if rent search actually needs its own bracket
// set later. (FLOOR_RANGES/PRICE_RANGES themselves now live in
// lib/browseFilters.ts, shared with the saved-search alert sweep.)

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const {
    q,
    listingType,
    propertyType,
    projectId,
    bhk,
    priceRange,
    featured,
    newOnly,
    facing,
    floor,
    furnishingStatus,
    verifiedOnly,
    sort,
    filters,
  } = parseBrowseSearchParams(sp);
  const floorRange = FLOOR_RANGES.find((r) => r.key === floor);

  const [results, projectOptions, fieldSettings, listViewFieldSettings, featuredProjects, featuredLocalities, session, cookieStore] =
    await Promise.all([
      searchListings(filters),
      getProjectsForSelect(),
      getListingFieldSettings(),
      getListViewFieldSettings(),
      getFeaturedProjects(8),
      getFeaturedLocalities(6),
      getSession(),
      cookies(),
    ]);

  const listViewFields = getEffectiveListViewFields("listing", propertyType, listViewFieldSettings);
  const listViewRows = await searchListingsForListView(filters, listViewFields, sp);
  const initialView: ListingsView = cookieStore.get("listingsView")?.value === "list" ? "list" : "catalog";

  const hasAdditionalFilter = Boolean(facing || floorRange || furnishingStatus || verifiedOnly);
  // The exact query string a saved search re-plays later through
  // parseBrowseSearchParams — built from the same searchParams the page
  // itself just rendered from, so "save this search" always captures
  // precisely what's on screen right now.
  const currentQueryString = browseParamsToQueryString(sp);

  const heading = q
    ? `Properties in ${q}`
    : featured
      ? "Featured properties"
      : newOnly
        ? "New listings"
        : "Browse properties in Hyderabad";

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">
        {heading}
      </h1>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-500">{results.length} listings found</p>
        <SaveSearchButton userId={session?.id ?? null} queryString={currentQueryString} />
      </div>

      <form method="GET" className="mt-6 rounded-lg border border-stone-200 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Locality
            </label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="e.g. Kondapur"
              className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Project
            </label>
            <select
              name="projectId"
              defaultValue={projectId ? String(projectId) : ""}
              className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
            >
              <option value="">Any</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Listing type
            </label>
            <select
              name="listingType"
              defaultValue={listingType ?? ""}
              className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="sale">Buy</option>
              <option value="rent">Rent</option>
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
              Bedrooms (BHK)
            </label>
            <select
              name="bhk"
              defaultValue={bhk ? String(bhk) : ""}
              className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+ BHK
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Price range
            </label>
            <select
              name="priceRange"
              defaultValue={priceRange ?? ""}
              className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
            >
              <option value="">Any</option>
              {PRICE_RANGES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Sort by
            </label>
            <select
              name="sort"
              defaultValue={sort ?? ""}
              className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
            >
              <option value="">Relevance</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </div>

        <details className="mt-4 border-t border-stone-200 pt-4" open={hasAdditionalFilter}>
          <summary className="cursor-pointer text-sm font-semibold text-stone-700">
            Additional filters
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fieldSettings.facing.public && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Facing
                </label>
                <select
                  name="facing"
                  defaultValue={facing ?? ""}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                >
                  <option value="">Any</option>
                  {FACING_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {fieldSettings.unitFloor.public && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Floor
                </label>
                <select
                  name="floor"
                  defaultValue={floor ?? ""}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                >
                  <option value="">Any</option>
                  {FLOOR_RANGES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {fieldSettings.furnishingStatus.public && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Furnishing
                </label>
                <select
                  name="furnishingStatus"
                  defaultValue={furnishingStatus ?? ""}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                >
                  <option value="">Any</option>
                  {FURNISHING_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="verifiedOnly"
                  value="1"
                  defaultChecked={verifiedOnly}
                  className="h-4 w-4 rounded border-stone-300"
                />
                Verified listings only
              </label>
            </div>
          </div>
        </details>

        {featuredLocalities.length > 0 && (
          <div className="mt-4 border-t border-stone-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Featured localities
            </p>
            <div className="flex flex-wrap gap-2">
              {featuredLocalities.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/browse?q=${encodeURIComponent(loc.name)}`}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${
                    q === loc.name
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  {loc.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {featuredProjects.length > 0 && (
          <div className="mt-4 border-t border-stone-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Featured projects
            </p>
            <div className="flex flex-wrap gap-2">
              {featuredProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/browse?projectId=${p.id}`}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${
                    projectId === p.id
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Apply filters
          </button>
          <a href="/browse" className="text-xs text-stone-500 hover:underline">
            Clear filters
          </a>
        </div>
      </form>

      <AdSlot placementKey="browse_between_filters_results" className="mt-6" />

      <div className="mt-6">
        <ListingsViewSwitcher
          initialView={initialView}
          catalog={
            results.length === 0 ? (
              <p className="text-stone-500">No listings match those filters yet. Try widening your search.</p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )
          }
          list={<ListingsListView rows={listViewRows} fields={listViewFields} sp={sp} />}
        />
      </div>
    </main>
  );
}

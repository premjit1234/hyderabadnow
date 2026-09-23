import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import AdSlot from "@/components/AdSlot";
import {
  searchListings,
  getProjectsForSelect,
  getListingFieldSettings,
  getFeaturedProjects,
  getFeaturedLocalities,
} from "@/db/queries";
import { propertyTypeLabel } from "@/lib/format";
import { FACING_OPTIONS, FURNISHING_OPTIONS } from "@/lib/listingFields";

const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"];

// Non-overlapping so a floor can never match two ranges — "5-15 Floor" reads
// as 5th up to (but not including) the 15th, where "15-25 Floor" picks up,
// and so on. max: null means open-ended (40+).
const FLOOR_RANGES = [
  { key: "0-4", label: "Below 5th Floor", min: 0, max: 4 },
  { key: "5-14", label: "5-15 Floor", min: 5, max: 14 },
  { key: "15-24", label: "15-25 Floor", min: 15, max: 24 },
  { key: "25-39", label: "25-40 Floor", min: 25, max: 39 },
  { key: "40-", label: "40+ Floors", min: 40, max: null as number | null },
] as const;

// Same non-overlapping-ranges approach as FLOOR_RANGES: every rupee amount
// falls into exactly one bracket, no gaps. Amounts are in plain rupees since
// that's what listings.price is stored as (1 Cr = 1,00,00,000).
//
// These brackets are really meant for Buy (sale) listings — Rent listings
// are priced in monthly rupees (tens of thousands), so on a Rent search
// "Below 1 Cr" will match virtually every result. Left as one shared
// control rather than two separate rent/sale scales since that's what was
// asked for; worth revisiting if rent search actually needs its own bracket
// set later.
const PRICE_RANGES = [
  { key: "below-1cr", label: "Below ₹1 Cr", min: 0, max: 9999999 },
  { key: "1-3cr", label: "₹1 - 3 Cr", min: 10000000, max: 29999999 },
  { key: "3-4.5cr", label: "₹3 - 4.5 Cr", min: 30000000, max: 44999999 },
  { key: "4.5cr-plus", label: "₹4.5 Cr+", min: 45000000, max: null as number | null },
] as const;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const listingType = sp.listingType === "rent" ? "rent" : sp.listingType === "sale" ? "sale" : undefined;
  const propertyType = typeof sp.propertyType === "string" ? sp.propertyType : undefined;
  const projectId = typeof sp.projectId === "string" && sp.projectId ? Number(sp.projectId) : undefined;
  const bhk = typeof sp.bhk === "string" && sp.bhk ? Number(sp.bhk) : undefined;
  const priceRange = typeof sp.priceRange === "string" ? sp.priceRange : undefined;
  const priceRangeOption = PRICE_RANGES.find((r) => r.key === priceRange);
  const featured = sp.featured === "1";
  const newOnly = sp.new === "1";
  const facing = typeof sp.facing === "string" ? sp.facing : undefined;
  const floor = typeof sp.floor === "string" ? sp.floor : undefined;
  const floorRange = FLOOR_RANGES.find((r) => r.key === floor);
  const furnishingStatus = typeof sp.furnishingStatus === "string" ? sp.furnishingStatus : undefined;
  const verifiedOnly = sp.verifiedOnly === "1";
  const sort = sp.sort === "newest" ? "newest" : undefined;

  const [results, projectOptions, fieldSettings, featuredProjects, featuredLocalities] = await Promise.all([
    searchListings({
      q,
      listingType,
      propertyType,
      projectId,
      bhk,
      minPrice: priceRangeOption?.min,
      maxPrice: priceRangeOption?.max ?? undefined,
      featured,
      newOnly,
      facing,
      minFloor: floorRange?.min,
      maxFloor: floorRange?.max ?? undefined,
      furnishingStatus,
      verifiedOnly,
      sort,
    }),
    getProjectsForSelect(),
    getListingFieldSettings(),
    getFeaturedProjects(8),
    getFeaturedLocalities(6),
  ]);

  const hasAdditionalFilter = Boolean(facing || floorRange || furnishingStatus || verifiedOnly);

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
      <p className="mt-1 text-sm text-stone-500">{results.length} listings found</p>

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
        {results.length === 0 ? (
          <p className="text-stone-500">No listings match those filters yet. Try widening your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

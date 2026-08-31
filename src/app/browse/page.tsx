import ListingCard from "@/components/ListingCard";
import { searchListings } from "@/db/queries";
import { propertyTypeLabel } from "@/lib/format";

const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const listingType = sp.listingType === "rent" ? "rent" : sp.listingType === "sale" ? "sale" : undefined;
  const propertyType = typeof sp.propertyType === "string" ? sp.propertyType : undefined;
  const bhk = typeof sp.bhk === "string" && sp.bhk ? Number(sp.bhk) : undefined;
  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const featured = sp.featured === "1";
  const newOnly = sp.new === "1";

  const results = await searchListings({
    q,
    listingType,
    propertyType,
    bhk,
    minPrice,
    maxPrice,
    featured,
    newOnly,
  });

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

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <form method="GET" className="flex flex-col gap-4 rounded-lg border border-stone-200 p-4">
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Min price
                </label>
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={minPrice}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Max price
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice}
                  className="w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Apply filters
            </button>
            <a href="/browse" className="text-center text-xs text-stone-500 hover:underline">
              Clear filters
            </a>
          </form>
        </aside>

        <div className="flex-1">
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
      </div>
    </main>
  );
}

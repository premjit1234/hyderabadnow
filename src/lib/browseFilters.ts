// Shared between /browse's own page (src/app/(site)/browse/page.tsx) and the
// saved-search alert sweep (src/lib/savedSearchAlerts.ts). A saved search
// stores the raw searchParams object exactly as /browse's URL produced it
// (see schema.ts's comment on savedSearches.filters), so re-running it later
// needs to parse that same shape into the ListingFilters searchListings()
// expects — pulling the parsing logic out into one place means the sweep can
// never drift out of sync with what the user actually saw when they saved
// the search.
import type { ListingFilters } from "@/db/queries";

// Non-overlapping so a floor can never match two ranges — "5-15 Floor" reads
// as 5th up to (but not including) the 15th, where "15-25 Floor" picks up,
// and so on. max: null means open-ended (40+).
export const FLOOR_RANGES = [
  { key: "0-4", label: "Below 5th Floor", min: 0, max: 4 },
  { key: "5-14", label: "5-15 Floor", min: 5, max: 14 },
  { key: "15-24", label: "15-25 Floor", min: 15, max: 24 },
  { key: "25-39", label: "25-40 Floor", min: 25, max: 39 },
  { key: "40-", label: "40+ Floors", min: 40, max: null as number | null },
] as const;

// Same non-overlapping-ranges approach as FLOOR_RANGES: every rupee amount
// falls into exactly one bracket, no gaps. Amounts are in plain rupees since
// that's what listings.price is stored as (1 Cr = 1,00,00,000).
export const PRICE_RANGES = [
  { key: "below-1cr", label: "Below ₹1 Cr", min: 0, max: 9999999 },
  { key: "1-3cr", label: "₹1 - 3 Cr", min: 10000000, max: 29999999 },
  { key: "3-4.5cr", label: "₹3 - 4.5 Cr", min: 30000000, max: 44999999 },
  { key: "4.5cr-plus", label: "₹4.5 Cr+", min: 45000000, max: null as number | null },
] as const;

export type BrowseSearchParams = Record<string, string | string[] | undefined>;

// Turns a raw searchParams object (Next's own shape, or a saved search's
// parsed filters JSON — both are BrowseSearchParams) back into a query
// string for a /browse link — shared so a saved search's "See all matches"
// email link is built exactly the same way /browse's own links are.
export function browseParamsToQueryString(sp: BrowseSearchParams): string {
  return new URLSearchParams(
    Object.entries(sp).flatMap(([key, value]) =>
      value == null ? [] : Array.isArray(value) ? value.map((v) => [key, v] as [string, string]) : [[key, value] as [string, string]]
    )
  ).toString();
}

// The individual, UI-friendly fields (used for <select>/<input> defaultValue
// props and heading text) plus the final ListingFilters ready for
// searchListings(). Keeping both in one return value means /browse's page
// component and the alert sweep parse the exact same way.
export function parseBrowseSearchParams(sp: BrowseSearchParams) {
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

  const filters: ListingFilters = {
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
  };

  return {
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
  };
}

// A short, human-readable summary of a saved search's filters — shown on the
// dashboard's "My saved searches" list and in alert emails, since a bare
// label the user typed ("Kondapur 3BHK") is optional/may be blank.
export function describeBrowseFilters(sp: BrowseSearchParams): string {
  const { q, listingType, propertyType, bhk, priceRange, furnishingStatus, verifiedOnly } = parseBrowseSearchParams(sp);
  const parts: string[] = [];
  if (q) parts.push(q);
  if (listingType) parts.push(listingType === "sale" ? "Buy" : "Rent");
  if (propertyType) parts.push(propertyType.replace(/_/g, " "));
  if (bhk) parts.push(`${bhk}+ BHK`);
  const priceLabel = PRICE_RANGES.find((r) => r.key === priceRange)?.label;
  if (priceLabel) parts.push(priceLabel);
  if (furnishingStatus) parts.push(furnishingStatus.replace(/_/g, " "));
  if (verifiedOnly) parts.push("Verified only");
  return parts.length > 0 ? parts.join(" · ") : "All listings";
}

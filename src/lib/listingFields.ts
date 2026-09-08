// The fixed set of "extra" listing fields beyond the original core ones
// (title/price/bhk/area/locality/...). Each has a default visibility on the
// public listing page and on the post-listing form — admin can override both
// independently from /admin/listing-fields (see db/queries.ts
// getListingFieldSettings and admin/actions.ts adminUpdateListingFieldSettingsAction).
//
// Admin's own edit form always shows every field regardless of these
// settings — visibility only controls what buyers/renters see on the public
// listing page, and what regular agents/owners see on the public
// post-listing form.
export const LISTING_EXTRA_FIELDS = [
  { key: "towerName", label: "Tower Name / Number", defaultPublic: true, defaultForm: true },
  { key: "unitNumber", label: "Unit Number", defaultPublic: true, defaultForm: true },
  { key: "unitFloor", label: "Unit Floor", defaultPublic: true, defaultForm: true },
  { key: "facing", label: "Facing", defaultPublic: true, defaultForm: true },
  { key: "furnishingStatus", label: "Furnishing Status", defaultPublic: true, defaultForm: true },
  { key: "inventoryState", label: "Inventory State", defaultPublic: true, defaultForm: true },
  { key: "sellerAskPrice", label: "Seller Ask Price", defaultPublic: false, defaultForm: true },
  { key: "sellerBestPrice", label: "Seller Best Price", defaultPublic: false, defaultForm: true },
  { key: "cashRatioPercent", label: "Cash Ratio (%)", defaultPublic: false, defaultForm: true },
  { key: "amenities", label: "Amenities", defaultPublic: true, defaultForm: true },
] as const;

export type ListingExtraFieldKey = (typeof LISTING_EXTRA_FIELDS)[number]["key"];

export type ListingFieldVisibility = Record<ListingExtraFieldKey, { public: boolean; form: boolean }>;

// Resolves the effective visibility for every known field, filling in
// defaults for anything missing from the stored config (a field added after
// some admins have already saved settings, or a fresh install with no row
// yet at all).
export function resolveFieldVisibility(stored: Partial<ListingFieldVisibility> | null | undefined): ListingFieldVisibility {
  const result = {} as ListingFieldVisibility;
  for (const field of LISTING_EXTRA_FIELDS) {
    result[field.key] = {
      public: stored?.[field.key]?.public ?? field.defaultPublic,
      form: stored?.[field.key]?.form ?? field.defaultForm,
    };
  }
  return result;
}

export const FACING_OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north_east", label: "North-East" },
  { value: "north_west", label: "North-West" },
  { value: "south_east", label: "South-East" },
  { value: "south_west", label: "South-West" },
] as const;

export const FURNISHING_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "fully_furnished", label: "Fully Furnished" },
] as const;

export const INVENTORY_STATE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "resale", label: "Resale" },
] as const;

function labelFor(options: readonly { value: string; label: string }[], value: string | null): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export const facingLabel = (value: string | null) => labelFor(FACING_OPTIONS, value);
export const furnishingLabel = (value: string | null) => labelFor(FURNISHING_OPTIONS, value);
export const inventoryStateLabel = (value: string | null) => labelFor(INVENTORY_STATE_OPTIONS, value);

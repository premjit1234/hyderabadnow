export function formatPrice(price: number, listingType: "sale" | "rent") {
  if (listingType === "rent") {
    return `₹${price.toLocaleString("en-IN")}/mo`;
  }
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(price % 10000000 === 0 ? 0 : 2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)} L`;
  }
  return `₹${price.toLocaleString("en-IN")}`;
}

/** Plain rupee amount with Indian digit grouping, e.g. "₹45,231" — for
 * calculator outputs (EMI, stamp duty) where lakh/crore shorthand would be
 * less readable than the exact figure. */
export function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** e.g. "24 September 2026" — used for blog post dates. */
export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** Builds a project's public URL. Prefers the name-based slug; falls back to
 * the numeric id for the brief window between a schema migration adding
 * projects.slug and src/db/ensure-project-slugs.ts backfilling it (or if a
 * slug somehow failed to generate) — the [slug] route accepts either and
 * redirects an id lookup to the canonical slug URL once one exists. */
export function projectHref(project: { id: number; slug: string | null }) {
  return `/projects/${project.slug || project.id}`;
}

export function propertyTypeLabel(type: string) {
  const map: Record<string, string> = {
    apartment: "Apartment",
    villa: "Villa",
    independent_house: "Independent House",
    plot: "Plot / Land",
    commercial: "Commercial",
  };
  return map[type] || type;
}

/** 1 square yard = 9 square feet. */
export const SQFT_PER_SQYD = 9;

/** listings.areaSqft (and projects.min/maxAreaSqft) are always stored and
 * entered in square feet, for every property type — this only changes what
 * a visitor sees. Hyderabad/Telangana real estate convention quotes Plot/Land
 * area in square yards rather than square feet, unlike every other property
 * type, so a "plot" listing's area is converted for display only; the DB
 * value, the post-listing/admin forms, and every other property type are
 * unaffected. */
export function formatArea(areaSqft: number, propertyType: string) {
  if (propertyType === "plot") {
    return `${Math.round(areaSqft / SQFT_PER_SQYD).toLocaleString("en-IN")} sq yd`;
  }
  return `${areaSqft.toLocaleString("en-IN")} sqft`;
}

/** Same square-feet-to-square-yard display conversion as formatArea, but for
 * a per-area rupee figure (e.g. the "how does this compare" price-per-area
 * line on a listing page). `pricePerSqft` is always price / areaSqft
 * (unchanged, still computed in square feet everywhere) — only the figure
 * shown to a visitor for a Plot listing is rescaled and relabeled. */
export function formatPricePerArea(pricePerSqft: number, propertyType: string) {
  if (propertyType === "plot") {
    return `${formatRupees(pricePerSqft * SQFT_PER_SQYD)}/sq yd`;
  }
  return `${formatRupees(pricePerSqft)}/sqft`;
}

// Registry powering the admin-configurable "List" view for both Listings and
// Projects (see /admin/list-view-settings, components/ListingsListView.tsx,
// components/ProjectsListView.tsx). An admin picks which of these fields show
// as columns, and in what order, separately for each property type — a Plot
// has no use for "Bedrooms" but very much cares about "Approved By", while an
// Apartment is the other way round. The chosen columns (an ordered array of
// field keys) are stored per (entityType, propertyType) combination in the
// listViewFieldSettings singleton row (schema.ts) as one JSON blob, same
// pattern as listingFieldSettings/adPlacementSettings.
//
// Deliberately scoped to *plain columns* on the listings/projects tables
// only — no computed/joined fields (e.g. a project's "starting price", which
// is a subquery over its listings) — so every field here can be sorted and
// filtered directly at the SQL level with a simple, uniform code path. If a
// computed field is wanted here later, it needs its own sort/filter handling
// wherever queries.ts builds the list-view query, not just a registry entry.
import { and, asc, desc, eq, gte, lte, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { listings, projects } from "@/db/schema";
import { propertyTypeLabel, formatPrice, formatRupees, formatDate } from "@/lib/format";
import {
  FACING_OPTIONS,
  ALL_FURNISHING_OPTIONS,
  APPROVED_BY_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
  facingLabel,
  furnishingLabel,
  approvedByLabel,
  ownershipTypeLabel,
} from "@/lib/listingFields";

export const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"] as const;
export type PropertyTypeKey = (typeof PROPERTY_TYPES)[number];

export type ListViewEntity = "listing" | "project";

export type ListViewFieldType = "text" | "number" | "currency" | "boolean" | "enum" | "date";

type ListingRow = typeof listings.$inferSelect;
type ProjectRow = typeof projects.$inferSelect;

export type ListViewFieldDef = {
  key: string;
  label: string;
  type: ListViewFieldType;
  // The underlying column — every field here maps to a real column, which is
  // what makes every field here sortable and filterable at the DB level.
  column: AnyColumn;
  options?: readonly { value: string; label: string }[]; // for type "enum"
  // Renders the cell's display value from a full row (listings.$inferSelect
  // or projects.$inferSelect, depending on entity) — kept loose since one
  // array holds fields for both row shapes, each format() fn below is typed
  // to its own concrete row shape (ListingRow/ProjectRow) at its definition
  // site, and the generic ListViewTable component calls it with whichever
  // row type it was actually rendering. Not worth the ceremony of making
  // this type generic over Row for an internal formatting helper.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format: (row: any) => string;
};

// Only the {key, label, type, options} a client component actually needs to
// render checkboxes/labels — `column` (a Drizzle Column instance) and
// `format` (a function) are not serializable across the server/client
// boundary, so the admin settings page must strip them before handing the
// registry to its client form.
export type ListViewFieldMeta = Pick<ListViewFieldDef, "key" | "label" | "type" | "options">;

export function toFieldMeta(fields: ListViewFieldDef[]): ListViewFieldMeta[] {
  return fields.map(({ key, label, type, options }) => ({ key, label, type, options }));
}

const dash = (value: unknown): string => (value == null || value === "" ? "—" : String(value));
const yesNo = (value: boolean | null | undefined) => (value ? "Yes" : "No");

const LISTING_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "expired", label: "Expired" },
] as const;

const LISTING_TYPE_OPTIONS = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
] as const;

const CONSTRUCTION_STATUS_OPTIONS = [
  { value: "under_construction", label: "Under construction" },
  { value: "ready_to_move", label: "Ready to move" },
] as const;

// "title"/"name" are deliberately NOT in these lists — every list-view table
// always shows an unremovable, unmovable first column linking to the
// listing/project itself (see ListingsListView.tsx/ProjectsListView.tsx), so
// there's never a way for an admin to configure the table into a dead end
// with no way to click through to anything.
export const LISTING_LIST_FIELDS: ListViewFieldDef[] = [
  {
    key: "listingType",
    label: "Buy / Rent",
    type: "enum",
    column: listings.listingType,
    options: LISTING_TYPE_OPTIONS,
    format: (row: ListingRow) => (row.listingType === "sale" ? "Buy" : "Rent"),
  },
  {
    key: "propertyType",
    label: "Property Type",
    type: "enum",
    column: listings.propertyType,
    options: PROPERTY_TYPES.map((v) => ({ value: v, label: propertyTypeLabel(v) })),
    format: (row: ListingRow) => propertyTypeLabel(row.propertyType),
  },
  {
    key: "price",
    label: "Price",
    type: "currency",
    column: listings.price,
    format: (row: ListingRow) => formatPrice(row.price, row.listingType),
  },
  { key: "bhk", label: "BHK", type: "number", column: listings.bhk, format: (row: ListingRow) => dash(row.bhk) },
  {
    key: "bathrooms",
    label: "Bathrooms",
    type: "number",
    column: listings.bathrooms,
    format: (row: ListingRow) => dash(row.bathrooms),
  },
  {
    key: "carParking",
    label: "Car Parking",
    type: "number",
    column: listings.carParking,
    format: (row: ListingRow) => dash(row.carParking),
  },
  {
    key: "areaSqft",
    label: "Area (sqft)",
    type: "number",
    column: listings.areaSqft,
    format: (row: ListingRow) => (row.areaSqft ? row.areaSqft.toLocaleString("en-IN") : "—"),
  },
  {
    key: "locality",
    label: "Locality",
    type: "text",
    column: listings.locality,
    format: (row: ListingRow) => row.locality,
  },
  { key: "city", label: "City", type: "text", column: listings.city, format: (row: ListingRow) => row.city },
  {
    key: "facing",
    label: "Facing",
    type: "enum",
    column: listings.facing,
    options: FACING_OPTIONS,
    format: (row: ListingRow) => dash(facingLabel(row.facing)),
  },
  {
    key: "furnishingStatus",
    label: "Furnishing",
    type: "enum",
    column: listings.furnishingStatus,
    options: ALL_FURNISHING_OPTIONS,
    format: (row: ListingRow) => dash(furnishingLabel(row.furnishingStatus)),
  },
  {
    key: "unitFloor",
    label: "Floor",
    type: "number",
    column: listings.unitFloor,
    format: (row: ListingRow) => dash(row.unitFloor),
  },
  {
    key: "totalFloors",
    label: "Total Floors",
    type: "number",
    column: listings.totalFloors,
    format: (row: ListingRow) => dash(row.totalFloors),
  },
  {
    key: "status",
    label: "Status",
    type: "enum",
    column: listings.status,
    options: LISTING_STATUS_OPTIONS,
    format: (row: ListingRow) => LISTING_STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status,
  },
  {
    key: "featured",
    label: "Featured",
    type: "boolean",
    column: listings.featured,
    format: (row: ListingRow) => yesNo(row.featured),
  },
  {
    key: "verified",
    label: "Verified",
    type: "boolean",
    column: listings.verified,
    format: (row: ListingRow) => yesNo(row.verified),
  },
  {
    key: "approvedBy",
    label: "Approved By",
    type: "enum",
    column: listings.approvedBy,
    options: APPROVED_BY_OPTIONS,
    format: (row: ListingRow) => dash(approvedByLabel(row.approvedBy)),
  },
  {
    key: "ownershipType",
    label: "Ownership",
    type: "enum",
    column: listings.ownershipType,
    options: OWNERSHIP_TYPE_OPTIONS,
    format: (row: ListingRow) => dash(ownershipTypeLabel(row.ownershipType)),
  },
  { key: "views", label: "Views", type: "number", column: listings.views, format: (row: ListingRow) => String(row.views) },
  {
    key: "createdAt",
    label: "Posted",
    type: "date",
    column: listings.createdAt,
    format: (row: ListingRow) => formatDate(row.createdAt),
  },
];

export const PROJECT_LIST_FIELDS: ListViewFieldDef[] = [
  {
    key: "developerName",
    label: "Developer",
    type: "text",
    column: projects.developerName,
    format: (row: ProjectRow) => dash(row.developerName),
  },
  {
    key: "propertyType",
    label: "Property Type",
    type: "enum",
    column: projects.propertyType,
    options: PROPERTY_TYPES.map((v) => ({ value: v, label: propertyTypeLabel(v) })),
    format: (row: ProjectRow) => propertyTypeLabel(row.propertyType),
  },
  {
    key: "constructionStatus",
    label: "Construction Status",
    type: "enum",
    column: projects.constructionStatus,
    options: CONSTRUCTION_STATUS_OPTIONS,
    format: (row: ProjectRow) =>
      CONSTRUCTION_STATUS_OPTIONS.find((o) => o.value === row.constructionStatus)?.label ?? row.constructionStatus,
  },
  { key: "locality", label: "Locality", type: "text", column: projects.locality, format: (row: ProjectRow) => row.locality },
  { key: "city", label: "City", type: "text", column: projects.city, format: (row: ProjectRow) => row.city },
  {
    key: "areaAcres",
    label: "Area (acres)",
    type: "number",
    column: projects.areaAcres,
    format: (row: ProjectRow) => dash(row.areaAcres),
  },
  {
    key: "totalUnits",
    label: "Total Units",
    type: "number",
    column: projects.totalUnits,
    format: (row: ProjectRow) => dash(row.totalUnits),
  },
  { key: "towers", label: "Towers", type: "number", column: projects.towers, format: (row: ProjectRow) => dash(row.towers) },
  {
    key: "maxFloors",
    label: "Max Floors",
    type: "number",
    column: projects.maxFloors,
    format: (row: ProjectRow) => dash(row.maxFloors),
  },
  {
    key: "minAreaSqft",
    label: "Min Area (sqft)",
    type: "number",
    column: projects.minAreaSqft,
    format: (row: ProjectRow) => (row.minAreaSqft ? row.minAreaSqft.toLocaleString("en-IN") : "—"),
  },
  {
    key: "maxAreaSqft",
    label: "Max Area (sqft)",
    type: "number",
    column: projects.maxAreaSqft,
    format: (row: ProjectRow) => (row.maxAreaSqft ? row.maxAreaSqft.toLocaleString("en-IN") : "—"),
  },
  {
    key: "reraNumber",
    label: "RERA Number",
    type: "text",
    column: projects.reraNumber,
    format: (row: ProjectRow) => dash(row.reraNumber),
  },
  {
    key: "reraApprovalYear",
    label: "RERA Approval Year",
    type: "number",
    column: projects.reraApprovalYear,
    format: (row: ProjectRow) => dash(row.reraApprovalYear),
  },
  {
    key: "possessionYear",
    label: "Possession Year",
    type: "number",
    column: projects.possessionYear,
    format: (row: ProjectRow) => dash(row.possessionYear),
  },
  {
    key: "basePricePerSqft",
    label: "Base Price / sqft",
    type: "number",
    column: projects.basePricePerSqft,
    format: (row: ProjectRow) => (row.basePricePerSqft ? `${formatRupees(row.basePricePerSqft)}/sqft` : "—"),
  },
  {
    key: "reraVerified",
    label: "RERA Verified",
    type: "boolean",
    column: projects.reraVerified,
    format: (row: ProjectRow) => yesNo(row.reraVerified),
  },
  {
    key: "approvedBy",
    label: "Approved By",
    type: "enum",
    column: projects.approvedBy,
    options: APPROVED_BY_OPTIONS,
    format: (row: ProjectRow) => dash(approvedByLabel(row.approvedBy)),
  },
  {
    key: "featured",
    label: "Featured",
    type: "boolean",
    column: projects.featured,
    format: (row: ProjectRow) => yesNo(row.featured),
  },
  {
    key: "createdAt",
    label: "Posted",
    type: "date",
    column: projects.createdAt,
    format: (row: ProjectRow) => formatDate(row.createdAt),
  },
];

function fieldsFor(entity: ListViewEntity): ListViewFieldDef[] {
  return entity === "listing" ? LISTING_LIST_FIELDS : PROJECT_LIST_FIELDS;
}

// Sensible out-of-the-box columns per property type, shown until an admin
// actually configures something at /admin/list-view-settings — chosen to
// mirror what each property type's fixed detail fields already emphasize
// elsewhere in the app (e.g. Plot cares about approvedBy/ownershipType,
// Apartment cares about bhk/bathrooms).
const DEFAULT_LISTING_FIELDS: Record<PropertyTypeKey, string[]> = {
  apartment: ["listingType", "price", "bhk", "bathrooms", "areaSqft", "locality", "furnishingStatus", "verified"],
  villa: ["listingType", "price", "bhk", "areaSqft", "locality", "ownershipType", "verified"],
  independent_house: ["listingType", "price", "bhk", "areaSqft", "locality", "ownershipType", "verified"],
  plot: ["listingType", "price", "areaSqft", "locality", "approvedBy", "ownershipType", "verified"],
  commercial: ["listingType", "price", "areaSqft", "locality", "furnishingStatus", "verified"],
};

const DEFAULT_PROJECT_FIELDS: Record<PropertyTypeKey, string[]> = {
  apartment: ["developerName", "constructionStatus", "locality", "totalUnits", "minAreaSqft", "maxAreaSqft", "reraVerified"],
  villa: ["developerName", "constructionStatus", "locality", "totalUnits", "minAreaSqft", "maxAreaSqft", "approvedBy"],
  independent_house: [
    "developerName",
    "constructionStatus",
    "locality",
    "totalUnits",
    "minAreaSqft",
    "maxAreaSqft",
    "approvedBy",
  ],
  plot: ["developerName", "locality", "areaAcres", "totalUnits", "approvedBy", "reraNumber"],
  commercial: ["developerName", "constructionStatus", "locality", "minAreaSqft", "maxAreaSqft", "reraVerified"],
};

// Shown when the current results span more than one property type (i.e. no
// single Property Type filter is active) — an admin's per-property-type
// column choices don't apply to a mixed set of rows, so this fixed, sensible
// common-denominator set is used instead. Not itself admin-configurable;
// narrowing the Property Type filter to exactly one type switches the table
// over to that type's configured columns.
const LISTING_FALLBACK_FIELDS = ["propertyType", "listingType", "price", "locality", "bhk", "verified", "createdAt"];
const PROJECT_FALLBACK_FIELDS = [
  "propertyType",
  "developerName",
  "constructionStatus",
  "locality",
  "totalUnits",
  "featured",
  "createdAt",
];

export type ListViewFieldSettingsConfig = {
  listing: Record<PropertyTypeKey, string[]>;
  project: Record<PropertyTypeKey, string[]>;
};

// Fills in defaults for anything missing/invalid from the stored config —
// same "tolerate a partial/stale blob" approach as
// listingFields.ts's resolveFieldVisibility. Field keys that no longer exist
// in the registry (e.g. after a future rename) are silently dropped rather
// than blowing up the page.
export function resolveListViewFieldSettings(
  stored: Partial<{ listing: Partial<Record<string, string[]>>; project: Partial<Record<string, string[]>> }> | null | undefined
): ListViewFieldSettingsConfig {
  const build = (entity: ListViewEntity, defaults: Record<PropertyTypeKey, string[]>) => {
    const registryKeys = new Set(fieldsFor(entity).map((f) => f.key));
    const result = {} as Record<PropertyTypeKey, string[]>;
    for (const pt of PROPERTY_TYPES) {
      const storedKeys = stored?.[entity]?.[pt];
      const valid = Array.isArray(storedKeys) ? storedKeys.filter((k) => registryKeys.has(k)) : null;
      result[pt] = valid && valid.length > 0 ? Array.from(new Set(valid)) : defaults[pt];
    }
    return result;
  };
  return {
    listing: build("listing", DEFAULT_LISTING_FIELDS),
    project: build("project", DEFAULT_PROJECT_FIELDS),
  };
}

// The columns to actually render for the current result set. `propertyType`
// is the currently-active Property Type filter (undefined/"" means "showing
// every type at once") — see the comment on *_FALLBACK_FIELDS above for why
// that matters.
export function getEffectiveListViewFields(
  entity: ListViewEntity,
  propertyType: string | undefined,
  config: ListViewFieldSettingsConfig
): ListViewFieldDef[] {
  const registry = fieldsFor(entity);
  const byKey = new Map(registry.map((f) => [f.key, f]));
  const isKnownType = (t: string | undefined): t is PropertyTypeKey =>
    !!t && (PROPERTY_TYPES as readonly string[]).includes(t);

  const keys = isKnownType(propertyType)
    ? config[entity][propertyType]
    : entity === "listing"
      ? LISTING_FALLBACK_FIELDS
      : PROJECT_FALLBACK_FIELDS;

  const resolved = keys.map((k) => byKey.get(k)).filter((f): f is ListViewFieldDef => !!f);
  return resolved.length > 0 ? resolved : registry.slice(0, 6);
}

// Query-param naming for a column's sort link / filter inputs, shared
// between the list-view table components (which build the links/inputs) and
// queries.ts (which reads them back out) so the two can never drift apart.
export const LIST_VIEW_SORT_FIELD_PARAM = "sortField";
export const LIST_VIEW_SORT_DIR_PARAM = "sortDir";
// "currency" (price, base price/sqft, ...) filters exactly like "number" —
// a min/max range — it's only a distinct type so the table can format its
// cells with formatPrice/formatRupees instead of a bare number.
export const isNumericType = (type: ListViewFieldType) => type === "number" || type === "currency";

export const columnFilterParamNames = (key: string, type: ListViewFieldType) => {
  if (isNumericType(type)) return { min: `cf_${key}_min`, max: `cf_${key}_max` };
  if (type === "date") return { from: `cf_${key}_from`, to: `cf_${key}_to` };
  return { value: `cf_${key}` };
};

type SearchParamsLike = Record<string, string | string[] | undefined>;

function readStringParam(sp: SearchParamsLike, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v !== "" ? v : undefined;
}

// Turns the current searchParams into Drizzle WHERE conditions for whichever
// columns are actually displayed — a column not currently shown never
// silently filters the results, keeping "what you see is what's filtering"
// true even as the admin changes the configured columns over time.
export function buildColumnFilterConditions(fields: ListViewFieldDef[], sp: SearchParamsLike): SQL[] {
  const conditions: SQL[] = [];
  for (const f of fields) {
    if (isNumericType(f.type)) {
      const { min, max } = columnFilterParamNames(f.key, f.type) as { min: string; max: string };
      const minVal = readStringParam(sp, min);
      const maxVal = readStringParam(sp, max);
      if (minVal != null && !Number.isNaN(Number(minVal))) conditions.push(gte(f.column, Number(minVal)));
      if (maxVal != null && !Number.isNaN(Number(maxVal))) conditions.push(lte(f.column, Number(maxVal)));
    } else if (f.type === "date") {
      const { from, to } = columnFilterParamNames(f.key, f.type) as { from: string; to: string };
      const fromVal = readStringParam(sp, from);
      const toVal = readStringParam(sp, to);
      if (fromVal) conditions.push(gte(f.column, fromVal));
      if (toVal) conditions.push(lte(f.column, toVal + "T23:59:59"));
    } else if (f.type === "boolean") {
      const { value } = columnFilterParamNames(f.key, f.type) as { value: string };
      const val = readStringParam(sp, value);
      if (val === "1") conditions.push(eq(f.column, true as never));
      else if (val === "0") conditions.push(eq(f.column, false as never));
    } else if (f.type === "enum") {
      const { value } = columnFilterParamNames(f.key, f.type) as { value: string };
      const val = readStringParam(sp, value);
      if (val) conditions.push(eq(f.column, val as never));
    } else {
      const { value } = columnFilterParamNames(f.key, f.type) as { value: string };
      const val = readStringParam(sp, value);
      if (val) conditions.push(sql`${f.column} like ${"%" + val + "%"}`);
    }
  }
  return conditions;
}

// Resolves the current sort request (?sortField=&sortDir=) against the
// visible columns only — sorting by a column the table isn't even showing
// would be confusing, so an unrecognized/hidden sortField silently falls
// back to `fallback`.
export function resolveListViewOrderBy(fields: ListViewFieldDef[], sp: SearchParamsLike, fallback: SQL[]): SQL[] {
  const sortField = readStringParam(sp, LIST_VIEW_SORT_FIELD_PARAM);
  const sortDir = readStringParam(sp, LIST_VIEW_SORT_DIR_PARAM) === "asc" ? "asc" : "desc";
  const field = sortField ? fields.find((f) => f.key === sortField) : undefined;
  if (!field) return fallback;
  return [sortDir === "asc" ? asc(field.column) : desc(field.column)];
}

// and/from drizzle-orm re-exported here purely so queries.ts's list-view
// query functions don't need a second near-identical import line just for
// `and` on top of what buildColumnFilterConditions/resolveListViewOrderBy
// already need from this module.
export { and };

import { formatRupees } from "@/lib/format";

// Single shared source of truth for the project pricing/charges fields (see
// schema.ts's projects table comment) — every place that shows this data
// (the public project page, the /projects/compare comparison table, and the
// admin form's labels) reads from PRICING_FIELD_DEFS rather than re-deriving
// its own copy of "which fields exist, in what order, with what unit."
// Adding a genuinely new charge type later means adding one entry here plus
// the matching schema column — nowhere else needs to change.
export const PRICING_FIELD_DEFS = [
  { key: "basePricePerSqft", label: "Base price", unit: "per sqft", suffix: "/sqft" },
  { key: "floorRiseChargePerSqftPerFloor", label: "Floor rise charge", unit: "per sqft, per floor", suffix: "/sqft/floor" },
  { key: "infraChargesPerSqft", label: "Infra charges", unit: "per sqft", suffix: "/sqft" },
  { key: "additionalPlcChargesPerSqft", label: "Additional PLC charges", unit: "per sqft", suffix: "/sqft" },
  { key: "clubhouseCharges", label: "Clubhouse charges", unit: "flat, one-time", suffix: "" },
  { key: "carParkingChargePerCar", label: "Car parking", unit: "per car", suffix: "/car" },
  { key: "otherAmenitiesCharges", label: "Other amenities charges", unit: "flat, one-time", suffix: "" },
  { key: "legalDocumentationCharges", label: "Legal & documentation charges", unit: "flat, one-time", suffix: "" },
  { key: "corpusCharges", label: "Corpus charges", unit: "flat, one-time", suffix: "" },
  { key: "maintenanceChargePerSqftPerMonth", label: "Maintenance charges", unit: "per sqft, per month", suffix: "/sqft/mo" },
] as const;

export type PricingFieldKey = (typeof PRICING_FIELD_DEFS)[number]["key"];

export type ProjectPricing = Record<PricingFieldKey, number | null>;

/** True if an admin has set at least one of the 10 pricing fields — gates
 * whether the "Pricing breakdown" section renders at all on the project page
 * (most projects will start with none of these filled in). */
export function hasAnyPricing(project: Partial<ProjectPricing>): boolean {
  return PRICING_FIELD_DEFS.some((f) => project[f.key] != null);
}

/** e.g. "₹4,850/sqft" or "₹1,50,000" for a flat charge — the one place that
 * turns a raw number into the string shown on both the project page and the
 * comparison table, so the two never drift out of formatting sync. */
export function formatPricingValue(key: PricingFieldKey, value: number): string {
  const def = PRICING_FIELD_DEFS.find((f) => f.key === key)!;
  return `${formatRupees(value)}${def.suffix}`;
}

/** Months after which "Pricing as of <date>" gets a visible staleness warning
 * on both the project page and the comparison table. Kept as one named
 * constant rather than a magic number scattered across both call sites. */
const STALE_AFTER_MONTHS = 6;

/** True once pricingUpdatedAt is more than STALE_AFTER_MONTHS old (or is
 * missing entirely, e.g. an old project that predates this field but still
 * has pricing set from before auto-tracking existed) — gates the "may be
 * outdated" note shown alongside the plain date. */
export function isPricingStale(pricingUpdatedAt: string | null): boolean {
  if (!pricingUpdatedAt) return true;
  const updated = new Date(pricingUpdatedAt);
  if (Number.isNaN(updated.getTime())) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STALE_AFTER_MONTHS);
  return updated < cutoff;
}

/** A rough, one-time "all-in" estimate for the smallest unit in the project:
 * base price + infra + PLC (all per-sqft, multiplied by the project's own
 * minimum unit size) plus every flat one-time charge, assuming a single car
 * park. Deliberately excludes floor rise (depends on which floor — unknowable
 * here) and maintenance (a recurring cost, not a one-time purchase cost) —
 * both are still shown as their own rows alongside this total. Returns null
 * when there isn't enough set to make the number meaningful (no base price,
 * or no known unit size to multiply it by), rather than silently estimating
 * from zero. */
export function estimateOneTimeTotal(
  project: Partial<ProjectPricing> & { minAreaSqft: number | null }
): number | null {
  if (project.basePricePerSqft == null || project.minAreaSqft == null) return null;
  const area = project.minAreaSqft;
  return (
    project.basePricePerSqft * area +
    (project.infraChargesPerSqft ?? 0) * area +
    (project.additionalPlcChargesPerSqft ?? 0) * area +
    (project.clubhouseCharges ?? 0) +
    (project.carParkingChargePerCar ?? 0) * 1 +
    (project.otherAmenitiesCharges ?? 0) +
    (project.legalDocumentationCharges ?? 0) +
    (project.corpusCharges ?? 0)
  );
}

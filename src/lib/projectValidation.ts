// Shared project field validation — used by both the single-project admin
// form (src/app/admin/actions.ts) and the bulk-upload importer
// (src/lib/bulkProjects.ts). Split out into its own module (rather than
// living in actions.ts) because a "use server" file may only export async
// functions — a plain const array or a zod schema can't live there.
import { z } from "zod";
import { getVideoEmbedUrl } from "@/lib/video";

export const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"] as const;
export const CONSTRUCTION_STATUSES = ["under_construction", "ready_to_move"] as const;

export const projectSchema = z.object({
  name: z.string().min(2, "Enter a project name"),
  developerName: z.string().optional(),
  developerUrl: z.string().optional(),
  locality: z.string().min(2, "Enter a locality"),
  city: z.string().min(2, "Enter a city"),
  propertyType: z.enum(PROPERTY_TYPES),
  constructionStatus: z.enum(CONSTRUCTION_STATUSES),
  areaAcres: z.coerce.number().positive().optional(),
  totalUnits: z.coerce.number().int().positive().optional(),
  towers: z.coerce.number().int().positive().optional(),
  maxFloors: z.coerce.number().int().positive().optional(),
  unitsPerFloor: z.string().optional(),
  minAreaSqft: z.coerce.number().int().positive().optional(),
  maxAreaSqft: z.coerce.number().int().positive().optional(),
  bhkOptions: z.string().optional(),
  reraNumber: z.string().optional(),
  reraApprovalYear: z.coerce.number().int().optional(),
  possessionYear: z.coerce.number().int().optional(),
  unitDensityPerAcre: z.coerce.number().int().positive().optional(),
  floorAreaRatio: z.coerce.number().positive().optional(),
  description: z.string().optional(),
  brochureUrl: z.string().optional(),
  // Pricing/charges — see schema.ts's projects table comment and
  // lib/projectPricing.ts. All optional; a project can have none, some, or
  // all filled in.
  basePricePerSqft: z.coerce.number().positive().optional(),
  floorRiseChargePerSqftPerFloor: z.coerce.number().positive().optional(),
  clubhouseCharges: z.coerce.number().int().positive().optional(),
  carParkingChargePerCar: z.coerce.number().int().positive().optional(),
  otherAmenitiesCharges: z.coerce.number().int().positive().optional(),
  infraChargesPerSqft: z.coerce.number().positive().optional(),
  additionalPlcChargesPerSqft: z.coerce.number().positive().optional(),
  legalDocumentationCharges: z.coerce.number().int().positive().optional(),
  corpusCharges: z.coerce.number().int().positive().optional(),
  maintenanceChargePerSqftPerMonth: z.coerce.number().positive().optional(),
  contactPhone: z.string().optional(),
  videoUrl: z.string().optional().refine((v) => !v || getVideoEmbedUrl(v) !== null, "Enter a valid YouTube video link"),
  // Set only when an admin has manually placed/dragged the pin in
  // LocationPicker (see ProjectForm.tsx) — absent otherwise, in which case
  // adminCreateProjectAction/adminUpdateProjectAction fall back to
  // geocoding the locality text as before. When present, both must be
  // present together (LocationPicker always submits them as a pair).
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90").optional(),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180").optional(),
  // Same enum as listings' approvedBy, but never nulled by
  // resolveProjectFieldsForType — see schema.ts's comment on
  // projects.approvedBy for why it applies to every project type.
  approvedBy: z.enum(["hmda", "dtcp", "gram_panchayat", "ghmc", "rera"]).optional(),
});

// Which "Scale"/"Approval & stats" fields actually apply to which property
// type — mirrors resolveExtendedListingFields' role for individual listings
// (see listingValidation.ts) and ProjectForm.tsx's own show/hide logic, so a
// field that ProjectForm hides for a given type can never linger in the
// database with a stale value from before the type was changed (e.g. a
// project switched from Apartment to Plot keeps a "Towers: 4" that no admin
// can even see or clear anymore). Fields not mentioned here (totalUnits,
// areaAcres, minAreaSqft, maxAreaSqft, unitDensityPerAcre, and everything
// outside Scale/Approval & stats) apply to every property type — only
// relabeled in the UI, never hidden.
export function resolveProjectFieldsForType(
  propertyType: string,
  data: Pick<z.infer<typeof projectSchema>, "towers" | "maxFloors" | "unitsPerFloor" | "bhkOptions" | "floorAreaRatio">
) {
  const isApartmentOrCommercial = propertyType === "apartment" || propertyType === "commercial";
  const isVillaLike = propertyType === "villa" || propertyType === "independent_house";
  const isPlot = propertyType === "plot";

  return {
    // Towers/Units-per-floor only make sense for a multi-unit building —
    // a standalone villa community or a raw plotted layout has neither.
    towers: isApartmentOrCommercial ? data.towers ?? null : null,
    unitsPerFloor: isApartmentOrCommercial ? data.unitsPerFloor || null : null,
    // Max floors still applies to villas (e.g. G+1/G+2), just not to a plot
    // — nothing is built yet, so there's no floor count to give.
    maxFloors: !isPlot ? data.maxFloors ?? null : null,
    // BHK is a residential-unit concept — meaningless for a plotted layout
    // (nothing built) or a commercial development (offices/shops, not BHK).
    bhkOptions: propertyType === "apartment" || isVillaLike ? data.bhkOptions || null : null,
    // Floor area ratio is a built-form metric — doesn't apply before
    // anything's constructed on a plot.
    floorAreaRatio: !isPlot ? data.floorAreaRatio ?? null : null,
  };
}

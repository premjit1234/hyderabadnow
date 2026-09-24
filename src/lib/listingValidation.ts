// Shared listing edit validation — used by both the admin listing edit
// action and the owner-facing self-service edit action
// (src/app/admin/actions.ts and src/app/actions.ts). Split out into its own
// module (rather than living in either actions.ts) because a "use server"
// file may only export async functions — a plain const array or a zod
// schema can't live there. Same pattern as lib/projectValidation.ts.
import { z } from "zod";
import { getVideoEmbedUrl } from "@/lib/video";
import { isEmbeddableTourUrl } from "@/lib/virtualTour";

export const LISTING_STATUSES = ["active", "pending", "sold", "rented", "expired"] as const;

// The fields an owner can edit are identical to what an admin can edit here;
// only the authorization check differs (ownership vs. requireAdmin) and the
// owner-only UI omits the admin-only featured/verified checkboxes (handled
// outside this schema in both action bodies).
export const editListingSchema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters"),
  description: z.string().min(20, "Add a bit more description (20+ characters)"),
  price: z.coerce.number().int().positive("Enter a valid price"),
  listingType: z.enum(["sale", "rent"]),
  propertyType: z.enum(["apartment", "villa", "independent_house", "plot", "commercial"]),
  bhk: z.coerce.number().int().min(0).max(10).optional(),
  bathrooms: z.coerce.number().int().min(0).max(10).optional(),
  carParking: z.coerce.number().int().min(0).max(10).optional(),
  areaSqft: z.coerce.number().int().positive("Enter a valid area"),
  locality: z.string().min(2, "Enter a locality"),
  city: z.string().min(2, "Enter a city"),
  address: z.string().optional(),
  status: z.enum(LISTING_STATUSES),
  contactPhone: z.string().optional(),
  towerName: z.string().optional(),
  unitNumber: z.string().optional(),
  unitFloor: z.coerce.number().int().optional(),
  facing: z.enum(["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"]).optional(),
  furnishingStatus: z.enum(["unfurnished", "semi_furnished", "fully_furnished", "bare_shell", "warm_shell"]).optional(),
  inventoryState: z.enum(["new", "resale"]).optional(),
  sellerAskPrice: z.coerce.number().int().positive().optional(),
  sellerBestPrice: z.coerce.number().int().positive().optional(),
  cashRatioPercent: z.coerce.number().int().min(0).max(100).optional(),
  videoUrl: z.string().optional().refine((v) => !v || getVideoEmbedUrl(v) !== null, "Enter a valid YouTube video link"),
  virtualTourUrl: z.string().optional().refine((v) => !v || isEmbeddableTourUrl(v), "Enter a valid http(s) virtual tour URL"),
  internalNote: z.string().optional(),
  // ---- Property-type-specific fields (see schema.ts for the full rundown) ----
  totalFloors: z.coerce.number().int().min(0).optional(),
  maintenanceChargePerMonth: z.coerce.number().int().min(0).optional(),
  plotAreaSqft: z.coerce.number().int().positive().optional(),
  numberOfFloors: z.string().optional(),
  waterSource: z.enum(["borewell", "municipal", "both"]).optional(),
  plotDimensions: z.string().optional(),
  openSides: z.coerce.number().int().min(1).max(4).optional(),
  roadWidthFt: z.coerce.number().int().positive().optional(),
  approvedBy: z.enum(["hmda", "dtcp", "gram_panchayat", "ghmc", "rera"]).optional(),
  ownershipType: z.enum(["freehold", "leasehold", "power_of_attorney", "cooperative_society"]).optional(),
  washrooms: z.coerce.number().int().min(0).max(20).optional(),
  parkingType: z.enum(["public", "reserved"]).optional(),
  // Yes/No checkboxes (boundaryWall, cornerProperty, gatedCommunityLayout,
  // powerBackup, occupancyCertificate) are read straight off formData in the
  // actions themselves — same "on"/absent pattern as whatsappEnabled — rather
  // than through this schema, since a checkbox never fails validation.
});

// Zod-parsed shape of the property-type-specific fields (see schema.ts),
// shared by every create/edit action (owner + admin, in app/actions.ts and
// app/admin/actions.ts) so this one function is the single source of truth
// for "which field belongs to which property type" — matches
// scratch/post-listing-dynamic-fields-proposal.md. A field submitted for the
// "wrong" propertyType (e.g. Plot Dimensions on an Apartment listing, via a
// stale form or a crafted request) is dropped rather than stored, so a
// listing's extra fields always stay consistent with its own propertyType.
// Boolean Yes/No fields resolve to null (not false) when they don't apply to
// the type at all, so the public listing page's "only show if present"
// fields naturally hide them instead of showing a misleading "No".
//
// Lives here (a plain module, not a "use server" actions file) because
// Next.js requires every export of a "use server" file to be an async
// function — this needs to stay a plain synchronous helper.
type ExtendedListingFieldInput = {
  totalFloors?: number;
  maintenanceChargePerMonth?: number;
  plotAreaSqft?: number;
  numberOfFloors?: string;
  waterSource?: "borewell" | "municipal" | "both";
  plotDimensions?: string;
  openSides?: number;
  roadWidthFt?: number;
  approvedBy?: "hmda" | "dtcp" | "gram_panchayat" | "ghmc" | "rera";
  ownershipType?: "freehold" | "leasehold" | "power_of_attorney" | "cooperative_society";
  washrooms?: number;
  parkingType?: "public" | "reserved";
};

export function resolveExtendedListingFields(formData: FormData, propertyType: string, data: ExtendedListingFieldInput) {
  const isApartment = propertyType === "apartment";
  const isVillaLike = propertyType === "villa" || propertyType === "independent_house";
  const isPlot = propertyType === "plot";
  const isCommercial = propertyType === "commercial";
  const bool = (name: string, applicable: boolean) => (applicable ? formData.get(name) === "on" : null);

  return {
    totalFloors: isApartment || isCommercial ? data.totalFloors ?? null : null,
    maintenanceChargePerMonth: isApartment ? data.maintenanceChargePerMonth ?? null : null,
    // Villa/Independent House use plotAreaSqft (land size) alongside the
    // shared areaSqft column (relabeled "Built-up Area" for that type — see
    // PostListingForm.tsx). Plot listings instead reuse areaSqft itself as
    // their one and only area figure, labeled "Plot Area (sqft)" — there's no
    // separate built-up/carpet distinction on raw land, so plotAreaSqft stays
    // unused for Plot (see the proposal doc's Plot/Land section).
    plotAreaSqft: isVillaLike ? data.plotAreaSqft ?? null : null,
    numberOfFloors: isVillaLike ? data.numberOfFloors?.trim() || null : null,
    boundaryWall: bool("boundaryWall", isVillaLike || isPlot),
    cornerProperty: bool("cornerProperty", isVillaLike || isPlot),
    waterSource: isVillaLike ? data.waterSource ?? null : null,
    plotDimensions: isPlot ? data.plotDimensions?.trim() || null : null,
    openSides: isPlot ? data.openSides ?? null : null,
    roadWidthFt: isPlot ? data.roadWidthFt ?? null : null,
    approvedBy: isPlot ? data.approvedBy ?? null : null,
    ownershipType: isPlot ? data.ownershipType ?? null : null,
    gatedCommunityLayout: bool("gatedCommunityLayout", isPlot),
    washrooms: isCommercial ? data.washrooms ?? null : null,
    parkingType: isCommercial ? data.parkingType ?? null : null,
    powerBackup: bool("powerBackup", isCommercial),
    occupancyCertificate: bool("occupancyCertificate", isCommercial),
  };
}

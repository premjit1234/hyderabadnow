// Shared listing edit validation — used by both the admin listing edit
// action and the owner-facing self-service edit action
// (src/app/admin/actions.ts and src/app/actions.ts). Split out into its own
// module (rather than living in either actions.ts) because a "use server"
// file may only export async functions — a plain const array or a zod
// schema can't live there. Same pattern as lib/projectValidation.ts.
import { z } from "zod";
import { getVideoEmbedUrl } from "@/lib/video";

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
  furnishingStatus: z.enum(["unfurnished", "semi_furnished", "fully_furnished"]).optional(),
  inventoryState: z.enum(["new", "resale"]).optional(),
  sellerAskPrice: z.coerce.number().int().positive().optional(),
  sellerBestPrice: z.coerce.number().int().positive().optional(),
  cashRatioPercent: z.coerce.number().int().min(0).max(100).optional(),
  videoUrl: z.string().optional().refine((v) => !v || getVideoEmbedUrl(v) !== null, "Enter a valid YouTube video link"),
});

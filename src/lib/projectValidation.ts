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
  reraApprovalYear: z.coerce.number().int().optional(),
  possessionYear: z.coerce.number().int().optional(),
  unitDensityPerAcre: z.coerce.number().int().positive().optional(),
  floorAreaRatio: z.coerce.number().positive().optional(),
  description: z.string().optional(),
  brochureUrl: z.string().optional(),
  contactPhone: z.string().optional(),
  videoUrl: z.string().optional().refine((v) => !v || getVideoEmbedUrl(v) !== null, "Enter a valid YouTube video link"),
});

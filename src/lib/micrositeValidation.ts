// Core-field validation for a microsite page (see schema.ts's
// micrositePages) — same split-into-its-own-module reasoning as
// projectValidation.ts: admin/micrositeActions.ts is a "use server" file, so
// a plain zod schema can't live there.
import { z } from "zod";
import { isReservedSlug, isValidMicrositeSlugFormat } from "@/lib/reservedSlugs";

export const MICROSITE_PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"] as const;
export const MICROSITE_CONSTRUCTION_STATUSES = ["under_construction", "ready_to_move"] as const;

export const micrositePageSchema = z.object({
  slug: z
    .string()
    .toLowerCase()
    .refine((v) => isValidMicrositeSlugFormat(v), "Use lowercase letters, numbers, and hyphens only (e.g. lumbinivana)")
    .refine((v) => !isReservedSlug(v), "That URL is already used by the site itself — pick a different one"),
  name: z.string().min(2, "Enter a project name"),
  tagline: z.string().optional(),
  developerName: z.string().optional(),
  developerUrl: z.string().optional(),
  locality: z.string().min(2, "Enter a locality"),
  city: z.string().min(2, "Enter a city"),
  propertyType: z.enum(MICROSITE_PROPERTY_TYPES),
  constructionStatus: z.enum(MICROSITE_CONSTRUCTION_STATUSES),
  areaAcres: z.coerce.number().positive().optional(),
  totalUnits: z.coerce.number().int().positive().optional(),
  minAreaSqft: z.coerce.number().int().positive().optional(),
  maxAreaSqft: z.coerce.number().int().positive().optional(),
  bhkOptions: z.string().optional(),
  reraNumber: z.string().optional(),
  possessionYear: z.coerce.number().int().optional(),
  description: z.string().optional(),
  brochureUrl: z.string().optional(),
  specificationsIntro: z.string().optional(),
  contactPhone: z.string().optional(),
});

export type MicrositePageInput = z.infer<typeof micrositePageSchema>;

"use server";

// Admin bulk-upload-projects feature. Two steps, both server actions called
// directly from the client component (src/components/admin/BulkProjectUploadForm.tsx)
// rather than through a <form action>, since the UI needs to show a preview
// table between "parse the file" and "actually insert rows":
//   1. previewBulkProjects  — parses + validates the uploaded workbook, returns
//      per-row results (nothing is written to the database yet).
//   2. commitBulkProjects   — re-validates the rows the client says are ready
//      (never trusts the earlier preview blindly) and inserts them.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/blog";
import { uniqueProjectSlug } from "@/app/admin/actions";
import { parseBulkProjectsWorkbook, validateBulkProjectRow, type BulkRowResult, type BulkProjectFields } from "@/lib/bulkProjects";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
  return session;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // generous for a spreadsheet of text/numbers
const MAX_ROWS_PER_IMPORT = 500;

export type BulkPreviewResult =
  | { ok: false; error: string }
  | { ok: true; rows: BulkRowResult[]; skippedExampleRow: boolean };

export async function previewBulkProjects(formData: FormData): Promise<BulkPreviewResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a .xlsx file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "That file is too large for the bulk-upload template — is it the right file?" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseBulkProjectsWorkbook(buffer);
  if (!parsed.ok) return parsed;

  if (parsed.rows.length === 0) {
    return {
      ok: false,
      error: "No project rows found in the 'Projects' sheet — fill in at least one row below the header and try again.",
    };
  }
  if (parsed.rows.length > MAX_ROWS_PER_IMPORT) {
    return { ok: false, error: `That's ${parsed.rows.length} rows — please split uploads into batches of ${MAX_ROWS_PER_IMPORT} or fewer.` };
  }

  return { ok: true, rows: parsed.rows, skippedExampleRow: parsed.skippedExampleRow };
}

export type BulkCommitResult = {
  created: { name: string; slug: string; projectId: number }[];
  failed: { rowNumber: number; name: string; errors: string[] }[];
};

export async function commitBulkProjects(
  rows: { rowNumber: number; fields: BulkProjectFields }[]
): Promise<BulkCommitResult> {
  await requireAdmin();

  const created: BulkCommitResult["created"] = [];
  const failed: BulkCommitResult["failed"] = [];

  for (const row of rows.slice(0, MAX_ROWS_PER_IMPORT)) {
    // Re-validate from scratch — the client's preview is a display concern,
    // never trusted as the reason to write to the database.
    const result = validateBulkProjectRow(row.fields, row.rowNumber);
    if (result.errors.length > 0 || !result.data) {
      failed.push({ rowNumber: row.rowNumber, name: result.name, errors: result.errors });
      continue;
    }
    const data = result.data;
    try {
      const slug = await uniqueProjectSlug(slugify(data.name));
      const [project] = await db
        .insert(projects)
        .values({
          slug,
          name: data.name,
          developerName: data.developerName,
          developerUrl: data.developerUrl,
          locality: data.locality,
          city: data.city,
          propertyType: data.propertyType,
          constructionStatus: data.constructionStatus,
          areaAcres: data.areaAcres,
          totalUnits: data.totalUnits,
          towers: data.towers,
          maxFloors: data.maxFloors,
          unitsPerFloor: data.unitsPerFloor,
          minAreaSqft: data.minAreaSqft,
          maxAreaSqft: data.maxAreaSqft,
          bhkOptions: data.bhkOptions,
          reraApprovalYear: data.reraApprovalYear,
          possessionYear: data.possessionYear,
          unitDensityPerAcre: data.unitDensityPerAcre,
          floorAreaRatio: data.floorAreaRatio,
          description: data.description,
          amenities: data.amenities,
          brochureUrl: data.brochureUrl,
          contactPhone: data.contactPhone,
          whatsappEnabled: data.whatsappEnabled,
          videoUrl: data.videoUrl,
        })
        .returning();
      created.push({ name: data.name, slug: project.slug ?? slug, projectId: project.id });
    } catch (e) {
      failed.push({
        rowNumber: row.rowNumber,
        name: result.name,
        errors: [`Failed to save: ${e instanceof Error ? e.message : "unknown error"}`],
      });
    }
  }

  if (created.length > 0) {
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
  }

  return { created, failed };
}

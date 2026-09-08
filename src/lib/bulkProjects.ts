// Parsing + validation for the admin "bulk upload projects" feature. Reads
// the HyderabadNow_Bulk_Project_Upload_Template.xlsx shape (see
// templates/build_bulk_upload_template.py in the repo, which is the source
// of truth for the header text below — keep the two in sync) and turns each
// row into either a ready-to-insert `projects` row or a list of reasons it
// isn't ready yet. Used by src/app/admin/bulkProjectActions.ts for both the
// preview step and the commit step (the commit step re-validates from
// scratch rather than trusting whatever the client last showed).
import ExcelJS from "exceljs";
import { AMENITIES } from "@/lib/amenities";
import { getVideoEmbedUrl } from "@/lib/video";
import { PROPERTY_TYPES, CONSTRUCTION_STATUSES, projectSchema } from "@/lib/projectValidation";

// Column order must match the template exactly — parsing is by position,
// not by header text (so a slightly reworded header still works), but the
// header row is still sanity-checked against this list to catch someone
// uploading an unrelated spreadsheet.
export const BULK_PROJECT_COLUMNS = [
  "name",
  "locality",
  "city",
  "propertyType",
  "constructionStatus",
  "developerName",
  "developerUrl",
  "areaAcres",
  "totalUnits",
  "towers",
  "maxFloors",
  "unitsPerFloor",
  "minAreaSqft",
  "maxAreaSqft",
  "bhkOptions",
  "reraApprovalYear",
  "possessionYear",
  "unitDensityPerAcre",
  "floorAreaRatio",
  "description",
  "amenities",
  "brochureUrl",
  "videoUrl",
  "contactPhone",
  "whatsappEnabled",
] as const;

export const BULK_PROJECT_HEADERS = [
  "Project Name *",
  "Locality *",
  "City *",
  "Property Type *",
  "Construction Status *",
  "Developer Name",
  "Developer Website URL",
  "Area (Acres)",
  "Total Units",
  "Towers",
  "Max Floors",
  "Units Per Floor",
  "Min Area (sqft)",
  "Max Area (sqft)",
  "BHK Options",
  "RERA Approval Year",
  "Possession Year",
  "Unit Density Per Acre",
  "Floor Area Ratio (FAR)",
  "Description",
  "Amenities",
  "Brochure URL",
  "YouTube Video Link",
  "Contact Phone",
  "Enable WhatsApp Button",
];

const FIELD_LABELS: Record<string, string> = {
  name: "Project Name",
  locality: "Locality",
  city: "City",
  developerName: "Developer Name",
  developerUrl: "Developer Website URL",
  areaAcres: "Area (Acres)",
  totalUnits: "Total Units",
  towers: "Towers",
  maxFloors: "Max Floors",
  unitsPerFloor: "Units Per Floor",
  minAreaSqft: "Min Area (sqft)",
  maxAreaSqft: "Max Area (sqft)",
  bhkOptions: "BHK Options",
  reraApprovalYear: "RERA Approval Year",
  possessionYear: "Possession Year",
  unitDensityPerAcre: "Unit Density Per Acre",
  floorAreaRatio: "Floor Area Ratio (FAR)",
  description: "Description",
  brochureUrl: "Brochure URL",
  contactPhone: "Contact Phone",
  videoUrl: "YouTube Video Link",
};

// The example row shipped in the template (row 2) — any row whose Project
// Name, Locality and Contact Phone all match this exactly is treated as the
// untouched sample and skipped, rather than imported as a duplicate of a
// real project. A row where the admin has actually edited any of these
// three no longer matches, and imports normally.
const EXAMPLE_ROW_FINGERPRINT = {
  name: "Aparna Cyber Heights",
  locality: "Tellapur",
  contactPhone: "+91 90000 00000",
};

export type BulkProjectFields = Record<(typeof BULK_PROJECT_COLUMNS)[number], string>;

export type NewProjectValues = {
  name: string;
  developerName: string | null;
  developerUrl: string | null;
  locality: string;
  city: string;
  propertyType: (typeof PROPERTY_TYPES)[number];
  constructionStatus: (typeof CONSTRUCTION_STATUSES)[number];
  areaAcres: number | null;
  totalUnits: number | null;
  towers: number | null;
  maxFloors: number | null;
  unitsPerFloor: string | null;
  minAreaSqft: number | null;
  maxAreaSqft: number | null;
  bhkOptions: string | null;
  reraApprovalYear: number | null;
  possessionYear: number | null;
  unitDensityPerAcre: number | null;
  floorAreaRatio: number | null;
  description: string | null;
  amenities: string;
  brochureUrl: string | null;
  contactPhone: string | null;
  whatsappEnabled: boolean;
  videoUrl: string | null;
};

export type BulkRowResult = {
  rowNumber: number;
  name: string;
  fields: BulkProjectFields;
  errors: string[];
  warnings: string[];
  data?: NewProjectValues;
};

export type ParsedWorkbook =
  | { ok: true; rows: BulkRowResult[]; skippedExampleRow: boolean }
  | { ok: false; error: string };

function cellToText(cell: ExcelJS.Cell | undefined): string {
  const v = cell?.value;
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v && Array.isArray((v as { richText: { text: string }[] }).richText)) {
      return (v as { richText: { text: string }[] }).richText
        .map((rt) => rt.text)
        .join("")
        .trim();
    }
    if ("text" in v) return String((v as { text: unknown }).text ?? "").trim();
    if ("result" in v) return String((v as { result: unknown }).result ?? "").trim();
  }
  return String(v).trim();
}

export function validateBulkProjectRow(fields: BulkProjectFields, rowNumber: number): BulkRowResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const propertyTypeRaw = fields.propertyType.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const constructionStatusRaw = fields.constructionStatus.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const propertyTypeValid = (PROPERTY_TYPES as readonly string[]).includes(propertyTypeRaw);
  const constructionStatusValid = (CONSTRUCTION_STATUSES as readonly string[]).includes(constructionStatusRaw);

  if (!propertyTypeValid) {
    errors.push(
      `Property Type: must be one of ${PROPERTY_TYPES.join(", ")} (got "${fields.propertyType || "blank"}")`
    );
  }
  if (!constructionStatusValid) {
    errors.push(
      `Construction Status: must be one of ${CONSTRUCTION_STATUSES.join(", ")} (got "${fields.constructionStatus || "blank"}")`
    );
  }

  const schemaInput = {
    name: fields.name || undefined,
    developerName: fields.developerName || undefined,
    developerUrl: fields.developerUrl || undefined,
    locality: fields.locality || undefined,
    city: fields.city || "Hyderabad",
    propertyType: propertyTypeValid ? propertyTypeRaw : PROPERTY_TYPES[0],
    constructionStatus: constructionStatusValid ? constructionStatusRaw : CONSTRUCTION_STATUSES[0],
    areaAcres: fields.areaAcres || undefined,
    totalUnits: fields.totalUnits || undefined,
    towers: fields.towers || undefined,
    maxFloors: fields.maxFloors || undefined,
    unitsPerFloor: fields.unitsPerFloor || undefined,
    minAreaSqft: fields.minAreaSqft || undefined,
    maxAreaSqft: fields.maxAreaSqft || undefined,
    bhkOptions: fields.bhkOptions || undefined,
    reraApprovalYear: fields.reraApprovalYear || undefined,
    possessionYear: fields.possessionYear || undefined,
    unitDensityPerAcre: fields.unitDensityPerAcre || undefined,
    floorAreaRatio: fields.floorAreaRatio || undefined,
    description: fields.description || undefined,
    brochureUrl: fields.brochureUrl || undefined,
    contactPhone: fields.contactPhone || undefined,
    // Checked up front rather than left to projectSchema's own refine: on
    // the single-project admin form a bad video link is a hard error (the
    // admin typed it and can fix it immediately), but bulk rows should be
    // forgiving about a nice-to-have field — drop it with a warning instead
    // of failing the whole row over one bad URL.
    videoUrl: fields.videoUrl && getVideoEmbedUrl(fields.videoUrl) !== null ? fields.videoUrl : undefined,
  };
  if (fields.videoUrl && getVideoEmbedUrl(fields.videoUrl) === null) {
    warnings.push("YouTube Video Link isn't a recognized YouTube/Vimeo URL — left blank.");
  }

  const parsed = projectSchema.safeParse(schemaInput);
  const name = fields.name?.trim() || "(blank)";

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (key === "propertyType" || key === "constructionStatus") continue; // reported above with clearer wording
      const label = FIELD_LABELS[key] ?? key;
      errors.push(`${label}: ${issue.message}`);
    }
  }

  if (errors.length > 0) {
    return { rowNumber, name, fields, errors, warnings };
  }

  const data = parsed.success ? parsed.data : null;
  if (!data) {
    // Shouldn't happen (errors would already be non-empty), but keeps TS happy.
    return { rowNumber, name, fields, errors: ["Unexpected validation failure."], warnings };
  }

  const knownAmenityKeys = new Set(AMENITIES.map((a) => a.key));
  const amenityInput = (fields.amenities || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .filter(Boolean);
  const validAmenities = amenityInput.filter((k) => knownAmenityKeys.has(k));
  const unknownAmenities = amenityInput.filter((k) => !knownAmenityKeys.has(k));
  if (unknownAmenities.length > 0) {
    warnings.push(`Unrecognized amenity key(s) ignored: ${unknownAmenities.join(", ")} (see the "Amenity Keys" sheet).`);
  }

  const wantsWhatsapp = fields.whatsappEnabled.trim().toLowerCase() === "yes";
  let whatsappEnabled = wantsWhatsapp;
  if (wantsWhatsapp && !data.contactPhone?.trim()) {
    warnings.push("Enable WhatsApp Button was Yes but Contact Phone is blank — left disabled.");
    whatsappEnabled = false;
  }

  const videoUrl = data.videoUrl || null;

  return {
    rowNumber,
    name: data.name,
    fields,
    errors,
    warnings,
    data: {
      name: data.name,
      developerName: data.developerName || null,
      developerUrl: data.developerUrl || null,
      locality: data.locality,
      city: data.city,
      propertyType: data.propertyType,
      constructionStatus: data.constructionStatus,
      areaAcres: data.areaAcres ?? null,
      totalUnits: data.totalUnits ?? null,
      towers: data.towers ?? null,
      maxFloors: data.maxFloors ?? null,
      unitsPerFloor: data.unitsPerFloor || null,
      minAreaSqft: data.minAreaSqft ?? null,
      maxAreaSqft: data.maxAreaSqft ?? null,
      bhkOptions: data.bhkOptions || null,
      reraApprovalYear: data.reraApprovalYear ?? null,
      possessionYear: data.possessionYear ?? null,
      unitDensityPerAcre: data.unitDensityPerAcre ?? null,
      floorAreaRatio: data.floorAreaRatio ?? null,
      description: data.description || null,
      amenities: JSON.stringify(validAmenities),
      brochureUrl: data.brochureUrl || null,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      videoUrl,
    },
  };
}

export async function parseBulkProjectsWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { ok: false, error: "Couldn't read that file — make sure it's the .xlsx template, not .csv or .xls." };
  }

  const sheet =
    workbook.worksheets.find((ws) => ws.name.trim().toLowerCase() === "projects") ?? workbook.worksheets[0];
  if (!sheet) {
    return { ok: false, error: "No sheets found in that file." };
  }

  const headerRow = sheet.getRow(1);
  let headerMismatches = 0;
  for (let i = 0; i < BULK_PROJECT_HEADERS.length; i++) {
    const actual = cellToText(headerRow.getCell(i + 1));
    if (actual !== BULK_PROJECT_HEADERS[i]) headerMismatches++;
  }
  if (headerMismatches > BULK_PROJECT_HEADERS.length / 2) {
    return {
      ok: false,
      error:
        'This doesn\'t look like the HyderabadNow bulk upload template — the column headers don\'t match. Please use the "Projects" sheet from the provided template without renaming or reordering columns.',
    };
  }

  const rows: BulkRowResult[] = [];
  let skippedExampleRow = false;
  const lastRow = Math.min(sheet.rowCount, 2000);

  for (let r = 2; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    const fields = {} as BulkProjectFields;
    let anyValue = false;
    BULK_PROJECT_COLUMNS.forEach((key, i) => {
      const text = cellToText(row.getCell(i + 1));
      fields[key] = text;
      if (text) anyValue = true;
    });

    if (!anyValue) continue; // fully blank row — nothing to report

    if (
      fields.name === EXAMPLE_ROW_FINGERPRINT.name &&
      fields.locality === EXAMPLE_ROW_FINGERPRINT.locality &&
      fields.contactPhone === EXAMPLE_ROW_FINGERPRINT.contactPhone
    ) {
      skippedExampleRow = true;
      continue;
    }

    rows.push(validateBulkProjectRow(fields, r));
  }

  return { ok: true, rows, skippedExampleRow };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users, listings, listingImages, homeTiles, projects, projectImages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";
import { AMENITIES } from "@/lib/amenities";

export type ActionState = { error?: string; success?: string } | null;

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
  return session;
}

const USER_ROLES = ["buyer", "agent", "seller", "admin"] as const;
const LISTING_STATUSES = ["active", "pending", "sold", "rented"] as const;

export async function adminUpdateUserRoleAction(formData: FormData) {
  await requireAdmin();
  const userId = Number(formData.get("userId"));
  const role = formData.get("role");
  if (!userId || !USER_ROLES.includes(role as (typeof USER_ROLES)[number])) return;

  await db
    .update(users)
    .set({ role: role as (typeof USER_ROLES)[number] })
    .where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function adminDeleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = Number(formData.get("userId"));
  if (!userId) return;

  if (userId === session.id) {
    redirect("/admin/users?error=self_delete");
  }

  const [{ listingCount }] = await db
    .select({ listingCount: sql<number>`count(*)` })
    .from(listings)
    .where(eq(listings.ownerId, userId));
  if (listingCount > 0) {
    // listings.ownerId has no ON DELETE CASCADE — deleting them here would be a
    // silent, surprising side effect. Make the admin delete/reassign them first.
    redirect("/admin/users?error=has_listings");
  }

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function adminUpdateListingStatusAction(formData: FormData) {
  await requireAdmin();
  const listingId = Number(formData.get("listingId"));
  const status = formData.get("status");
  if (!listingId || !LISTING_STATUSES.includes(status as (typeof LISTING_STATUSES)[number])) return;

  await db
    .update(listings)
    .set({ status: status as (typeof LISTING_STATUSES)[number] })
    .where(eq(listings.id, listingId));
  revalidatePath("/admin/listings");
}

export async function adminToggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const listingId = Number(formData.get("listingId"));
  if (!listingId) return;

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing) return;

  await db.update(listings).set({ featured: !listing.featured }).where(eq(listings.id, listingId));
  revalidatePath("/admin/listings");
}

export async function adminDeleteListingAction(formData: FormData) {
  await requireAdmin();
  const listingId = Number(formData.get("listingId"));
  if (!listingId) return;

  // listingImages and inquiries both reference listings with ON DELETE CASCADE,
  // so this cleanly removes the listing's photos and inquiries too.
  await db.delete(listings).where(eq(listings.id, listingId));
  revalidatePath("/admin/listings");
}

// ---- Admin: full listing edit ----

const editListingSchema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters"),
  description: z.string().min(20, "Add a bit more description (20+ characters)"),
  price: z.coerce.number().int().positive("Enter a valid price"),
  listingType: z.enum(["sale", "rent"]),
  propertyType: z.enum(["apartment", "villa", "independent_house", "plot", "commercial"]),
  bhk: z.coerce.number().int().min(0).max(10).optional(),
  areaSqft: z.coerce.number().int().positive("Enter a valid area"),
  locality: z.string().min(2, "Enter a locality"),
  city: z.string().min(2, "Enter a city"),
  address: z.string().optional(),
  status: z.enum(LISTING_STATUSES),
});

export async function adminUpdateListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const listingId = Number(formData.get("listingId"));
  if (!listingId) return { error: "Missing listing." };

  const parsed = editListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType"),
    bhk: formData.get("bhk") || undefined,
    areaSqft: formData.get("areaSqft"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;
  const featured = formData.get("featured") === "on";
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;

  await db
    .update(listings)
    .set({
      title: data.title,
      description: data.description,
      price: data.price,
      listingType: data.listingType,
      propertyType: data.propertyType,
      bhk: data.propertyType === "plot" || data.propertyType === "commercial" ? null : data.bhk ?? null,
      areaSqft: data.areaSqft,
      locality: data.locality,
      city: data.city,
      address: data.address || null,
      status: data.status,
      featured,
      projectId,
    })
    .where(eq(listings.id, listingId));

  // Remove any photos the admin unchecked, scoped to this listing so a
  // tampered form field can never touch another listing's images.
  const removeIds = formData
    .getAll("removeImageId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  if (removeIds.length > 0) {
    await db
      .delete(listingImages)
      .where(and(eq(listingImages.listingId, listingId), inArray(listingImages.id, removeIds)));
  }

  // Add any newly uploaded photos after the existing ones.
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${listingImages.sortOrder}), -1)` })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  let order = maxOrder + 1;
  const newRows: { listingId: number; url: string; sortOrder: number }[] = [];
  for (const file of files.slice(0, 10)) {
    const url = await saveUploadedImage(file);
    if (url) newRows.push({ listingId, url, sortOrder: order++ });
  }
  if (newRows.length > 0) {
    await db.insert(listingImages).values(newRows);
  }

  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}/edit`);
  revalidatePath(`/listing/${listingId}`);
  redirect(`/admin/listings/${listingId}/edit?saved=1`);
}

// ---- Admin: homepage tiles ----

const homeTileSchema = z.object({
  label: z.string().min(1, "Enter a label"),
  href: z.string().min(1, "Enter a destination link"),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

async function resolveTileImage(formData: FormData, existingUrl: string | null): Promise<string | null> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedImage(file);
    if (saved) return saved;
  }
  const pastedUrl = formData.get("imageUrl");
  if (typeof pastedUrl === "string" && pastedUrl.trim()) return pastedUrl.trim();
  if (formData.get("removeImage") === "on") return null;
  return existingUrl;
}

export async function adminCreateHomeTileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = homeTileSchema.safeParse({
    label: formData.get("label"),
    href: formData.get("href"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const imageUrl = await resolveTileImage(formData, null);

  await db.insert(homeTiles).values({
    label: parsed.data.label,
    href: parsed.data.href,
    imageUrl,
    sortOrder: parsed.data.sortOrder,
  });
  revalidatePath("/admin/home-tiles");
  revalidatePath("/");
  return { success: "Tile added." };
}

export async function adminUpdateHomeTileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const tileId = Number(formData.get("tileId"));
  if (!tileId) return { error: "Missing tile." };

  const parsed = homeTileSchema.safeParse({
    label: formData.get("label"),
    href: formData.get("href"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await db.query.homeTiles.findFirst({ where: eq(homeTiles.id, tileId) });
  if (!existing) return { error: "Tile not found." };

  const imageUrl = await resolveTileImage(formData, existing.imageUrl);

  await db
    .update(homeTiles)
    .set({ label: parsed.data.label, href: parsed.data.href, sortOrder: parsed.data.sortOrder, imageUrl })
    .where(eq(homeTiles.id, tileId));
  revalidatePath("/admin/home-tiles");
  revalidatePath("/");
  return { success: "Tile updated." };
}

export async function adminDeleteHomeTileAction(formData: FormData) {
  await requireAdmin();
  const tileId = Number(formData.get("tileId"));
  if (!tileId) return;
  await db.delete(homeTiles).where(eq(homeTiles.id, tileId));
  revalidatePath("/admin/home-tiles");
  revalidatePath("/");
}

// ---- Admin: projects ----

const PROPERTY_TYPES = ["apartment", "villa", "independent_house", "plot", "commercial"] as const;
const CONSTRUCTION_STATUSES = ["under_construction", "ready_to_move"] as const;

const projectSchema = z.object({
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
});

function readProjectFields(formData: FormData) {
  return {
    name: formData.get("name"),
    developerName: formData.get("developerName") || undefined,
    developerUrl: formData.get("developerUrl") || undefined,
    locality: formData.get("locality"),
    city: formData.get("city"),
    propertyType: formData.get("propertyType"),
    constructionStatus: formData.get("constructionStatus"),
    areaAcres: formData.get("areaAcres") || undefined,
    totalUnits: formData.get("totalUnits") || undefined,
    towers: formData.get("towers") || undefined,
    maxFloors: formData.get("maxFloors") || undefined,
    unitsPerFloor: formData.get("unitsPerFloor") || undefined,
    minAreaSqft: formData.get("minAreaSqft") || undefined,
    maxAreaSqft: formData.get("maxAreaSqft") || undefined,
    bhkOptions: formData.get("bhkOptions") || undefined,
    reraApprovalYear: formData.get("reraApprovalYear") || undefined,
    possessionYear: formData.get("possessionYear") || undefined,
    unitDensityPerAcre: formData.get("unitDensityPerAcre") || undefined,
    floorAreaRatio: formData.get("floorAreaRatio") || undefined,
    description: formData.get("description") || undefined,
    brochureUrl: formData.get("brochureUrl") || undefined,
  };
}

function resolveProjectAmenities(formData: FormData): string {
  const known = new Set(AMENITIES.map((a) => a.key));
  const selected = formData.getAll("amenities").filter((v): v is string => typeof v === "string" && known.has(v));
  return JSON.stringify(selected);
}

export async function adminCreateProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(readProjectFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const [project] = await db
    .insert(projects)
    .values({
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
      amenities: resolveProjectAmenities(formData),
      brochureUrl: data.brochureUrl || null,
    })
    .returning();

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const rows: { projectId: number; url: string; sortOrder: number }[] = [];
  let order = 0;
  for (const file of files.slice(0, 15)) {
    const url = await saveUploadedImage(file);
    if (url) rows.push({ projectId: project.id, url, sortOrder: order++ });
  }
  if (rows.length > 0) {
    await db.insert(projectImages).values(rows);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  redirect(`/admin/projects/${project.id}/edit?saved=1`);
}

export async function adminUpdateProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const projectId = Number(formData.get("projectId"));
  if (!projectId) return { error: "Missing project." };

  const parsed = projectSchema.safeParse(readProjectFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  await db
    .update(projects)
    .set({
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
      amenities: resolveProjectAmenities(formData),
      brochureUrl: data.brochureUrl || null,
    })
    .where(eq(projects.id, projectId));

  const removeIds = formData
    .getAll("removeImageId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  if (removeIds.length > 0) {
    await db
      .delete(projectImages)
      .where(and(eq(projectImages.projectId, projectId), inArray(projectImages.id, removeIds)));
  }

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${projectImages.sortOrder}), -1)` })
    .from(projectImages)
    .where(eq(projectImages.projectId, projectId));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  let order = maxOrder + 1;
  const newRows: { projectId: number; url: string; sortOrder: number }[] = [];
  for (const file of files.slice(0, 15)) {
    const url = await saveUploadedImage(file);
    if (url) newRows.push({ projectId, url, sortOrder: order++ });
  }
  if (newRows.length > 0) {
    await db.insert(projectImages).values(newRows);
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}/edit`);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}/edit?saved=1`);
}

export async function adminDeleteProjectAction(formData: FormData) {
  await requireAdmin();
  const projectId = Number(formData.get("projectId"));
  if (!projectId) return;

  // projectImages cascade-deletes; listings that referenced this project get
  // projectId set to null (schema: onDelete "set null") rather than being
  // deleted themselves — they just become standalone listings again.
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}

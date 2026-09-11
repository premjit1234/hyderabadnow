"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  users,
  listings,
  listingImages,
  homeTiles,
  projects,
  projectImages,
  siteSettings,
  legalPages,
  socialLinks,
  listingFieldSettings,
  blogPosts,
  blogImages,
  blogComments,
  locations,
  amenityCatalog,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getLiveVisitorCount } from "@/db/queries";
import { saveUploadedImage, saveUploadedFavicon } from "@/lib/uploads";
import { AMENITIES, slugifyAmenityKey } from "@/lib/amenities";
import { SOCIAL_PLATFORM_KEYS } from "@/lib/social";
import { LISTING_EXTRA_FIELDS } from "@/lib/listingFields";
import { BLOG_CATEGORIES, slugify } from "@/lib/blog";
import { getVideoEmbedUrl } from "@/lib/video";
import { sanitizeBlogContent } from "@/lib/sanitizeHtml";
import { projectSchema } from "@/lib/projectValidation";
import { LISTING_STATUSES, editListingSchema } from "@/lib/listingValidation";
import { geocodeLocality } from "@/lib/geocode";

export type ActionState = { error?: string; success?: string } | null;

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
  return session;
}

const USER_ROLES = ["buyer", "agent", "seller", "admin"] as const;

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

  // Manually setting a listing back to "active" here is the admin-side
  // equivalent of the owner clicking "Yes, still available" in the
  // stale-listing nudge email (see lib/staleListings.ts) — reset its
  // staleness clock the same way, so it doesn't immediately look overdue
  // for another nudge.
  const resetStaleness =
    status === "active" ? { lastConfirmedAt: new Date().toISOString(), staleNudgeSentAt: null, autoFlaggedStaleAt: null } : {};

  await db
    .update(listings)
    .set({ status: status as (typeof LISTING_STATUSES)[number], ...resetStaleness })
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

export async function adminToggleVerifiedAction(formData: FormData) {
  await requireAdmin();
  const listingId = Number(formData.get("listingId"));
  if (!listingId) return;

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing) return;

  await db.update(listings).set({ verified: !listing.verified }).where(eq(listings.id, listingId));
  revalidatePath("/admin/listings");
  revalidatePath(`/listing/${listingId}`);
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
//
// editListingSchema now lives in lib/listingValidation.ts (imported above)
// so the owner-facing edit action in app/actions.ts (dashboard → "View/Edit"
// on a listing you posted yourself) can validate against the exact same
// shape rather than duplicating it — the fields an owner can edit are
// identical to what an admin can edit here; only the authorization check
// differs (ownership vs. requireAdmin) and the owner-only UI omits the
// admin-only featured/verified checkboxes (handled outside this schema in
// both action bodies already).

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
    bathrooms: formData.get("bathrooms") || undefined,
    carParking: formData.get("carParking") || undefined,
    areaSqft: formData.get("areaSqft"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    status: formData.get("status"),
    contactPhone: formData.get("contactPhone") || undefined,
    towerName: formData.get("towerName") || undefined,
    unitNumber: formData.get("unitNumber") || undefined,
    unitFloor: formData.get("unitFloor") || undefined,
    facing: formData.get("facing") || undefined,
    furnishingStatus: formData.get("furnishingStatus") || undefined,
    inventoryState: formData.get("inventoryState") || undefined,
    sellerAskPrice: formData.get("sellerAskPrice") || undefined,
    sellerBestPrice: formData.get("sellerBestPrice") || undefined,
    cashRatioPercent: formData.get("cashRatioPercent") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;
  const featured = formData.get("featured") === "on";
  const verified = formData.get("verified") === "on";
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;
  const amenities = await resolveListingAmenities(formData);

  await db
    .update(listings)
    .set({
      title: data.title,
      description: data.description,
      price: data.price,
      listingType: data.listingType,
      propertyType: data.propertyType,
      bhk: data.propertyType === "plot" || data.propertyType === "commercial" ? null : data.bhk ?? null,
      bathrooms: data.bathrooms ?? null,
      carParking: data.carParking ?? null,
      areaSqft: data.areaSqft,
      locality: data.locality,
      city: data.city,
      address: data.address || null,
      status: data.status,
      featured,
      verified,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      projectId,
      towerName: data.towerName?.trim() || null,
      unitNumber: data.unitNumber?.trim() || null,
      unitFloor: data.unitFloor ?? null,
      facing: data.facing ?? null,
      furnishingStatus: data.furnishingStatus ?? null,
      inventoryState: data.inventoryState ?? "new",
      sellerAskPrice: data.sellerAskPrice ?? null,
      sellerBestPrice: data.sellerBestPrice ?? null,
      cashRatioPercent: data.cashRatioPercent ?? null,
      amenities,
      videoUrl: data.videoUrl || null,
      // An admin editing a listing is itself a sign a human looked at it —
      // reset the staleness clock the same way a manual "confirm" would
      // (see lib/staleListings.ts), so it isn't immediately flagged again.
      lastConfirmedAt: new Date().toISOString(),
      staleNudgeSentAt: null,
      autoFlaggedStaleAt: null,
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

// Admin posting a listing on behalf of any user (e.g. an agent who called in
// a property rather than logging in themselves) — same shape as the public
// createListingAction in app/actions.ts, but takes an explicit ownerId
// instead of using the current session, and skips the "must be logged in as
// agent/seller" gate since requireAdmin already covers authorization.
const adminCreateListingSchema = z.object({
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
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  ownerId: z.coerce.number().int().positive("Choose an owner"),
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

export async function adminCreateListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = adminCreateListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType"),
    bhk: formData.get("bhk") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
    carParking: formData.get("carParking") || undefined,
    areaSqft: formData.get("areaSqft"),
    locality: formData.get("locality"),
    address: formData.get("address") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    ownerId: formData.get("ownerId"),
    towerName: formData.get("towerName") || undefined,
    unitNumber: formData.get("unitNumber") || undefined,
    unitFloor: formData.get("unitFloor") || undefined,
    facing: formData.get("facing") || undefined,
    furnishingStatus: formData.get("furnishingStatus") || undefined,
    inventoryState: formData.get("inventoryState") || undefined,
    sellerAskPrice: formData.get("sellerAskPrice") || undefined,
    sellerBestPrice: formData.get("sellerBestPrice") || undefined,
    cashRatioPercent: formData.get("cashRatioPercent") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const owner = await db.query.users.findFirst({ where: eq(users.id, data.ownerId) });
  if (!owner) return { error: "Selected owner not found." };

  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }
  const featured = formData.get("featured") === "on";
  const verified = formData.get("verified") === "on";
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;
  const amenities = await resolveListingAmenities(formData);

  const [listing] = await db
    .insert(listings)
    .values({
      title: data.title,
      description: data.description,
      price: data.price,
      listingType: data.listingType,
      propertyType: data.propertyType,
      bhk: data.propertyType === "plot" || data.propertyType === "commercial" ? null : data.bhk ?? null,
      bathrooms: data.bathrooms ?? null,
      carParking: data.carParking ?? null,
      areaSqft: data.areaSqft,
      locality: data.locality,
      address: data.address || null,
      ownerId: data.ownerId,
      projectId,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      featured,
      verified,
      towerName: data.towerName?.trim() || null,
      unitNumber: data.unitNumber?.trim() || null,
      unitFloor: data.unitFloor ?? null,
      facing: data.facing,
      furnishingStatus: data.furnishingStatus,
      inventoryState: data.inventoryState,
      sellerAskPrice: data.sellerAskPrice ?? null,
      sellerBestPrice: data.sellerBestPrice ?? null,
      cashRatioPercent: data.cashRatioPercent ?? null,
      amenities,
      videoUrl: data.videoUrl || null,
      lastConfirmedAt: new Date().toISOString(),
    })
    .returning();

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const imageRows: { listingId: number; url: string; sortOrder: number }[] = [];
  let order = 0;
  for (const file of files.slice(0, 10)) {
    const url = await saveUploadedImage(file);
    if (url) imageRows.push({ listingId: listing.id, url, sortOrder: order++ });
  }
  if (imageRows.length > 0) {
    await db.insert(listingImages).values(imageRows);
  }

  revalidatePath("/admin/listings");
  redirect(`/admin/listings/${listing.id}/edit?saved=1`);
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

// PROPERTY_TYPES, CONSTRUCTION_STATUSES and projectSchema live in
// src/lib/projectValidation.ts (shared with the bulk-upload importer) since
// a "use server" file like this one may only export async functions.

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
    reraNumber: formData.get("reraNumber") || undefined,
    reraApprovalYear: formData.get("reraApprovalYear") || undefined,
    possessionYear: formData.get("possessionYear") || undefined,
    unitDensityPerAcre: formData.get("unitDensityPerAcre") || undefined,
    floorAreaRatio: formData.get("floorAreaRatio") || undefined,
    description: formData.get("description") || undefined,
    brochureUrl: formData.get("brochureUrl") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  };
}

function resolveProjectAmenities(formData: FormData): string {
  const known = new Set(AMENITIES.map((a) => a.key));
  const selected = formData.getAll("amenities").filter((v): v is string => typeof v === "string" && known.has(v));
  return JSON.stringify(selected);
}

// Resolves a listing's final amenity selection from its submitted form:
// existing amenityCatalog entries checked (see schema.ts), plus any
// admin-typed new amenity names — which get inserted into that shared
// catalog table so they immediately become selectable for every other
// listing too. Regular agents/owners posting from the public form
// (PostListingForm) only ever see checkboxes for the existing catalog — the
// "add a new amenity" text box is admin-only (AdminListingCreateForm /
// AdminListingEditForm) — so the "newAmenities" field this reads is simply
// absent/empty on a public submission, and no new rows get inserted then.
// Exported so app/actions.ts's public createListingAction can share it too.
export async function resolveListingAmenities(formData: FormData): Promise<string> {
  const catalog = await db.select().from(amenityCatalog);
  const catalogKeys = new Set(catalog.map((a) => a.key));
  const selected = new Set(
    formData.getAll("amenities").filter((v): v is string => typeof v === "string" && catalogKeys.has(v))
  );

  const newAmenitiesRaw = formData.get("newAmenities");
  if (typeof newAmenitiesRaw === "string" && newAmenitiesRaw.trim()) {
    const labels = newAmenitiesRaw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const label of labels) {
      const existingByLabel = catalog.find((a) => a.label.toLowerCase() === label.toLowerCase());
      if (existingByLabel) {
        selected.add(existingByLabel.key);
        continue;
      }
      const base = slugifyAmenityKey(label);
      let key = base;
      let n = 2;
      while (catalogKeys.has(key)) key = `${base}_${n++}`;
      await db.insert(amenityCatalog).values({ key, label });
      catalogKeys.add(key);
      catalog.push({ id: -1, key, label, sortOrder: 0, createdAt: "" });
      selected.add(key);
    }
  }

  return JSON.stringify(Array.from(selected));
}

// Quick toggle from the admin projects list, same pattern as
// adminToggleFeaturedAction for listings above — lets an admin feature/
// unfeature a project without opening its full edit form.
export async function adminToggleFeaturedProjectAction(formData: FormData) {
  await requireAdmin();
  const projectId = Number(formData.get("projectId"));
  if (!projectId) return;

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return;

  await db.update(projects).set({ featured: !project.featured }).where(eq(projects.id, projectId));
  revalidatePath("/admin/projects");
  revalidatePath("/");
}

// Slugs power the public /projects/[slug] URL and, like blog post slugs
// (see uniqueBlogSlug above), are generated once from the name and must be
// unique. `excludeId` lets a project keep its own slug when backfilling one
// that's still null, rather than bumping it against itself.
export async function uniqueProjectSlug(base: string, excludeId?: number): Promise<string> {
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = await db.query.projects.findFirst({ where: eq(projects.slug, candidate) });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n++}`;
  }
}

export async function adminCreateProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(readProjectFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }
  const featured = formData.get("featured") === "on";

  const slug = await uniqueProjectSlug(slugify(data.name));
  // An admin who placed the pin manually in LocationPicker (ProjectForm.tsx)
  // wins outright — no need to spend a geocoding round-trip on locality text
  // when we already have the exact spot. Otherwise fall back to geocoding,
  // best-effort: a project with no coordinates just shows no pin on the map
  // (see /projects's map view), it's never a reason to fail the save.
  const manualPin = data.latitude != null && data.longitude != null;
  const geo = manualPin ? null : await geocodeLocality(data.locality, data.city);

  const [project] = await db
    .insert(projects)
    .values({
      slug,
      name: data.name,
      developerName: data.developerName || null,
      developerUrl: data.developerUrl || null,
      locality: data.locality,
      city: data.city,
      latitude: manualPin ? data.latitude! : (geo?.latitude ?? null),
      longitude: manualPin ? data.longitude! : (geo?.longitude ?? null),
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
      reraNumber: data.reraNumber?.trim() || null,
      reraApprovalYear: data.reraApprovalYear ?? null,
      possessionYear: data.possessionYear ?? null,
      unitDensityPerAcre: data.unitDensityPerAcre ?? null,
      floorAreaRatio: data.floorAreaRatio ?? null,
      description: data.description || null,
      amenities: resolveProjectAmenities(formData),
      brochureUrl: data.brochureUrl || null,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      featured,
      videoUrl: data.videoUrl || null,
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
  revalidatePath("/");
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
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }
  const featured = formData.get("featured") === "on";

  // Slug is stable once set — an edited name never changes an
  // already-shared/bookmarked project URL out from under people (same rule
  // as blog posts). The one exception is a project that somehow still has
  // no slug at all (a legacy row not yet reached by
  // src/db/ensure-project-slugs.ts) — this backfills one on the spot rather
  // than leaving it stuck on the old numeric URL until the next deploy.
  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { slug: true, locality: true, city: true, latitude: true, longitude: true },
  });
  const slug = existingProject?.slug || (await uniqueProjectSlug(slugify(data.name), projectId));

  // A pin the admin placed by hand in LocationPicker this submission (see
  // ProjectForm.tsx) always wins — it's the whole point of that control, and
  // it must survive even when the locality text changes in the same save.
  // Absent that, fall back to the existing behavior: only re-geocode when
  // the locality/city text actually changed (an unrelated edit, say
  // updating the price range, shouldn't cost a network round-trip or risk
  // losing a pin to a transient geocoding failure), otherwise keep whatever
  // pin the project already had.
  const manualPin = data.latitude != null && data.longitude != null;
  const localityChanged = !existingProject || existingProject.locality !== data.locality || existingProject.city !== data.city;
  const geo = !manualPin && localityChanged ? await geocodeLocality(data.locality, data.city) : null;
  const latitude = manualPin ? data.latitude! : localityChanged ? (geo?.latitude ?? null) : (existingProject?.latitude ?? null);
  const longitude = manualPin ? data.longitude! : localityChanged ? (geo?.longitude ?? null) : (existingProject?.longitude ?? null);

  await db
    .update(projects)
    .set({
      slug,
      name: data.name,
      developerName: data.developerName || null,
      developerUrl: data.developerUrl || null,
      locality: data.locality,
      city: data.city,
      latitude,
      longitude,
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
      reraNumber: data.reraNumber?.trim() || null,
      reraApprovalYear: data.reraApprovalYear ?? null,
      possessionYear: data.possessionYear ?? null,
      unitDensityPerAcre: data.unitDensityPerAcre ?? null,
      floorAreaRatio: data.floorAreaRatio ?? null,
      description: data.description || null,
      amenities: resolveProjectAmenities(formData),
      brochureUrl: data.brochureUrl || null,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      featured,
      videoUrl: data.videoUrl || null,
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
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/");
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

// ---- Admin: site branding (logo + favicon + homepage hero background) ----

export async function adminUpdateSiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const existing = await db.query.siteSettings.findFirst({ where: eq(siteSettings.id, 1) });

  let logoUrl = existing?.logoUrl ?? null;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    const saved = await saveUploadedImage(logoFile);
    if (!saved) return { error: "Logo must be a JPG, PNG, WebP, or GIF under 8MB." };
    logoUrl = saved;
  } else if (formData.get("removeLogo") === "on") {
    logoUrl = null;
  }

  let faviconUrl = existing?.faviconUrl ?? null;
  const faviconFile = formData.get("faviconFile");
  if (faviconFile instanceof File && faviconFile.size > 0) {
    const saved = await saveUploadedFavicon(faviconFile);
    if (!saved) return { error: "Favicon must be an .ico, .png, or .svg file under 2MB." };
    faviconUrl = saved;
  } else if (formData.get("removeFavicon") === "on") {
    faviconUrl = null;
  }

  let heroImageUrl = existing?.heroImageUrl ?? null;
  const heroImageFile = formData.get("heroImageFile");
  if (heroImageFile instanceof File && heroImageFile.size > 0) {
    const saved = await saveUploadedImage(heroImageFile);
    if (!saved) return { error: "Hero background must be a JPG, PNG, WebP, or GIF under 8MB." };
    heroImageUrl = saved;
  } else if (formData.get("removeHeroImage") === "on") {
    heroImageUrl = null;
  }

  let dashboardBannerImageUrl = existing?.dashboardBannerImageUrl ?? null;
  const dashboardBannerFile = formData.get("dashboardBannerFile");
  if (dashboardBannerFile instanceof File && dashboardBannerFile.size > 0) {
    const saved = await saveUploadedImage(dashboardBannerFile);
    if (!saved) return { error: "Dashboard banner must be a JPG, PNG, WebP, or GIF under 8MB." };
    dashboardBannerImageUrl = saved;
  } else if (formData.get("removeDashboardBanner") === "on") {
    dashboardBannerImageUrl = null;
  }

  // Link is meaningless without an image to click, and an image with no
  // link just wouldn't render as a link — keep them consistent rather than
  // storing a dangling link with no banner or vice versa.
  const dashboardBannerLinkUrlRaw = formData.get("dashboardBannerLinkUrl");
  const dashboardBannerLinkUrl =
    dashboardBannerImageUrl && typeof dashboardBannerLinkUrlRaw === "string" && dashboardBannerLinkUrlRaw.trim()
      ? dashboardBannerLinkUrlRaw.trim()
      : null;

  const featuredCreditPriceRaw = Number(formData.get("featuredCreditPriceRupees"));
  if (!Number.isInteger(featuredCreditPriceRaw) || featuredCreditPriceRaw <= 0) {
    return { error: "Featured listing credit price must be a whole number of rupees greater than 0." };
  }

  if (existing) {
    await db
      .update(siteSettings)
      .set({
        logoUrl,
        faviconUrl,
        heroImageUrl,
        dashboardBannerImageUrl,
        dashboardBannerLinkUrl,
        featuredCreditPriceRupees: featuredCreditPriceRaw,
        updatedAt: sql`(current_timestamp)`,
      })
      .where(eq(siteSettings.id, 1));
  } else {
    await db.insert(siteSettings).values({
      id: 1,
      logoUrl,
      faviconUrl,
      heroImageUrl,
      dashboardBannerImageUrl,
      dashboardBannerLinkUrl,
      featuredCreditPriceRupees: featuredCreditPriceRaw,
    });
  }

  // The root layout's generateMetadata reads site settings on every request,
  // and Header reads them too — revalidating "/" with the "layout" type
  // busts the whole route tree's cache so the new logo/favicon show up
  // immediately instead of waiting for the next unrelated deploy.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { success: "Site settings updated." };
}

// ---- Admin: legal pages (Terms of Use / Privacy Policy / Cookie Policy) ----

const legalPageSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title is too long."),
  content: z.string().trim().min(1, "Content can't be empty."),
});

export async function adminUpdateLegalPageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const pageId = Number(formData.get("pageId"));
  if (!pageId) return { error: "Missing page." };

  const parsed = legalPageSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await db.query.legalPages.findFirst({ where: eq(legalPages.id, pageId) });
  if (!existing) return { error: "Page not found." };

  await db
    .update(legalPages)
    .set({ title: parsed.data.title, content: parsed.data.content, updatedAt: sql`(current_timestamp)` })
    .where(eq(legalPages.id, pageId));

  revalidatePath("/admin/legal-pages");
  revalidatePath(`/${existing.slug}`);
  // Titles show up in the footer's link row on every page.
  revalidatePath("/", "layout");
  return { success: "Page updated." };
}

// ---- Admin: social links (header + footer icon rows) ----

const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORM_KEYS),
  label: z.string().trim().min(1, "Label is required.").max(60, "Label is too long."),
  url: z.string().trim().url("Enter a valid URL, e.g. https://..."),
  sortOrder: z.coerce.number().int().default(0),
});

export async function adminCreateSocialLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = socialLinkSchema.safeParse({
    platform: formData.get("platform"),
    label: formData.get("label"),
    url: formData.get("url"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  await db.insert(socialLinks).values(parsed.data);
  revalidatePath("/admin/social-links");
  revalidatePath("/", "layout");
  return { success: "Social link added." };
}

export async function adminUpdateSocialLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const linkId = Number(formData.get("linkId"));
  if (!linkId) return { error: "Missing link." };

  const parsed = socialLinkSchema.safeParse({
    platform: formData.get("platform"),
    label: formData.get("label"),
    url: formData.get("url"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  await db.update(socialLinks).set(parsed.data).where(eq(socialLinks.id, linkId));
  revalidatePath("/admin/social-links");
  revalidatePath("/", "layout");
  return { success: "Social link updated." };
}

// Polled every few seconds by the client-side <LiveVisitorsWidget> on
// /admin/analytics — kept as its own tiny admin-gated action (rather than
// folding into a page load) so the "people on the site right now" number
// can auto-refresh without re-rendering the whole page.
export async function getLiveVisitorCountAction() {
  await requireAdmin();
  return getLiveVisitorCount();
}

export async function adminDeleteSocialLinkAction(formData: FormData) {
  await requireAdmin();
  const linkId = Number(formData.get("linkId"));
  if (!linkId) return;
  await db.delete(socialLinks).where(eq(socialLinks.id, linkId));
  revalidatePath("/admin/social-links");
  revalidatePath("/", "layout");
}

// ---- Admin: locations (locality suggestions — see schema.ts's locations table) ----
//
// Deliberately not a foreign key from listings.locality/projects.locality —
// see that table's comment. Adding, renaming, or deleting a row here only
// changes what's suggested going forward; it never touches an existing
// listing or project.

const locationSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60, "Name is too long."),
  sortOrder: z.coerce.number().int().default(0),
});

export async function adminCreateLocationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  try {
    await db.insert(locations).values(parsed.data);
  } catch {
    return { error: `"${parsed.data.name}" is already in the list.` };
  }
  revalidatePath("/admin/locations");
  revalidatePath("/", "layout");
  revalidatePath("/post-listing");
  return { success: "Location added." };
}

export async function adminUpdateLocationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const locationId = Number(formData.get("locationId"));
  if (!locationId) return { error: "Missing location." };

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  try {
    await db.update(locations).set(parsed.data).where(eq(locations.id, locationId));
  } catch {
    return { error: `"${parsed.data.name}" is already in the list.` };
  }
  revalidatePath("/admin/locations");
  revalidatePath("/", "layout");
  revalidatePath("/post-listing");
  return { success: "Location updated." };
}

export async function adminDeleteLocationAction(formData: FormData) {
  await requireAdmin();
  const locationId = Number(formData.get("locationId"));
  if (!locationId) return;
  await db.delete(locations).where(eq(locations.id, locationId));
  revalidatePath("/admin/locations");
  revalidatePath("/", "layout");
  revalidatePath("/post-listing");
}

// ---- Admin: listing field visibility ----

export async function adminUpdateListingFieldSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const config: Record<string, { public: boolean; form: boolean }> = {};
  for (const field of LISTING_EXTRA_FIELDS) {
    config[field.key] = {
      public: formData.get(`public_${field.key}`) === "on",
      form: formData.get(`form_${field.key}`) === "on",
    };
  }

  const existing = await db.query.listingFieldSettings.findFirst({ where: eq(listingFieldSettings.id, 1) });
  const configJson = JSON.stringify(config);
  if (existing) {
    await db
      .update(listingFieldSettings)
      .set({ config: configJson, updatedAt: sql`(current_timestamp)` })
      .where(eq(listingFieldSettings.id, 1));
  } else {
    await db.insert(listingFieldSettings).values({ id: 1, config: configJson });
  }

  // Both the public listing page and the post-listing form read this on
  // every request — bust everything so the new visibility takes effect
  // immediately.
  revalidatePath("/", "layout");
  revalidatePath("/admin/listing-fields");
  return { success: "Field visibility updated." };
}

// ---- Admin: blog ----

const blogPostSchema = z.object({
  title: z.string().min(3, "Title is required"),
  category: z.enum(BLOG_CATEGORIES),
  excerpt: z.string().max(300, "Keep the excerpt under 300 characters").optional(),
  videoUrl: z
    .string()
    .optional()
    .refine((v) => !v || getVideoEmbedUrl(v) !== null, "Enter a valid YouTube or Vimeo link"),
  contentHtml: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

function readBlogPostFields(formData: FormData) {
  return {
    title: formData.get("title"),
    category: formData.get("category") || "General",
    excerpt: formData.get("excerpt") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    contentHtml: formData.get("contentHtml") || undefined,
    status: formData.get("status") || "draft",
  };
}

// Slugs are generated from the title and must be unique. `excludeId` lets an
// edit keep its own existing slug when the title is unchanged, rather than
// bumping it to "-2" against itself.
async function uniqueBlogSlug(base: string, excludeId?: number): Promise<string> {
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = await db.query.blogPosts.findFirst({ where: eq(blogPosts.slug, candidate) });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n++}`;
  }
}

async function saveBlogGalleryImages(postId: number, formData: FormData, startOrder: number) {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  let order = startOrder;
  const rows: { postId: number; url: string; sortOrder: number }[] = [];
  for (const file of files.slice(0, 15)) {
    const url = await saveUploadedImage(file);
    if (url) rows.push({ postId, url, sortOrder: order++ });
  }
  if (rows.length > 0) {
    await db.insert(blogImages).values(rows);
  }
}

export async function adminCreateBlogPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = blogPostSchema.safeParse(readBlogPostFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const slug = await uniqueBlogSlug(slugify(data.title));
  const coverFile = formData.get("coverImage");
  const coverImageUrl = coverFile instanceof File && coverFile.size > 0 ? await saveUploadedImage(coverFile) : null;

  const [post] = await db
    .insert(blogPosts)
    .values({
      slug,
      title: data.title,
      excerpt: data.excerpt?.trim() || null,
      category: data.category,
      coverImageUrl,
      videoUrl: data.videoUrl || null,
      contentHtml: sanitizeBlogContent(data.contentHtml || ""),
      status: data.status,
      authorId: session.id,
      publishedAt: data.status === "published" ? sql`(current_timestamp)` : null,
    })
    .returning();

  await saveBlogGalleryImages(post.id, formData, 0);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect(`/admin/blog/${post.id}/edit?saved=1`);
}

export async function adminUpdateBlogPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const postId = Number(formData.get("postId"));
  if (!postId) return { error: "Missing post." };

  const existing = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, postId) });
  if (!existing) return { error: "Post not found." };

  const parsed = blogPostSchema.safeParse(readBlogPostFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const slug =
    slugify(data.title) === slugify(existing.title) && existing.slug
      ? existing.slug
      : await uniqueBlogSlug(slugify(data.title), postId);

  const coverFile = formData.get("coverImage");
  const newCoverUrl = coverFile instanceof File && coverFile.size > 0 ? await saveUploadedImage(coverFile) : null;
  const removeCover = formData.get("removeCoverImage") === "on";

  await db
    .update(blogPosts)
    .set({
      slug,
      title: data.title,
      excerpt: data.excerpt?.trim() || null,
      category: data.category,
      coverImageUrl: newCoverUrl ?? (removeCover ? null : existing.coverImageUrl),
      videoUrl: data.videoUrl || null,
      contentHtml: sanitizeBlogContent(data.contentHtml || ""),
      status: data.status,
      // Only stamp publishedAt the first time a post goes live, so
      // re-saving an already-published post doesn't keep bumping its date.
      publishedAt:
        data.status === "published" && !existing.publishedAt ? sql`(current_timestamp)` : existing.publishedAt,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(blogPosts.id, postId));

  const removeIds = formData
    .getAll("removeImageId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  if (removeIds.length > 0) {
    await db.delete(blogImages).where(and(eq(blogImages.postId, postId), inArray(blogImages.id, removeIds)));
  }

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${blogImages.sortOrder}), -1)` })
    .from(blogImages)
    .where(eq(blogImages.postId, postId));
  await saveBlogGalleryImages(postId, formData, maxOrder + 1);

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${postId}/edit`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  if (slug !== existing.slug) revalidatePath(`/blog/${slug}`);
  redirect(`/admin/blog/${postId}/edit?saved=1`);
}

export async function adminDeleteBlogPostAction(formData: FormData) {
  await requireAdmin();
  const postId = Number(formData.get("postId"));
  if (!postId) return;
  const existing = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, postId) });
  await db.delete(blogPosts).where(eq(blogPosts.id, postId));
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (existing) revalidatePath(`/blog/${existing.slug}`);
}

// ---- Admin: blog comment moderation ----

export async function adminModerateBlogCommentAction(formData: FormData) {
  await requireAdmin();
  const commentId = Number(formData.get("commentId"));
  const status = formData.get("status");
  if (!commentId || (status !== "approved" && status !== "rejected")) return;

  const comment = await db.query.blogComments.findFirst({ where: eq(blogComments.id, commentId) });
  await db.update(blogComments).set({ status }).where(eq(blogComments.id, commentId));

  revalidatePath("/admin/blog/comments");
  revalidatePath("/admin/blog");
  if (comment) {
    const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, comment.postId) });
    if (post) revalidatePath(`/blog/${post.slug}`);
  }
}

export async function adminDeleteBlogCommentAction(formData: FormData) {
  await requireAdmin();
  const commentId = Number(formData.get("commentId"));
  if (!commentId) return;

  const comment = await db.query.blogComments.findFirst({ where: eq(blogComments.id, commentId) });
  await db.delete(blogComments).where(eq(blogComments.id, commentId));

  revalidatePath("/admin/blog/comments");
  revalidatePath("/admin/blog");
  if (comment) {
    const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, comment.postId) });
    if (post) revalidatePath(`/blog/${post.slug}`);
  }
}

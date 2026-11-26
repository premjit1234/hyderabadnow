"use server";

// Admin CRUD for microsite pages (see schema.ts's micrositePages) — kept in
// its own file rather than folded into the already-large admin/actions.ts,
// since this is a fully independent content type (see that table's own
// schema.ts comment) with no shared code path through the existing
// project/listing actions.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  micrositePages,
  micrositePageImages,
  micrositePageVideos,
  micrositePageFloorPlans,
  micrositePageFloorPlanImages,
  micrositePageSpecifications,
  micrositePageNearbyPlaces,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";
import { AMENITIES } from "@/lib/amenities";
import { micrositePageSchema } from "@/lib/micrositeValidation";
import { getVideoEmbedUrl } from "@/lib/video";
import { isEmbeddableTourUrl } from "@/lib/virtualTour";
import { geocodeLocality } from "@/lib/geocode";
import { SPECIFICATION_CATEGORIES, specCategoryKey } from "@/lib/specificationCategories";

export type ActionState = { error?: string; success?: string } | null;

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
  return session;
}

function readMicrositeFields(formData: FormData) {
  return {
    slug: formData.get("slug"),
    name: formData.get("name"),
    tagline: formData.get("tagline") || undefined,
    developerName: formData.get("developerName") || undefined,
    developerUrl: formData.get("developerUrl") || undefined,
    locality: formData.get("locality"),
    city: formData.get("city") || "Hyderabad",
    propertyType: formData.get("propertyType"),
    constructionStatus: formData.get("constructionStatus"),
    areaAcres: formData.get("areaAcres") || undefined,
    totalUnits: formData.get("totalUnits") || undefined,
    minAreaSqft: formData.get("minAreaSqft") || undefined,
    maxAreaSqft: formData.get("maxAreaSqft") || undefined,
    bhkOptions: formData.get("bhkOptions") || undefined,
    reraNumber: formData.get("reraNumber") || undefined,
    possessionYear: formData.get("possessionYear") || undefined,
    description: formData.get("description") || undefined,
    brochureUrl: formData.get("brochureUrl") || undefined,
    specificationsIntro: formData.get("specificationsIntro") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
  };
}

function resolveMicrositeAmenities(formData: FormData): string {
  const known = new Set(AMENITIES.map((a) => a.key));
  const selected = formData.getAll("amenities").filter((v): v is string => typeof v === "string" && known.has(v));
  return JSON.stringify(selected);
}

async function insertNewMicrositeVideos(pageId: number, formData: FormData) {
  const urls = formData
    .getAll("newVideoUrls")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0 && getVideoEmbedUrl(v) !== null);
  if (urls.length === 0) return;

  const existing = await db
    .select({ sortOrder: micrositePageVideos.sortOrder })
    .from(micrositePageVideos)
    .where(eq(micrositePageVideos.pageId, pageId));
  let order = existing.length > 0 ? Math.max(...existing.map((v) => v.sortOrder)) + 1 : 0;
  await db.insert(micrositePageVideos).values(urls.map((url) => ({ pageId, url, sortOrder: order++ })));
}

async function syncSpecifications(pageId: number, formData: FormData) {
  const existingRows = await db.select().from(micrositePageSpecifications).where(eq(micrositePageSpecifications.pageId, pageId));
  const existingByCategory = new Map(existingRows.map((r) => [r.category, r]));

  for (let i = 0; i < SPECIFICATION_CATEGORIES.length; i++) {
    const category = SPECIFICATION_CATEGORIES[i];
    const raw = formData.get(`spec_${specCategoryKey(category)}`);
    const details = typeof raw === "string" ? raw.trim() : "";
    const existing = existingByCategory.get(category);

    if (details) {
      if (existing) {
        await db.update(micrositePageSpecifications).set({ details }).where(eq(micrositePageSpecifications.id, existing.id));
      } else {
        await db.insert(micrositePageSpecifications).values({ pageId, category, details, sortOrder: i });
      }
    } else if (existing) {
      await db.delete(micrositePageSpecifications).where(eq(micrositePageSpecifications.id, existing.id));
    }
  }
}

async function syncNearbyPlaces(pageId: number, formData: FormData) {
  const removeIds = formData.getAll("removeNearbyPlaceId").map((v) => Number(v)).filter((n) => Number.isInteger(n));
  if (removeIds.length > 0) {
    await db.delete(micrositePageNearbyPlaces).where(and(eq(micrositePageNearbyPlaces.pageId, pageId), inArray(micrositePageNearbyPlaces.id, removeIds)));
  }

  const categories = formData.getAll("newNearbyCategory").map((v) => (typeof v === "string" ? v.trim() : ""));
  const items = formData.getAll("newNearbyItems").map((v) => (typeof v === "string" ? v.trim() : ""));
  const newRows = categories
    .map((category, i) => ({ category, items: items[i] ?? "" }))
    .filter((r) => r.category.length > 0 && r.items.length > 0);
  if (newRows.length === 0) return;

  const existing = await db.select({ sortOrder: micrositePageNearbyPlaces.sortOrder }).from(micrositePageNearbyPlaces).where(eq(micrositePageNearbyPlaces.pageId, pageId));
  let order = existing.length > 0 ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 0;
  await db.insert(micrositePageNearbyPlaces).values(newRows.map((r) => ({ pageId, category: r.category, items: r.items, sortOrder: order++ })));
}

export async function adminCreateMicrositePageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = micrositePageSchema.safeParse(readMicrositeFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const slugTaken = await db.query.micrositePages.findFirst({ where: eq(micrositePages.slug, data.slug) });
  if (slugTaken) return { error: "That URL is already taken by another page." };

  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }

  // Best-effort, same as adminCreateProjectAction — a page with no pin just
  // shows no computed "nearest metro"/hub-distance facts on the public page.
  const geo = await geocodeLocality(data.locality, data.city);

  const [page] = await db
    .insert(micrositePages)
    .values({
      slug: data.slug,
      name: data.name,
      tagline: data.tagline || null,
      developerName: data.developerName || null,
      developerUrl: data.developerUrl || null,
      locality: data.locality,
      city: data.city,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      propertyType: data.propertyType,
      constructionStatus: data.constructionStatus,
      areaAcres: data.areaAcres ?? null,
      totalUnits: data.totalUnits ?? null,
      minAreaSqft: data.minAreaSqft ?? null,
      maxAreaSqft: data.maxAreaSqft ?? null,
      bhkOptions: data.bhkOptions || null,
      reraNumber: data.reraNumber?.trim() || null,
      possessionYear: data.possessionYear ?? null,
      description: data.description || null,
      amenities: resolveMicrositeAmenities(formData),
      brochureUrl: data.brochureUrl || null,
      specificationsIntro: data.specificationsIntro || null,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      featured: formData.get("featured") === "on",
      published: formData.get("published") === "on",
    })
    .returning();

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const rows: { pageId: number; url: string; sortOrder: number }[] = [];
  let order = 0;
  for (const file of files.slice(0, 15)) {
    const url = await saveUploadedImage(file);
    if (url) rows.push({ pageId: page.id, url, sortOrder: order++ });
  }
  if (rows.length > 0) {
    await db.insert(micrositePageImages).values(rows);
  }

  await insertNewMicrositeVideos(page.id, formData);
  await syncSpecifications(page.id, formData);
  await syncNearbyPlaces(page.id, formData);

  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${page.id}/edit?saved=1`);
}

export async function adminUpdateMicrositePageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const pageId = Number(formData.get("pageId"));
  if (!pageId) return { error: "Missing page." };

  const parsed = micrositePageSchema.safeParse(readMicrositeFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const existing = await db.query.micrositePages.findFirst({ where: eq(micrositePages.id, pageId) });
  if (!existing) return { error: "This page could not be found." };

  if (data.slug !== existing.slug) {
    const slugTaken = await db.query.micrositePages.findFirst({ where: eq(micrositePages.slug, data.slug) });
    if (slugTaken) return { error: "That URL is already taken by another page." };
  }

  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }

  // Same "only re-geocode when the locality/city text actually changed" logic
  // as adminUpdateProjectAction — an unrelated edit shouldn't cost a network
  // round-trip or risk losing an existing pin to a transient failure.
  const localityChanged = existing.locality !== data.locality || existing.city !== data.city;
  const geo = localityChanged ? await geocodeLocality(data.locality, data.city) : null;
  const latitude = localityChanged ? (geo?.latitude ?? null) : existing.latitude;
  const longitude = localityChanged ? (geo?.longitude ?? null) : existing.longitude;

  // Same transition-aware reraVerifiedAt logic as adminUpdateProjectAction —
  // see schema.ts's projects.reraVerified comment.
  const reraVerified = formData.get("reraVerified") === "on";
  const newlyVerified = reraVerified && !existing.reraVerified;
  const reraVerifiedAt = !reraVerified ? null : newlyVerified ? new Date().toISOString() : (existing.reraVerifiedAt ?? new Date().toISOString());

  const masterPlanFile = formData.get("masterPlanImage");
  const masterPlanImageUrl =
    masterPlanFile instanceof File && masterPlanFile.size > 0 ? (await saveUploadedImage(masterPlanFile)) ?? existing.masterPlanImageUrl : existing.masterPlanImageUrl;
  const locationMapFile = formData.get("locationMapImage");
  const locationMapImageUrl =
    locationMapFile instanceof File && locationMapFile.size > 0 ? (await saveUploadedImage(locationMapFile)) ?? existing.locationMapImageUrl : existing.locationMapImageUrl;

  await db
    .update(micrositePages)
    .set({
      slug: data.slug,
      name: data.name,
      tagline: data.tagline || null,
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
      minAreaSqft: data.minAreaSqft ?? null,
      maxAreaSqft: data.maxAreaSqft ?? null,
      bhkOptions: data.bhkOptions || null,
      reraNumber: data.reraNumber?.trim() || null,
      reraVerified,
      reraVerifiedAt,
      possessionYear: data.possessionYear ?? null,
      description: data.description || null,
      amenities: resolveMicrositeAmenities(formData),
      brochureUrl: data.brochureUrl || null,
      masterPlanImageUrl,
      locationMapImageUrl,
      specificationsIntro: data.specificationsIntro || null,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      featured: formData.get("featured") === "on",
      published: formData.get("published") === "on",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(micrositePages.id, pageId));

  // Gallery images: remove + re-sort "main" to sortOrder 0 + append new ones
  // — identical pattern to adminUpdateProjectAction's image handling.
  const removeImageIds = formData.getAll("removeImageId").map((v) => Number(v)).filter((n) => Number.isInteger(n));
  if (removeImageIds.length > 0) {
    await db.delete(micrositePageImages).where(and(eq(micrositePageImages.pageId, pageId), inArray(micrositePageImages.id, removeImageIds)));
  }
  const mainImageId = Number(formData.get("mainImageId"));
  const remainingImages = await db
    .select({ id: micrositePageImages.id })
    .from(micrositePageImages)
    .where(eq(micrositePageImages.pageId, pageId))
    .orderBy(micrositePageImages.sortOrder);
  const chosenMain = remainingImages.find((img) => img.id === mainImageId);
  const orderedImages = chosenMain ? [chosenMain, ...remainingImages.filter((img) => img.id !== mainImageId)] : remainingImages;
  for (let i = 0; i < orderedImages.length; i++) {
    await db.update(micrositePageImages).set({ sortOrder: i }).where(eq(micrositePageImages.id, orderedImages[i].id));
  }
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  let order = orderedImages.length;
  const newRows: { pageId: number; url: string; sortOrder: number }[] = [];
  for (const file of files.slice(0, 15)) {
    const url = await saveUploadedImage(file);
    if (url) newRows.push({ pageId, url, sortOrder: order++ });
  }
  if (newRows.length > 0) {
    await db.insert(micrositePageImages).values(newRows);
  }

  const removeVideoIds = formData.getAll("removeVideoId").map((v) => Number(v)).filter((n) => Number.isInteger(n));
  if (removeVideoIds.length > 0) {
    await db.delete(micrositePageVideos).where(and(eq(micrositePageVideos.pageId, pageId), inArray(micrositePageVideos.id, removeVideoIds)));
  }
  await insertNewMicrositeVideos(pageId, formData);

  await syncSpecifications(pageId, formData);
  await syncNearbyPlaces(pageId, formData);

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}/edit`);
  revalidatePath(`/${existing.slug}`);
  if (data.slug !== existing.slug) revalidatePath(`/${data.slug}`);
  redirect(`/admin/pages/${pageId}/edit?saved=1`);
}

export async function adminDeleteMicrositePageAction(formData: FormData) {
  await requireAdmin();
  const pageId = Number(formData.get("pageId"));
  if (!pageId) return;

  const page = await db.query.micrositePages.findFirst({ where: eq(micrositePages.id, pageId), columns: { slug: true } });
  // Every child table (images, videos, floor plans + their images,
  // specifications, nearby places, inquiries) cascade-deletes with the page
  // — see schema.ts's onDelete: "cascade" on each one's pageId/floorPlanId FK.
  await db.delete(micrositePages).where(eq(micrositePages.id, pageId));

  revalidatePath("/admin/pages");
  if (page?.slug) revalidatePath(`/${page.slug}`);
  redirect("/admin/pages");
}

// Floor plans (schema.ts's micrositePageFloorPlans) are managed as their own
// small per-card form on the page editor (see MicrositeFloorPlanForm.tsx)
// rather than folded into the giant main-page form above — each one owns
// its own image set, which is the same reason projectVideos/projectImages
// aren't nested inside a single mega-submit either.
export async function adminSaveMicrositeFloorPlanAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const pageId = Number(formData.get("pageId"));
  if (!pageId) return { error: "Missing page." };
  const floorPlanIdRaw = formData.get("floorPlanId");
  const floorPlanId = floorPlanIdRaw ? Number(floorPlanIdRaw) : null;

  const label = (formData.get("label") as string | null)?.trim();
  if (!label) return { error: "Enter a label for this configuration (e.g. “East Facing Villa”)." };

  const plotAreaSqydRaw = formData.get("plotAreaSqyd");
  const plotAreaSqyd = plotAreaSqydRaw ? Number(plotAreaSqydRaw) : null;
  const builtUpAreaSqftRaw = formData.get("builtUpAreaSqft");
  const builtUpAreaSqft = builtUpAreaSqftRaw ? Number(builtUpAreaSqftRaw) : null;
  const bedrooms = (formData.get("bedrooms") as string | null)?.trim() || null;
  const virtualTourUrlRaw = (formData.get("virtualTourUrl") as string | null)?.trim() || "";
  if (virtualTourUrlRaw && !isEmbeddableTourUrl(virtualTourUrlRaw)) {
    return { error: "Enter a valid http(s) virtual tour URL." };
  }

  let targetId = floorPlanId;
  if (targetId) {
    await db
      .update(micrositePageFloorPlans)
      .set({ label, plotAreaSqyd, builtUpAreaSqft, bedrooms, virtualTourUrl: virtualTourUrlRaw || null })
      .where(and(eq(micrositePageFloorPlans.id, targetId), eq(micrositePageFloorPlans.pageId, pageId)));
  } else {
    const existingCount = await db.select({ sortOrder: micrositePageFloorPlans.sortOrder }).from(micrositePageFloorPlans).where(eq(micrositePageFloorPlans.pageId, pageId));
    const sortOrder = existingCount.length > 0 ? Math.max(...existingCount.map((r) => r.sortOrder)) + 1 : 0;
    const [created] = await db
      .insert(micrositePageFloorPlans)
      .values({ pageId, label, plotAreaSqyd, builtUpAreaSqft, bedrooms, virtualTourUrl: virtualTourUrlRaw || null, sortOrder })
      .returning();
    targetId = created.id;
  }

  const removeImageIds = formData.getAll("removeImageId").map((v) => Number(v)).filter((n) => Number.isInteger(n));
  if (removeImageIds.length > 0) {
    await db.delete(micrositePageFloorPlanImages).where(and(eq(micrositePageFloorPlanImages.floorPlanId, targetId), inArray(micrositePageFloorPlanImages.id, removeImageIds)));
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 0) {
    const existingImages = await db.select({ sortOrder: micrositePageFloorPlanImages.sortOrder }).from(micrositePageFloorPlanImages).where(eq(micrositePageFloorPlanImages.floorPlanId, targetId));
    let order = existingImages.length > 0 ? Math.max(...existingImages.map((r) => r.sortOrder)) + 1 : 0;
    const rows: { floorPlanId: number; url: string; label: string | null; sortOrder: number }[] = [];
    for (const file of files.slice(0, 3)) {
      const url = await saveUploadedImage(file);
      if (url) rows.push({ floorPlanId: targetId, url, label: null, sortOrder: order++ });
    }
    if (rows.length > 0) await db.insert(micrositePageFloorPlanImages).values(rows);
  }

  revalidatePath(`/admin/pages/${pageId}/edit`);
  const page = await db.query.micrositePages.findFirst({ where: eq(micrositePages.id, pageId), columns: { slug: true } });
  if (page?.slug) revalidatePath(`/${page.slug}`);

  return { success: floorPlanId ? "Configuration updated." : "Configuration added." };
}

export async function adminDeleteMicrositeFloorPlanAction(formData: FormData) {
  await requireAdmin();
  const pageId = Number(formData.get("pageId"));
  const floorPlanId = Number(formData.get("floorPlanId"));
  if (!pageId || !floorPlanId) return;

  await db.delete(micrositePageFloorPlans).where(and(eq(micrositePageFloorPlans.id, floorPlanId), eq(micrositePageFloorPlans.pageId, pageId)));

  revalidatePath(`/admin/pages/${pageId}/edit`);
  const page = await db.query.micrositePages.findFirst({ where: eq(micrositePages.id, pageId), columns: { slug: true } });
  if (page?.slug) revalidatePath(`/${page.slug}`);
  redirect(`/admin/pages/${pageId}/edit`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users, listings, listingImages, homeTiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

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

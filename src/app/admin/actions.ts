"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users, listings } from "@/db/schema";
import { getSession } from "@/lib/auth";

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

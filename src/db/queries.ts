import { db } from "./client";
import { listings, listingImages, users } from "./schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

export type ListingFilters = {
  q?: string;
  listingType?: "sale" | "rent";
  propertyType?: string;
  bhk?: number;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  newOnly?: boolean;
};

const firstImageSubquery = sql<string | null>`(
  select ${listingImages.url} from ${listingImages}
  where ${listingImages.listingId} = ${listings.id}
  order by ${listingImages.sortOrder} asc
  limit 1
)`.as("imageUrl");

export async function getFeaturedListings(limit = 6) {
  return db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      listingType: listings.listingType,
      propertyType: listings.propertyType,
      bhk: listings.bhk,
      areaSqft: listings.areaSqft,
      locality: listings.locality,
      featured: listings.featured,
      imageUrl: firstImageSubquery,
    })
    .from(listings)
    .where(and(eq(listings.status, "active"), eq(listings.featured, true)))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
}

export async function searchListings(filters: ListingFilters) {
  const conditions = [eq(listings.status, "active")];

  if (filters.listingType) conditions.push(eq(listings.listingType, filters.listingType));
  if (filters.propertyType) conditions.push(eq(listings.propertyType, filters.propertyType as never));
  if (filters.bhk) conditions.push(eq(listings.bhk, filters.bhk));
  if (filters.minPrice) conditions.push(gte(listings.price, filters.minPrice));
  if (filters.maxPrice) conditions.push(lte(listings.price, filters.maxPrice));
  if (filters.featured) conditions.push(eq(listings.featured, true));
  if (filters.newOnly) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    conditions.push(gte(listings.createdAt, thirtyDaysAgo));
  }
  if (filters.q) {
    conditions.push(
      sql`(${listings.locality} like ${"%" + filters.q + "%"} or ${listings.title} like ${"%" + filters.q + "%"})`
    );
  }

  return db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      listingType: listings.listingType,
      propertyType: listings.propertyType,
      bhk: listings.bhk,
      areaSqft: listings.areaSqft,
      locality: listings.locality,
      featured: listings.featured,
      imageUrl: firstImageSubquery,
    })
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.featured), desc(listings.createdAt));
}

export async function getListingById(id: number) {
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!listing) return null;

  const images = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, id))
    .orderBy(listingImages.sortOrder);

  const owner = await db.query.users.findFirst({ where: eq(users.id, listing.ownerId) });

  return { ...listing, images, owner };
}

export type HomeCategory = {
  key: string;
  label: string;
  href: string;
  count: number;
  imageUrl: string | null;
};

async function categoryTile(
  key: string,
  label: string,
  href: string,
  extraConditions: ReturnType<typeof eq>[]
): Promise<HomeCategory> {
  const conditions = [eq(listings.status, "active"), ...extraConditions];

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listings)
    .where(and(...conditions));

  const [top] = await db
    .select({ imageUrl: firstImageSubquery })
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.featured), desc(listings.createdAt))
    .limit(1);

  return { key, label, href, count, imageUrl: top?.imageUrl ?? null };
}

export async function getHomeCategories(): Promise<HomeCategory[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return Promise.all([
    categoryTile("new", "New listings", "/browse?new=1", [gte(listings.createdAt, thirtyDaysAgo)]),
    categoryTile("sale", "Homes for sale", "/browse?listingType=sale", [eq(listings.listingType, "sale")]),
    categoryTile("rent", "Homes for rent", "/browse?listingType=rent", [eq(listings.listingType, "rent")]),
    categoryTile("featured", "Featured", "/browse?featured=1", [eq(listings.featured, true)]),
  ]);
}

export async function getListingsByOwner(ownerId: number) {
  return db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      listingType: listings.listingType,
      propertyType: listings.propertyType,
      bhk: listings.bhk,
      areaSqft: listings.areaSqft,
      locality: listings.locality,
      featured: listings.featured,
      status: listings.status,
      views: listings.views,
      imageUrl: firstImageSubquery,
    })
    .from(listings)
    .where(eq(listings.ownerId, ownerId))
    .orderBy(desc(listings.createdAt));
}

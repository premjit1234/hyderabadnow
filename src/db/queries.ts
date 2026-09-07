import { db } from "./client";
import {
  listings,
  listingImages,
  users,
  inquiries,
  homeTiles,
  projects,
  projectImages,
  siteSettings,
  legalPages,
  socialLinks,
} from "./schema";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

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

// NOTE: the correlation below deliberately references the outer table as raw
// "listings"."id" rather than interpolating ${listings.id} as a Drizzle column.
// Both listings and listing_images have a column literally named "id" — when
// interpolated as a bare column reference inside this subquery (whose own FROM
// is listing_images), Drizzle renders it unqualified, so SQLite resolves it to
// the nearest-scope match: listing_images.id (its own primary key), not the
// outer listings.id. That silently breaks the correlation (verified empirically
// against seeded data — it returned a same-numbered row's own first image
// instead of the requested listing's), so every column that could collide with
// an outer-table column of the same name must be qualified explicitly here.
const firstImageSubquery = sql<string | null>`(
  select ${listingImages.url} from ${listingImages}
  where ${listingImages.listingId} = "listings"."id"
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
      verified: listings.verified,
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
      verified: listings.verified,
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
  const project = listing.projectId
    ? await db.query.projects.findFirst({ where: eq(projects.id, listing.projectId) })
    : null;

  return { ...listing, images, owner, project };
}

export type HomeCategory = {
  id: number;
  label: string;
  href: string;
  count: number | null;
  imageUrl: string | null;
};

// Homepage tiles are admin-managed rows (label + image + destination link —
// see src/app/admin/home-tiles), not auto-computed from listings. We still
// show a live count badge for tiles whose href is a recognizable /browse
// filter (the ones the app itself creates), by parsing that query string the
// same way /browse would filter — but it's best-effort: a tile pointing
// somewhere else (or a custom admin-added link) just shows no count.
const KNOWN_TILE_QUERY_PARAMS = new Set(["listingType", "propertyType", "featured", "new"]);
const KNOWN_PROPERTY_TYPES = [
  "apartment",
  "villa",
  "independent_house",
  "plot",
  "commercial",
] as const;

function countConditionsForHref(href: string) {
  if (!href.startsWith("/browse")) return null;

  let query: URLSearchParams;
  try {
    query = new URL(href, "http://internal").searchParams;
  } catch {
    return null;
  }

  // If the tile links somewhere with a query param we don't know how to turn
  // into a count (e.g. a free-text "q" search, or a min/max price range an
  // admin typed into a custom tile link), showing a count would just be
  // wrong — better to show no badge than a misleading one.
  for (const key of query.keys()) {
    if (!KNOWN_TILE_QUERY_PARAMS.has(key)) return null;
  }

  const conditions = [eq(listings.status, "active")];
  const listingType = query.get("listingType");
  if (listingType === "sale" || listingType === "rent") {
    conditions.push(eq(listings.listingType, listingType));
  }
  const propertyType = query.get("propertyType");
  if (propertyType && (KNOWN_PROPERTY_TYPES as readonly string[]).includes(propertyType)) {
    conditions.push(eq(listings.propertyType, propertyType as (typeof KNOWN_PROPERTY_TYPES)[number]));
  }
  if (query.get("featured") === "1") {
    conditions.push(eq(listings.featured, true));
  }
  if (query.get("new") === "1") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    conditions.push(gte(listings.createdAt, thirtyDaysAgo));
  }
  return conditions;
}

export async function getHomeCategories(): Promise<HomeCategory[]> {
  const tiles = await db.select().from(homeTiles).orderBy(asc(homeTiles.sortOrder), asc(homeTiles.id));

  return Promise.all(
    tiles.map(async (tile) => {
      const conditions = countConditionsForHref(tile.href);
      let count: number | null = null;
      if (conditions) {
        const [row] = await db
          .select({ n: sql<number>`count(*)` })
          .from(listings)
          .where(and(...conditions));
        count = row?.n ?? 0;
      }
      return { id: tile.id, label: tile.label, href: tile.href, imageUrl: tile.imageUrl, count };
    })
  );
}

// ---- Admin: homepage tiles ----

export async function getHomeTilesForAdmin() {
  return db.select().from(homeTiles).orderBy(asc(homeTiles.sortOrder), asc(homeTiles.id));
}

// ---- Admin dashboard ----

// Same unqualified-column pitfall as firstImageSubquery above — both users and
// listings have an "id" column, so the correlation must be spelled out explicitly.
const userListingCountSubquery = sql<number>`(
  select count(*) from ${listings} where ${listings.ownerId} = "users"."id"
)`.as("listingCount");

export async function getAllUsersForAdmin(q?: string) {
  const conditions = q
    ? [sql`(${users.name} like ${"%" + q + "%"} or ${users.email} like ${"%" + q + "%"})`]
    : [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      authProvider: users.authProvider,
      createdAt: users.createdAt,
      listingCount: userListingCountSubquery,
    })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));
}

export async function getAllListingsForAdmin(filters?: { ownerId?: number; q?: string }) {
  const conditions = [];
  if (filters?.ownerId) conditions.push(eq(listings.ownerId, filters.ownerId));
  if (filters?.q) {
    conditions.push(
      sql`(${listings.title} like ${"%" + filters.q + "%"} or ${listings.locality} like ${"%" + filters.q + "%"})`
    );
  }

  return db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      listingType: listings.listingType,
      status: listings.status,
      featured: listings.featured,
      verified: listings.verified,
      views: listings.views,
      createdAt: listings.createdAt,
      ownerId: listings.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(listings)
    .leftJoin(users, eq(listings.ownerId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(listings.createdAt));
}

export async function getAdminStats() {
  const [[userTotal], [listingTotal], [inquiryTotal], usersByRole, listingsByStatus] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(users),
    db.select({ n: sql<number>`count(*)` }).from(listings),
    db.select({ n: sql<number>`count(*)` }).from(inquiries),
    db.select({ role: users.role, n: sql<number>`count(*)` }).from(users).groupBy(users.role),
    db.select({ status: listings.status, n: sql<number>`count(*)` }).from(listings).groupBy(listings.status),
  ]);

  return {
    totalUsers: userTotal.n,
    totalListings: listingTotal.n,
    totalInquiries: inquiryTotal.n,
    usersByRole,
    listingsByStatus,
  };
}

export async function getAllInquiriesForAdmin() {
  return db
    .select({
      id: inquiries.id,
      name: inquiries.name,
      email: inquiries.email,
      phone: inquiries.phone,
      message: inquiries.message,
      createdAt: inquiries.createdAt,
      listingId: listings.id,
      listingTitle: listings.title,
    })
    .from(inquiries)
    .leftJoin(listings, eq(inquiries.listingId, listings.id))
    .orderBy(desc(inquiries.createdAt));
}

// ---- Projects ----

// Same unqualified-column pitfall as firstImageSubquery above — projects and
// project_images both have an "id" column, so this must be qualified.
const firstProjectImageSubquery = sql<string | null>`(
  select ${projectImages.url} from ${projectImages}
  where ${projectImages.projectId} = "projects"."id"
  order by ${projectImages.sortOrder} asc
  limit 1
)`.as("imageUrl");

const activeListingCountSubquery = (type: "sale" | "rent") => sql<number>`(
  select count(*) from ${listings}
  where ${listings.projectId} = "projects"."id"
    and ${listings.status} = 'active'
    and ${listings.listingType} = ${type}
)`.as(`${type}Count`);

export async function getAllProjectsForAdmin() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      locality: projects.locality,
      propertyType: projects.propertyType,
      constructionStatus: projects.constructionStatus,
      totalUnits: projects.totalUnits,
      createdAt: projects.createdAt,
      imageUrl: firstProjectImageSubquery,
      saleListings: activeListingCountSubquery("sale"),
      rentListings: activeListingCountSubquery("rent"),
    })
    .from(projects)
    .orderBy(desc(projects.createdAt));
}

export async function getProjectsForPublic() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      locality: projects.locality,
      city: projects.city,
      propertyType: projects.propertyType,
      constructionStatus: projects.constructionStatus,
      totalUnits: projects.totalUnits,
      minAreaSqft: projects.minAreaSqft,
      maxAreaSqft: projects.maxAreaSqft,
      bhkOptions: projects.bhkOptions,
      imageUrl: firstProjectImageSubquery,
      saleListings: activeListingCountSubquery("sale"),
      rentListings: activeListingCountSubquery("rent"),
    })
    .from(projects)
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) return null;

  const images = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, id))
    .orderBy(projectImages.sortOrder);

  return { ...project, images };
}

export async function getListingsByProject(projectId: number, listingType?: "sale" | "rent") {
  const conditions = [
    eq(listings.projectId, projectId),
    eq(listings.status, "active"),
    ...(listingType ? [eq(listings.listingType, listingType)] : []),
  ];

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
      verified: listings.verified,
      imageUrl: firstImageSubquery,
    })
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.featured), desc(listings.createdAt));
}

export async function getProjectsForSelect() {
  return db
    .select({ id: projects.id, name: projects.name, locality: projects.locality })
    .from(projects)
    .orderBy(asc(projects.name));
}

// ---- Site settings (logo / favicon) ----

// Singleton row, always id=1. No pre-seeded row is required: reads fall back
// to nulls (meaning "use the built-in defaults") until an admin saves once.
//
// Also called from the ROOT layout's generateMetadata (for the favicon), which
// runs for every page — including at `next build` time inside the Docker
// builder stage, against a throwaway sqlite file that has no tables at all yet
// (schema is only pushed at container start, see docker-entrypoint.sh). So this
// must tolerate "no such table" rather than fail the whole build.
export async function getSiteSettings(): Promise<{
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
}> {
  try {
    const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.id, 1) });
    return {
      logoUrl: row?.logoUrl ?? null,
      faviconUrl: row?.faviconUrl ?? null,
      heroImageUrl: row?.heroImageUrl ?? null,
    };
  } catch {
    return { logoUrl: null, faviconUrl: null, heroImageUrl: null };
  }
}

// ---- Legal pages (Terms of Use / Privacy Policy / Cookie Policy) ----

// Fixed display order regardless of insertion order (matches the footer's
// "Terms of Use | Privacy Policy | Cookie Policy" layout).
const LEGAL_PAGE_ORDER = ["terms", "privacy", "cookies"] as const;
function bySlugOrder<T extends { slug: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      LEGAL_PAGE_ORDER.indexOf(a.slug as (typeof LEGAL_PAGE_ORDER)[number]) -
      LEGAL_PAGE_ORDER.indexOf(b.slug as (typeof LEGAL_PAGE_ORDER)[number])
  );
}

// Called from the (site) layout's Footer/Header on every request — same
// build-time "no such table" concern as getSiteSettings (see its comment),
// so this tolerates a missing table rather than failing the build.
export async function getLegalPages(): Promise<{ slug: string; title: string }[]> {
  try {
    const rows = await db.select({ slug: legalPages.slug, title: legalPages.title }).from(legalPages);
    return bySlugOrder(rows);
  } catch {
    return [];
  }
}

export async function getLegalPageBySlug(slug: (typeof LEGAL_PAGE_ORDER)[number]) {
  const row = await db.query.legalPages.findFirst({ where: eq(legalPages.slug, slug) });
  return row ?? null;
}

export async function getAllLegalPagesForAdmin() {
  const rows = await db.select().from(legalPages);
  return bySlugOrder(rows);
}

// ---- Social links (header + footer icon rows) ----

// Same build-time resilience as getSiteSettings/getLegalPages above.
export async function getSocialLinks() {
  try {
    return await db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id));
  } catch {
    return [];
  }
}

export async function getAllSocialLinksForAdmin() {
  return getSocialLinks();
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
      verified: listings.verified,
      status: listings.status,
      views: listings.views,
      imageUrl: firstImageSubquery,
    })
    .from(listings)
    .where(eq(listings.ownerId, ownerId))
    .orderBy(desc(listings.createdAt));
}

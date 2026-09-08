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
  listingFieldSettings,
  blogPosts,
  blogImages,
  blogComments,
  pageViews,
  locations,
  amenityCatalog,
} from "./schema";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { resolveFieldVisibility, type ListingFieldVisibility } from "@/lib/listingFields";

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
      bathrooms: listings.bathrooms,
      carParking: listings.carParking,
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
  // The filter UI (/browse's "Bedrooms (BHK)" select) offers "1+ BHK", "2+
  // BHK", etc. — an exact eq() here silently required exactly that BHK
  // count, so e.g. "1+ BHK" hid every 2/3/4 BHK listing instead of
  // including them, matching neither the label nor how bedroom-count
  // filters normally work.
  if (filters.bhk) conditions.push(gte(listings.bhk, filters.bhk));
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
      bathrooms: listings.bathrooms,
      carParking: listings.carParking,
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

// Cheapest currently-active listing of each type within a project — lets the
// public projects list show "Starting from ₹X" the way real estate portals
// do, without touching listings that belong to other projects (or none).
const minListingPriceSubquery = (type: "sale" | "rent") => sql<number | null>`(
  select min(${listings.price}) from ${listings}
  where ${listings.projectId} = "projects"."id"
    and ${listings.status} = 'active'
    and ${listings.listingType} = ${type}
)`.as(`min${type === "sale" ? "Sale" : "Rent"}Price`);

export type ProjectFilters = {
  q?: string;
  locality?: string;
  propertyType?: string;
  constructionStatus?: "under_construction" | "ready_to_move";
  bhk?: number;
  minArea?: number;
  maxArea?: number;
  sort?: "newest" | "name" | "price_asc";
};

export async function getAllProjectsForAdmin() {
  return db
    .select({
      id: projects.id,
      slug: projects.slug,
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

export async function getProjectsForPublic(filters: ProjectFilters = {}) {
  const conditions = [];

  if (filters.locality) conditions.push(eq(projects.locality, filters.locality));
  if (filters.propertyType) conditions.push(eq(projects.propertyType, filters.propertyType as never));
  if (filters.constructionStatus) conditions.push(eq(projects.constructionStatus, filters.constructionStatus));
  if (filters.bhk) {
    // bhkOptions is a free-text comma list (e.g. "2,2.5,3,4"), not a normalized
    // column — pad both sides with commas so "3" doesn't also match "13".
    conditions.push(
      sql`(',' || replace(${projects.bhkOptions}, ' ', '') || ',') like ${"%," + String(filters.bhk) + ",%"}`
    );
  }
  // Area filters are a range overlap check: the project's [min, max] sqft
  // range must overlap the requester's desired range. A project with no area
  // data on file simply won't match an area filter, same as listings do for
  // price filters elsewhere in the app.
  if (filters.minArea) conditions.push(gte(projects.maxAreaSqft, filters.minArea));
  if (filters.maxArea) conditions.push(lte(projects.minAreaSqft, filters.maxArea));
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(
      sql`(${projects.name} like ${like} or ${projects.developerName} like ${like} or ${projects.locality} like ${like})`
    );
  }

  const minSalePriceSubquery = minListingPriceSubquery("sale");
  const minRentPriceSubquery = minListingPriceSubquery("rent");

  const orderBy =
    filters.sort === "name"
      ? [asc(projects.name)]
      : filters.sort === "price_asc"
        ? [sql`${minSalePriceSubquery} is null`, asc(minSalePriceSubquery)]
        : [desc(projects.createdAt)];

  return db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      locality: projects.locality,
      city: projects.city,
      latitude: projects.latitude,
      longitude: projects.longitude,
      propertyType: projects.propertyType,
      constructionStatus: projects.constructionStatus,
      totalUnits: projects.totalUnits,
      minAreaSqft: projects.minAreaSqft,
      maxAreaSqft: projects.maxAreaSqft,
      bhkOptions: projects.bhkOptions,
      possessionYear: projects.possessionYear,
      reraApprovalYear: projects.reraApprovalYear,
      imageUrl: firstProjectImageSubquery,
      saleListings: activeListingCountSubquery("sale"),
      rentListings: activeListingCountSubquery("rent"),
      minSalePrice: minSalePriceSubquery,
      minRentPrice: minRentPriceSubquery,
    })
    .from(projects)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderBy);
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

/** Looks up a project by its public URL slug (/projects/[slug]) — the
 * primary lookup for the public project page now that it's name-based
 * rather than /projects/[id]. */
export async function getProjectBySlug(slug: string) {
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project) return null;

  const images = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, project.id))
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
      bathrooms: listings.bathrooms,
      carParking: listings.carParking,
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

// ---- Locations (locality suggestions — see schema.ts's locations table) ----

// Called from several public pages on every request (homepage, post-listing
// form) — same "table might not exist yet at build time" tolerance as
// getSiteSettings/getSocialLinks above.
export async function getLocations() {
  try {
    return await db.select().from(locations).orderBy(asc(locations.sortOrder), asc(locations.name));
  } catch {
    return [];
  }
}

export async function getLocationNames() {
  return (await getLocations()).map((l) => l.name);
}

// Admin-only view — adds how many existing listings/projects currently use
// each locality name, so an admin can see at a glance whether deleting one
// would leave live listings pointing at a name no longer in the suggestion
// list (harmless — locality is free text, not a foreign key — but worth
// knowing before renaming or removing one).
export async function getLocationsForAdmin() {
  return db
    .select({
      id: locations.id,
      name: locations.name,
      sortOrder: locations.sortOrder,
      listingCount: sql<number>`(select count(*) from listings where listings.locality = locations.name)`,
      projectCount: sql<number>`(select count(*) from projects where projects.locality = locations.name)`,
    })
    .from(locations)
    .orderBy(asc(locations.sortOrder), asc(locations.name));
}

// ---- Amenity catalog (selectable amenities for listings — see schema.ts's
// amenityCatalog table) ----

export type AmenityCatalogEntry = { id: number; key: string; label: string };

// Called from the admin listing forms, the public post-listing form, and the
// public listing page on every request — same "table might not exist yet at
// build time" tolerance as getSiteSettings/getLocations above.
export async function getAmenityCatalog(): Promise<AmenityCatalogEntry[]> {
  try {
    return await db
      .select({ id: amenityCatalog.id, key: amenityCatalog.key, label: amenityCatalog.label })
      .from(amenityCatalog)
      .orderBy(asc(amenityCatalog.sortOrder), asc(amenityCatalog.label));
  } catch {
    return [];
  }
}

// ---- Listing field visibility (admin-configurable show/hide per field) ----

// Called from the public listing page and post-listing form on every
// request — same build-time "no such table" concern as getSiteSettings, so
// this tolerates a missing table/row rather than failing the build.
export async function getListingFieldSettings(): Promise<ListingFieldVisibility> {
  try {
    const row = await db.query.listingFieldSettings.findFirst({ where: eq(listingFieldSettings.id, 1) });
    const stored = row ? (JSON.parse(row.config) as Partial<ListingFieldVisibility>) : null;
    return resolveFieldVisibility(stored);
  } catch {
    return resolveFieldVisibility(null);
  }
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
      bathrooms: listings.bathrooms,
      carParking: listings.carParking,
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

// ---- Blog ----

const BLOG_PAGE_SIZE = 9;

export async function getPublishedBlogPosts({ page = 1, category }: { page?: number; category?: string } = {}) {
  const conditions = [eq(blogPosts.status, "published")];
  if (category) conditions.push(eq(blogPosts.category, category));
  const where = and(...conditions);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(where);
  const posts = await db
    .select()
    .from(blogPosts)
    .where(where)
    .orderBy(desc(blogPosts.publishedAt))
    .limit(BLOG_PAGE_SIZE)
    .offset((page - 1) * BLOG_PAGE_SIZE);

  return { posts, total: count, pageSize: BLOG_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(count / BLOG_PAGE_SIZE)) };
}

export async function getBlogCategoriesInUse() {
  const rows = await db
    .selectDistinct({ category: blogPosts.category })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"));
  return rows.map((r) => r.category);
}

export async function getBlogPostBySlug(slug: string) {
  const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.slug, slug) });
  if (!post) return null;

  const images = await db
    .select()
    .from(blogImages)
    .where(eq(blogImages.postId, post.id))
    .orderBy(blogImages.sortOrder);
  const author = post.authorId ? await db.query.users.findFirst({ where: eq(users.id, post.authorId) }) : null;
  const comments = await db
    .select({
      id: blogComments.id,
      content: blogComments.content,
      createdAt: blogComments.createdAt,
      userName: users.name,
    })
    .from(blogComments)
    .innerJoin(users, eq(blogComments.userId, users.id))
    .where(and(eq(blogComments.postId, post.id), eq(blogComments.status, "approved")))
    .orderBy(desc(blogComments.createdAt));

  return { ...post, images, author, comments };
}

export async function getAllBlogPostsForAdmin() {
  return db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      category: blogPosts.category,
      status: blogPosts.status,
      createdAt: blogPosts.createdAt,
      publishedAt: blogPosts.publishedAt,
      viewCount: blogPosts.viewCount,
      // Raw literal subquery, not interpolated Drizzle column objects — see
      // the firstImageSubquery comment above for why that matters here
      // (blog_posts and blog_comments don't share a same-named column that
      // could collide, but this keeps the same safe, explicit style).
      pendingComments: sql<number>`(
        select count(*) from blog_comments
        where blog_comments.post_id = blog_posts.id and blog_comments.status = 'pending'
      )`,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));
}

export async function getBlogPostForAdminEdit(id: number) {
  const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, id) });
  if (!post) return null;
  const images = await db
    .select()
    .from(blogImages)
    .where(eq(blogImages.postId, id))
    .orderBy(blogImages.sortOrder);
  return { ...post, images };
}

export async function getAllBlogCommentsForAdmin(status?: "pending" | "approved" | "rejected") {
  return db
    .select({
      id: blogComments.id,
      content: blogComments.content,
      status: blogComments.status,
      createdAt: blogComments.createdAt,
      userName: users.name,
      userEmail: users.email,
      postId: blogPosts.id,
      postTitle: blogPosts.title,
      postSlug: blogPosts.slug,
    })
    .from(blogComments)
    .innerJoin(users, eq(blogComments.userId, users.id))
    .innerJoin(blogPosts, eq(blogComments.postId, blogPosts.id))
    .where(status ? eq(blogComments.status, status) : undefined)
    .orderBy(desc(blogComments.createdAt));
}

// ---- Analytics ----
//
// page_views rows are only ever written for public (site) pages — see
// components/ViewTracker.tsx + recordPageViewAction — so every query below is
// implicitly site-wide-excluding-admin already, with no extra filtering
// needed. created_at is SQLite's CURRENT_TIMESTAMP, i.e. UTC text in
// "YYYY-MM-DD HH:MM:SS" form, so both the raw SQLite date/time functions
// below and the `toSqliteUtc` boundaries computed in JS compare cleanly
// against it as plain strings.

/** Formats a JS Date as the same "YYYY-MM-DD HH:MM:SS" UTC text SQLite's
 * CURRENT_TIMESTAMP writes, so it can be compared against page_views.createdAt. */
function toSqliteUtc(d: Date) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/** Distinct visitors with a page view in the last 5 minutes — "people on the
 * site right now" for the admin Analytics page (and the Overview teaser). */
export async function getLiveVisitorCount() {
  const [{ n }] = await db
    .select({ n: sql<number>`count(distinct ${pageViews.visitorId})` })
    .from(pageViews)
    .where(sql`${pageViews.createdAt} >= datetime('now', '-5 minutes')`);
  return n;
}

/** Page-view totals for today, this (Mon-start) week, this month, this year,
 * and all time — each "to date" from its period's start through now. */
export async function getPageViewStats() {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mondayOffset = (startOfToday.getUTCDay() + 6) % 7; // 0 = Monday
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - mondayOffset);
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const countSince = async (since: Date) => {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(pageViews)
      .where(sql`${pageViews.createdAt} >= ${toSqliteUtc(since)}`);
    return n;
  };

  const [today, week, month, year, [{ n: allTime }]] = await Promise.all([
    countSince(startOfToday),
    countSince(startOfWeek),
    countSince(startOfMonth),
    countSince(startOfYear),
    db.select({ n: sql<number>`count(*)` }).from(pageViews),
  ]);

  return { today, week, month, year, allTime };
}

/** Total recorded page views for one exact path — used to show a "N people
 * viewed this" line on public pages (currently the project detail page).
 * Reuses the same site-wide page_views tracking as the admin Analytics
 * page, just filtered to one path instead of aggregated across the site. */
export async function getPageViewCountForPath(path: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(pageViews)
    .where(eq(pageViews.path, path));
  return n;
}

/** Page views per day for the last `days` days (default 14), oldest first,
 * with zero-view days filled in so the admin trend chart never skips a gap. */
export async function getDailyPageViewSeries(days = 14) {
  const rows = await db
    .select({ day: sql<string>`date(${pageViews.createdAt})`, n: sql<number>`count(*)` })
    .from(pageViews)
    .where(sql`${pageViews.createdAt} >= datetime('now', ${`-${days} days`})`)
    .groupBy(sql`date(${pageViews.createdAt})`);

  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const series: { day: string; n: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, n: byDay.get(key) ?? 0 });
  }
  return series;
}

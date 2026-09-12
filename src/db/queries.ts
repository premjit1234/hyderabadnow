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
  listingPostLog,
  localityGuides,
  conversations,
  chatMessages,
  availabilitySlots,
} from "./schema";
import { and, asc, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
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

// Locality-level price/sqft benchmark for the "how does this compare?"
// indicator on a listing page (see ListingPriceComparison usage in
// listing/[id]/page.tsx) — averages price-per-sqft across other *active*
// listings of the same listingType (sale vs rent) in the same locality, so
// a rental never gets compared against sale prices or vice versa. Excludes
// the listing itself (excludeListingId) so a locality with only one listing
// never "compares" a listing to its own price. Requires at least 2
// comparables (enforced by the caller checking sampleSize) since a single
// other listing isn't a meaningful "average".
export async function getLocalityPricePerSqft(
  locality: string,
  listingType: "sale" | "rent",
  excludeListingId: number
): Promise<{ avgPricePerSqft: number | null; sampleSize: number }> {
  const [row] = await db
    .select({
      avgPricePerSqft: sql<number | null>`avg(${listings.price} * 1.0 / ${listings.areaSqft})`,
      sampleSize: sql<number>`count(*)`,
    })
    .from(listings)
    .where(
      and(
        eq(listings.status, "active"),
        eq(listings.locality, locality),
        eq(listings.listingType, listingType),
        sql`${listings.areaSqft} > 0`,
        sql`${listings.id} != ${excludeListingId}`
      )
    );
  return row ?? { avgPricePerSqft: null, sampleSize: 0 };
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

// Fresh, un-cached lookup of a user's current verification state — used by
// the post-listing page to decide whether to show PhoneVerificationGate.
// Deliberately not read from the session cookie: that JWT is signed once at
// login and can be up to 30 days stale (see lib/auth.ts), so it can't be
// trusted to reflect a phoneVerified flip that happened mid-session.
export async function getUserById(id: number) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

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
      monthlyListingLimitOverride: users.monthlyListingLimitOverride,
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
      staleNudgeSentAt: listings.staleNudgeSentAt,
      autoFlaggedStaleAt: listings.autoFlaggedStaleAt,
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

// ---- Lead management: owner/agent-facing inquiry stats (dashboard) ----
//
// Everything below powers /dashboard/inquiries and the "Inquiries" /
// "Response rate" tiles on the main dashboard — the per-listing inquiry
// counts, response-rate, and response-time stats requested alongside the
// locality guides and chat features. There's no in-app messaging yet (see
// Phase 3 plans), so "responded" is the owner manually marking an inquiry
// as handled (see markInquiryRespondedAction in app/actions.ts) rather than
// a real read-receipt — an honest proxy, not a perfect one.

/** Every inquiry against any listing this owner/agent owns, newest first —
 * the data behind /dashboard/inquiries. Scoped by an inner join on
 * listings.ownerId rather than trusting a passed-in listing list, so a
 * deleted listing's inquiries (cascade-deleted, see schema.ts) simply stop
 * appearing rather than needing separate cleanup. */
export async function getInquiriesForOwner(ownerId: number) {
  return db
    .select({
      id: inquiries.id,
      name: inquiries.name,
      email: inquiries.email,
      phone: inquiries.phone,
      message: inquiries.message,
      createdAt: inquiries.createdAt,
      respondedAt: inquiries.respondedAt,
      listingId: listings.id,
      listingTitle: listings.title,
    })
    .from(inquiries)
    .innerJoin(listings, eq(inquiries.listingId, listings.id))
    .where(eq(listings.ownerId, ownerId))
    .orderBy(desc(inquiries.createdAt));
}

/** Aggregate lead-quality stats across every listing this owner/agent owns:
 * total inquiries, how many are still unanswered, the response rate as a
 * whole percentage, and the average time-to-respond in hours (null until at
 * least one inquiry has been marked responded). Powers the dashboard's
 * "Inquiries" / "Response rate" StatCards. */
export async function getOwnerLeadStats(ownerId: number) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      responded: sql<number>`count(${inquiries.respondedAt})`,
      // Average hours between an inquiry landing and it being marked
      // responded, computed only over the responded subset — julianday
      // difference * 24 converts SQLite's day-based date math to hours.
      avgResponseHours: sql<number | null>`avg(
        case when ${inquiries.respondedAt} is not null
        then (julianday(${inquiries.respondedAt}) - julianday(${inquiries.createdAt})) * 24
        end
      )`,
    })
    .from(inquiries)
    .innerJoin(listings, eq(inquiries.listingId, listings.id))
    .where(eq(listings.ownerId, ownerId));

  const total = row?.total ?? 0;
  const responded = row?.responded ?? 0;
  return {
    total,
    responded,
    pending: total - responded,
    responseRatePct: total > 0 ? Math.round((responded / total) * 100) : null,
    avgResponseHours: row?.avgResponseHours != null ? Math.round(row.avgResponseHours * 10) / 10 : null,
  };
}

/** Per-listing {total, pending} inquiry counts for one owner/agent, keyed by
 * listing id — merged into the dashboard's listings table as an "Inquiries"
 * column next to each listing's views. */
export async function getInquiryCountsByListingForOwner(ownerId: number) {
  const rows = await db
    .select({
      listingId: listings.id,
      total: sql<number>`count(${inquiries.id})`,
      pending: sql<number>`count(${inquiries.id}) filter (where ${inquiries.respondedAt} is null)`,
    })
    .from(listings)
    .leftJoin(inquiries, eq(inquiries.listingId, listings.id))
    .where(eq(listings.ownerId, ownerId))
    .groupBy(listings.id);

  return new Map(rows.map((r) => [r.listingId, { total: r.total, pending: r.pending }]));
}

/** Page views recorded against `/listing/{id}` in the last `days` days, for
 * each listing id given — the "Views (7d)" trend indicator next to the
 * dashboard's lifetime views column. Empty input returns an empty map
 * without querying (there's nothing to look up, and an empty `IN ()` isn't
 * valid SQL anyway). */
export async function getRecentViewCountsForListings(listingIds: number[], days = 7) {
  if (listingIds.length === 0) return new Map<number, number>();

  const paths = listingIds.map((id) => `/listing/${id}`);
  const rows = await db
    .select({ path: pageViews.path, n: sql<number>`count(*)` })
    .from(pageViews)
    .where(
      and(
        inArray(pageViews.path, paths),
        sql`${pageViews.createdAt} >= datetime('now', ${`-${days} days`})`
      )
    )
    .groupBy(pageViews.path);

  const byPath = new Map(rows.map((r) => [r.path, r.n]));
  return new Map(listingIds.map((id) => [id, byPath.get(`/listing/${id}`) ?? 0]));
}

// ---- In-app chat (buyer ↔ seller/agent) ----
//
// A conversation counts as unread for a given side the same way everywhere
// below: its `lastMessageAt` is later than that side's own `*ReadAt` marker.
// sendMessageAction bumps both the conversation's lastMessageAt AND the
// sender's own readAt to "now" on every send (see app/actions.ts) — sending
// a message obviously means you've seen everything up to it — which is what
// keeps this comparison correct without needing to inspect who sent the
// most recent message.

/** Every conversation this user is a party to (as buyer or as seller),
 * newest activity first, with the other participant's name, the listing
 * it's about, a preview of the latest message, and whether it's unread for
 * this user. Three queries total regardless of conversation count — no
 * self-join against `users` (this schema doesn't use table aliases
 * anywhere else), just a batch lookup of the "other party" ids and the
 * latest message per thread. Powers /messages. */
export async function getConversationsForUser(userId: number) {
  const rows = await db
    .select({
      id: conversations.id,
      listingId: conversations.listingId,
      listingTitle: listings.title,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      buyerReadAt: conversations.buyerReadAt,
      sellerReadAt: conversations.sellerReadAt,
      lastMessageAt: conversations.lastMessageAt,
    })
    .from(conversations)
    .innerJoin(listings, eq(conversations.listingId, listings.id))
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
    .orderBy(desc(conversations.lastMessageAt));

  if (rows.length === 0) return [];

  const otherPartyIds = Array.from(new Set(rows.map((r) => (r.buyerId === userId ? r.sellerId : r.buyerId))));
  const otherParties = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, otherPartyIds));
  const nameById = new Map(otherParties.map((u) => [u.id, u.name]));

  const conversationIds = rows.map((r) => r.id);
  const recentMessages = await db
    .select({ conversationId: chatMessages.conversationId, body: chatMessages.body, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(inArray(chatMessages.conversationId, conversationIds))
    .orderBy(desc(chatMessages.createdAt));
  // Keep only the newest row per conversation — cheaper than a per-thread
  // "ORDER BY ... LIMIT 1" subquery for what's normally a short list.
  const lastMessageByConvo = new Map<number, { body: string; createdAt: string }>();
  for (const m of recentMessages) {
    if (!lastMessageByConvo.has(m.conversationId)) lastMessageByConvo.set(m.conversationId, m);
  }

  return rows.map((r) => {
    const isBuyer = r.buyerId === userId;
    const myReadAt = isBuyer ? r.buyerReadAt : r.sellerReadAt;
    const last = lastMessageByConvo.get(r.id);
    return {
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.listingTitle,
      role: isBuyer ? ("buyer" as const) : ("seller" as const),
      otherPartyName: nameById.get(isBuyer ? r.sellerId : r.buyerId) ?? "Unknown user",
      lastMessageAt: r.lastMessageAt,
      lastMessagePreview: last?.body ?? null,
      unread: !myReadAt || r.lastMessageAt > myReadAt,
    };
  });
}

/** How many of this user's conversations have unseen activity — the badge
 * next to the "Messages" link in the header. A leaner version of the unread
 * computation above: no listing join, no other-party names, no message
 * preview, since the header only needs a count and renders on every page
 * load. */
export async function getUnreadConversationCountForUser(userId: number): Promise<number> {
  const rows = await db
    .select({
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      buyerReadAt: conversations.buyerReadAt,
      sellerReadAt: conversations.sellerReadAt,
      lastMessageAt: conversations.lastMessageAt,
    })
    .from(conversations)
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)));

  return rows.filter((r) => {
    const myReadAt = r.buyerId === userId ? r.buyerReadAt : r.sellerReadAt;
    return !myReadAt || r.lastMessageAt > myReadAt;
  }).length;
}

/** One conversation's full detail for the /messages/[id] thread page —
 * listing + both participants' ids/names, so the page can render "chatting
 * with Priya about Spacious 3BHK..." and figure out which side the current
 * viewer is on. Returns undefined if the id doesn't exist; the page itself
 * is responsible for checking the viewer is actually one of the two
 * participants (or an admin) before showing anything. */
export async function getConversationDetail(conversationId: number) {
  const convo = await db.query.conversations.findFirst({ where: eq(conversations.id, conversationId) });
  if (!convo) return undefined;

  const [listing, buyer, seller] = await Promise.all([
    db.query.listings.findFirst({ where: eq(listings.id, convo.listingId) }),
    db.query.users.findFirst({ where: eq(users.id, convo.buyerId) }),
    db.query.users.findFirst({ where: eq(users.id, convo.sellerId) }),
  ]);

  return {
    ...convo,
    listingTitle: listing?.title ?? "Listing no longer exists",
    buyerName: buyer?.name ?? "Unknown user",
    sellerName: seller?.name ?? "Unknown user",
  };
}

/** Every message in one thread, oldest first (chat reads top-to-bottom). */
export async function getMessagesForConversation(conversationId: number) {
  return db
    .select({ id: chatMessages.id, senderId: chatMessages.senderId, body: chatMessages.body, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt));
}

// ---- Scheduled viewings (video-call or in-person) ----
//
// startsAt is stored as a UTC ISO instant everywhere below — every query
// just hands it back as-is; converting it to "your local time" vs "IST" is
// entirely a rendering concern (see components/LocalTime.tsx), not
// something any of these queries need to do.

/** Every future, still-open slot for one listing, soonest first — what a
 * buyer sees as "pick a time" on the listing page. Past slots are excluded
 * even if never explicitly cancelled (an owner who opens a slot and lets it
 * lapse shouldn't leave a stale, unbookable time on the page). */
export async function getUpcomingOpenSlotsForListing(listingId: number) {
  return db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      durationMinutes: availabilitySlots.durationMinutes,
      meetingType: availabilitySlots.meetingType,
    })
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.listingId, listingId),
        eq(availabilitySlots.status, "open"),
        sql`${availabilitySlots.startsAt} > datetime('now')`
      )
    )
    .orderBy(asc(availabilitySlots.startsAt));
}

/** Every slot an owner/agent has ever opened for one of their listings —
 * open, booked (with the buyer's name/note), and cancelled — for the
 * /dashboard/listings/[id]/availability management page. Past slots stay
 * visible here (unlike the buyer-facing query above) so an owner can still
 * see who booked a viewing that's already happened. */
export async function getSlotsForOwnerListing(listingId: number) {
  const rows = await db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      durationMinutes: availabilitySlots.durationMinutes,
      meetingType: availabilitySlots.meetingType,
      status: availabilitySlots.status,
      buyerId: availabilitySlots.buyerId,
      buyerNote: availabilitySlots.buyerNote,
    })
    .from(availabilitySlots)
    .where(eq(availabilitySlots.listingId, listingId))
    .orderBy(asc(availabilitySlots.startsAt));

  const buyerIds = Array.from(new Set(rows.map((r) => r.buyerId).filter((id): id is number => id != null)));
  const buyers = buyerIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, buyerIds))
    : [];
  const buyerById = new Map(buyers.map((b) => [b.id, b]));

  return rows.map((r) => ({ ...r, buyer: r.buyerId != null ? (buyerById.get(r.buyerId) ?? null) : null }));
}

/** One slot by id, with its listing's title and ownerId — used by the
 * book/cancel actions to check who's allowed to do what without re-deriving
 * listing ownership separately. */
export async function getSlotDetail(slotId: number) {
  const slot = await db.query.availabilitySlots.findFirst({ where: eq(availabilitySlots.id, slotId) });
  if (!slot) return undefined;
  const listing = await db.query.listings.findFirst({ where: eq(listings.id, slot.listingId) });
  return { ...slot, listingTitle: listing?.title ?? "Listing no longer exists" };
}

/** A buyer's own upcoming (future, still-booked) viewings across every
 * listing — the "Your upcoming viewings" block on the dashboard. */
export async function getUpcomingBookingsForBuyer(buyerId: number) {
  return db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      durationMinutes: availabilitySlots.durationMinutes,
      meetingType: availabilitySlots.meetingType,
      listingId: listings.id,
      listingTitle: listings.title,
    })
    .from(availabilitySlots)
    .innerJoin(listings, eq(availabilitySlots.listingId, listings.id))
    .where(
      and(
        eq(availabilitySlots.buyerId, buyerId),
        eq(availabilitySlots.status, "booked"),
        sql`${availabilitySlots.startsAt} > datetime('now')`
      )
    )
    .orderBy(asc(availabilitySlots.startsAt));
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
      featured: projects.featured,
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

// Homepage counterpart to getFeaturedListings above — same idea (admin-set
// featured flag, newest first) but for projects, powering the "Featured
// projects" section below "Featured listings" on the homepage.
export async function getFeaturedProjects(limit = 6) {
  return db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      locality: projects.locality,
      city: projects.city,
      propertyType: projects.propertyType,
      constructionStatus: projects.constructionStatus,
      minAreaSqft: projects.minAreaSqft,
      maxAreaSqft: projects.maxAreaSqft,
      bhkOptions: projects.bhkOptions,
      possessionYear: projects.possessionYear,
      reraApprovalYear: projects.reraApprovalYear,
      imageUrl: firstProjectImageSubquery,
      saleListings: activeListingCountSubquery("sale"),
      rentListings: activeListingCountSubquery("rent"),
      minSalePrice: minListingPriceSubquery("sale"),
      minRentPrice: minListingPriceSubquery("rent"),
    })
    .from(projects)
    .where(eq(projects.featured, true))
    .orderBy(desc(projects.createdAt))
    .limit(limit);
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
// Falls back to the same 500 that schema.ts's column default uses, kept as
// one named constant so the "table row missing" catch-branch below and the
// column default never drift apart.
const DEFAULT_FEATURED_CREDIT_PRICE_RUPEES = 500;
// Kept as one named constant, same reasoning as DEFAULT_FEATURED_CREDIT_PRICE_RUPEES
// above — must match schema.ts's column default for defaultMonthlyListingLimit.
const DEFAULT_MONTHLY_LISTING_LIMIT = 20;

export async function getSiteSettings(): Promise<{
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  dashboardBannerImageUrl: string | null;
  dashboardBannerLinkUrl: string | null;
  featuredCreditPriceRupees: number;
  defaultMonthlyListingLimit: number;
}> {
  try {
    const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.id, 1) });
    return {
      logoUrl: row?.logoUrl ?? null,
      faviconUrl: row?.faviconUrl ?? null,
      heroImageUrl: row?.heroImageUrl ?? null,
      dashboardBannerImageUrl: row?.dashboardBannerImageUrl ?? null,
      dashboardBannerLinkUrl: row?.dashboardBannerLinkUrl ?? null,
      featuredCreditPriceRupees: row?.featuredCreditPriceRupees ?? DEFAULT_FEATURED_CREDIT_PRICE_RUPEES,
      defaultMonthlyListingLimit: row?.defaultMonthlyListingLimit ?? DEFAULT_MONTHLY_LISTING_LIMIT,
    };
  } catch {
    return {
      logoUrl: null,
      faviconUrl: null,
      heroImageUrl: null,
      dashboardBannerImageUrl: null,
      dashboardBannerLinkUrl: null,
      featuredCreditPriceRupees: DEFAULT_FEATURED_CREDIT_PRICE_RUPEES,
      defaultMonthlyListingLimit: DEFAULT_MONTHLY_LISTING_LIMIT,
    };
  }
}

// ---- Monthly listing-post limit (users.monthlyListingLimitOverride /
// siteSettings.defaultMonthlyListingLimit / listingPostLog) ----

function toSqliteUtcDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// Fixed UTC calendar month — every user's quota resets on the 1st at once,
// same convention as getPageViewStats' "this month" bucket above.
function startOfCurrentMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function nextMonthlyLimitResetDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/** How many listings `userId` has posted since the start of this calendar
 * month — counted from the permanent listingPostLog, not the live
 * `listings` table, so deleting a listing never frees up a slot (see that
 * table's schema comment). */
export async function getMonthlyPostCount(userId: number): Promise<number> {
  const since = toSqliteUtcDateTime(startOfCurrentMonthUtc());
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(listingPostLog)
    .where(and(eq(listingPostLog.userId, userId), sql`${listingPostLog.postedAt} >= ${since}`));
  return row?.n ?? 0;
}

/** This month's post count for every user who has posted at all this month,
 * in one query — used by the admin Users page so it isn't one query per
 * row. Users with 0 posts this month simply won't have a key here. */
export async function getMonthlyPostCountsByUser(): Promise<Record<number, number>> {
  const since = toSqliteUtcDateTime(startOfCurrentMonthUtc());
  const rows = await db
    .select({ userId: listingPostLog.userId, n: sql<number>`count(*)` })
    .from(listingPostLog)
    .where(sql`${listingPostLog.postedAt} >= ${since}`)
    .groupBy(listingPostLog.userId);
  return Object.fromEntries(rows.map((r) => [r.userId, r.n]));
}

/** null override means "use the site-wide default admin set in Settings". */
export async function getEffectiveMonthlyLimit(monthlyListingLimitOverride: number | null): Promise<number> {
  if (monthlyListingLimitOverride != null) return monthlyListingLimitOverride;
  const { defaultMonthlyListingLimit } = await getSiteSettings();
  return defaultMonthlyListingLimit;
}

/** Full quota picture for one user — used by both the post-listing page
 * (to show/block before the form even renders) and createListingAction (to
 * reject the actual submit, since the page-level check alone can't stop a
 * direct form post). Never call this for an admin — admins have no cap at
 * all, checked by the caller before reaching here. */
export async function getListingQuotaStatus(user: {
  id: number;
  monthlyListingLimitOverride: number | null;
}): Promise<{ used: number; limit: number; remaining: number; reachedLimit: boolean; resetsAt: Date }> {
  const [used, limit] = await Promise.all([
    getMonthlyPostCount(user.id),
    getEffectiveMonthlyLimit(user.monthlyListingLimitOverride),
  ]);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    reachedLimit: used >= limit,
    resetsAt: nextMonthlyLimitResetDate(),
  };
}

// ---- Legal pages (Terms of Use / Privacy Policy / Cookie Policy / NRI Guide) ----

// Fixed display order regardless of insertion order (matches the footer's
// "NRI Guide | Terms of Use | Privacy Policy | Cookie Policy" layout) — the
// NRI guide leads since, unlike the other three, it's content someone would
// actually seek out rather than boilerplate they skim past.
const LEGAL_PAGE_ORDER = ["nri-guide", "terms", "privacy", "cookies"] as const;
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
      staleNudgeSentAt: listings.staleNudgeSentAt,
      createdAt: listings.createdAt,
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

// ---- SEO: sitemap.xml (src/app/sitemap.ts) ----
//
// Deliberately lean id/slug + timestamp-only selects — the sitemap only
// needs a URL and a last-modified date per row, not the owner/image joins
// getListingById/getProjectById do for the actual page render.
//
// Same build-time "no such table" tolerance as getSiteSettings/getLegalPages
// above: `next build` opens the sqlite file just to collect route metadata,
// against a throwaway schema-less database (see Dockerfile's builder stage
// comment), and sitemap.ts's default export runs as part of that — without
// this try/catch a fresh build would fail outright rather than just shipping
// an empty section of the sitemap for that one run.
export async function getActiveListingsForSitemap() {
  try {
    return await db
      .select({ id: listings.id, createdAt: listings.createdAt })
      .from(listings)
      .where(eq(listings.status, "active"));
  } catch {
    return [];
  }
}

export async function getProjectsForSitemap() {
  try {
    return await db.select({ id: projects.id, slug: projects.slug, createdAt: projects.createdAt }).from(projects);
  } catch {
    return [];
  }
}

export async function getPublishedBlogPostsForSitemap() {
  try {
    return await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));
  } catch {
    return [];
  }
}

// ---- Locality/area guides (admin-editable, see schema.ts's own comment) ----

export async function getPublishedLocalityGuides() {
  return db
    .select({
      id: localityGuides.id,
      slug: localityGuides.slug,
      name: localityGuides.name,
      title: localityGuides.title,
      excerpt: localityGuides.excerpt,
      heroImageUrl: localityGuides.heroImageUrl,
      displayOrder: localityGuides.displayOrder,
    })
    .from(localityGuides)
    .where(eq(localityGuides.status, "published"))
    .orderBy(asc(localityGuides.displayOrder), asc(localityGuides.name));
}

export async function getLocalityGuideBySlug(slug: string) {
  const guide = await db.query.localityGuides.findFirst({ where: eq(localityGuides.slug, slug) });
  if (!guide) return null;
  const author = guide.authorId ? await db.query.users.findFirst({ where: eq(users.id, guide.authorId) }) : null;
  return { ...guide, author };
}

export async function getAllLocalityGuidesForAdmin() {
  return db
    .select({
      id: localityGuides.id,
      name: localityGuides.name,
      slug: localityGuides.slug,
      status: localityGuides.status,
      displayOrder: localityGuides.displayOrder,
      createdAt: localityGuides.createdAt,
      publishedAt: localityGuides.publishedAt,
    })
    .from(localityGuides)
    .orderBy(asc(localityGuides.displayOrder), desc(localityGuides.createdAt));
}

export async function getLocalityGuideForAdminEdit(id: number) {
  return db.query.localityGuides.findFirst({ where: eq(localityGuides.id, id) });
}

export async function getPublishedLocalityGuidesForSitemap() {
  try {
    return await db
      .select({ slug: localityGuides.slug, updatedAt: localityGuides.updatedAt })
      .from(localityGuides)
      .where(eq(localityGuides.status, "published"));
  } catch {
    return [];
  }
}

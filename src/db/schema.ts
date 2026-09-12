import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["buyer", "agent", "seller", "admin"] })
    .notNull()
    .default("buyer"),
  phone: text("phone"),
  agencyName: text("agency_name"),
  // "google" accounts get a random unusable passwordHash (see lib/auth.ts) so the
  // column can stay NOT NULL without a migration; password login is rejected for
  // them with a clear message instead of a confusing wrong-password error.
  authProvider: text("auth_provider", { enum: ["password", "google"] })
    .notNull()
    .default("password"),
  googleId: text("google_id").unique(),
  // Set once this account's phone (above) has been confirmed via a one-time
  // SMS code (see src/lib/sms.ts, phoneOtps below, and the OTP actions in
  // src/app/actions.ts) — this is what backs the "Phone Verified" badge shown
  // next to a listing owner's contact number, distinct from the admin-only
  // `listings.verified` flag which is a full manual review. Re-verification
  // is required if the phone number itself is later changed (see
  // adminUpdateUserAction / any future self-service profile edit — both must
  // reset this to false when `phone` changes).
  phoneVerified: integer("phone_verified", { mode: "boolean" }).notNull().default(false),
  phoneVerifiedAt: text("phone_verified_at"),
  // Balance of "make a listing featured" credits this user has bought but
  // not yet spent — see creditOrders below for the purchase history and
  // featureListingWithCreditAction/adminToggleFeaturedAction (app/actions.ts
  // and admin/actions.ts) for the two ways featured actually gets set.
  // Spending one is an atomic conditional decrement (only when > 0) rather
  // than a plain read-then-write, so two rapid clicks — or a click racing a
  // webhook credit — can never send this negative.
  featuredCredits: integer("featured_credits").notNull().default(0),
  // Per-user override of siteSettings.defaultMonthlyListingLimit (see
  // listingPostLog below, and createListingAction/getListingQuotaStatus for
  // where this actually gets enforced). Null means "use the site-wide
  // default" — this column exists only to grant a specific user a
  // different cap (higher for a trusted power agent, lower/zero to rein in
  // someone), not to store the site default itself.
  monthlyListingLimitOverride: integer("monthly_listing_limit_override"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Short-lived one-time codes for phone verification (see phoneVerified
// above). One row per OTP request — never overwritten in place, so a user
// mashing "resend" just creates more rows, each independently rate-limited
// and expired; only the most recent unconsumed, unexpired one for a given
// user+phone is ever accepted by verifyPhoneOtpAction. The code itself is
// never stored in plain text (see lib/sms.ts's hashOtpCode) so a database
// leak alone can't be used to complete someone else's verification.
export const phoneOtps = sqliteTable("phone_otps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Digits-only, country-code-prefixed (e.g. "919848011223") — see
  // normalizePhoneForOtp in lib/sms.ts. Stored per-row (not just read from
  // users.phone) so a code sent to one number can't later be used to verify
  // a different number the user typed in after a mistake.
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// A "Project" is a developer-built community (e.g. "My Home Udyan") — admin
// managed, with its own gallery/facts/amenities page. Individual listings
// (below) can optionally belong to one, the way a resale or rental unit
// inside a large gated community is still its own listing but is also part
// of that community's page. A listing with no project is a standalone
// resale/owner listing, same as before this existed.
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // URL-friendly identifier for the public /projects/[slug] page (e.g.
  // "aparna-cyber-heights"), generated from name at creation time — see
  // uniqueProjectSlug() in admin/actions.ts. Nullable at the DB level (a
  // brand-new column on an existing table can't retroactively be NOT NULL
  // for old rows) even though the app always sets one on create; projects
  // that pre-date this column get one filled in by
  // src/db/ensure-project-slugs.ts at container start. A unique index still
  // applies — SQLite treats multiple NULLs there as distinct, so it doesn't
  // block on not-yet-backfilled rows.
  slug: text("slug").unique(),
  developerName: text("developer_name"),
  developerUrl: text("developer_url"),
  locality: text("locality").notNull(),
  city: text("city").notNull().default("Hyderabad"),
  // Auto-filled by geocoding the locality/city text (see src/lib/geocode.ts)
  // whenever a project is created or its locality/city changes — never set
  // by hand. Null just means "no pin yet" (geocoding failed, or hasn't run
  // yet on older rows) — every other feature works fine without it.
  latitude: real("latitude"),
  longitude: real("longitude"),
  propertyType: text("property_type", {
    enum: ["apartment", "villa", "independent_house", "plot", "commercial"],
  })
    .notNull()
    .default("apartment"),
  constructionStatus: text("construction_status", {
    enum: ["under_construction", "ready_to_move"],
  })
    .notNull()
    .default("under_construction"),
  areaAcres: real("area_acres"),
  totalUnits: integer("total_units"),
  towers: integer("towers"),
  maxFloors: integer("max_floors"),
  unitsPerFloor: text("units_per_floor"), // free text — often a range, e.g. "8-10"
  minAreaSqft: integer("min_area_sqft"),
  maxAreaSqft: integer("max_area_sqft"),
  bhkOptions: text("bhk_options"), // comma-separated, e.g. "2,2.5,3,4" (Indian listings do use half-BHK)
  // The actual Telangana RERA registration number (e.g.
  // "P02400001234"), as opposed to reraApprovalYear below which is just the
  // year — this is what lets a visitor independently verify the project on
  // https://rera.telangana.gov.in themselves rather than taking the badge on
  // faith. Free text (not validated against a fixed pattern) since RERA
  // number formats have varied over the years; shown as plain text with a
  // link to the portal's search page, never auto-verified against it.
  reraNumber: text("rera_number"),
  reraApprovalYear: integer("rera_approval_year"),
  possessionYear: integer("possession_year"),
  unitDensityPerAcre: integer("unit_density_per_acre"),
  floorAreaRatio: real("floor_area_ratio"),
  description: text("description"),
  amenities: text("amenities"), // JSON-encoded string[] of amenity keys — see lib/amenities.ts
  brochureUrl: text("brochure_url"),
  // Admin-only, same YouTube/Vimeo-only validation as blogPosts.videoUrl — see
  // lib/video.ts's getVideoEmbedUrl.
  videoUrl: text("video_url"),
  // Same shape as listings.contactPhone/whatsappEnabled — a project-level
  // contact number (e.g. the developer's sales desk) shown as a "Connect on
  // WhatsApp" button on the public project page. Deliberately separate from
  // any individual listing's contact details.
  contactPhone: text("contact_phone"),
  whatsappEnabled: integer("whatsapp_enabled", { mode: "boolean" }).notNull().default(false),
  // Same idea as listings.featured — admin-set, surfaces the project in the
  // "Featured projects" section on the homepage (see queries.ts's
  // getFeaturedProjects). Defaults to false so nothing appears there until an
  // admin deliberately picks it, same as featured listings.
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const projectImages = sqliteTable("project_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in INR
  listingType: text("listing_type", { enum: ["sale", "rent"] }).notNull(),
  propertyType: text("property_type", {
    enum: ["apartment", "villa", "independent_house", "plot", "commercial"],
  }).notNull(),
  bhk: integer("bhk"),
  bathrooms: integer("bathrooms"),
  carParking: integer("car_parking"),
  areaSqft: integer("area_sqft"),
  locality: text("locality").notNull(),
  city: text("city").notNull().default("Hyderabad"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id),
  // Optional — a listing keeps existing fine with no project (a plain resale
  // or owner listing). Deliberately not cascade-on-delete: removing a project
  // should detach its listings, not delete other people's listings.
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  // "expired" means "nobody confirmed this is still available" — either an
  // owner said so explicitly or the stale-listing check gave up waiting (see
  // autoFlaggedStaleAt above) — distinct from "sold"/"rented" (a completed
  // transaction) and "pending" (an owner/admin-initiated pause). Treated
  // exactly like "pending" everywhere that filters for `status = "active"`;
  // this is a TEXT column with no DB-level CHECK constraint, so adding this
  // value needed no migration, only this type update.
  status: text("status", { enum: ["active", "pending", "sold", "rented", "expired"] })
    .notNull()
    .default("active"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  // Admin-only trust signal — never set by the listing owner. Defaults to
  // false/"Not Verified" for every listing until an admin reviews and flips it.
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  // Per-listing contact details, separate from the owner's account phone
  // (users.phone) — a seller/agent may want a different number for a
  // specific property. whatsappEnabled gates whether the "Connect on
  // WhatsApp" button renders; contactPhone alone still shows as a plain
  // callable number.
  contactPhone: text("contact_phone"),
  whatsappEnabled: integer("whatsapp_enabled", { mode: "boolean" }).notNull().default(false),
  // Unit-level detail fields (matches the brokerage's internal inventory
  // sheet format) — all optional since plots/villas/standalone listings
  // don't have a tower/unit/floor. Which of these show on the public listing
  // page vs. the post-listing form is admin-configurable (see
  // listingFieldSettings below / lib/listingFields.ts); admin's own edit
  // form always shows all of them regardless.
  towerName: text("tower_name"),
  unitNumber: text("unit_number"),
  unitFloor: integer("unit_floor"),
  facing: text("facing", {
    enum: ["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"],
  }),
  furnishingStatus: text("furnishing_status", { enum: ["unfurnished", "semi_furnished", "fully_furnished"] }),
  inventoryState: text("inventory_state", { enum: ["new", "resale"] }).notNull().default("new"),
  // Internal negotiation figures, separate from the public "price" — hidden
  // from the public listing page by default (see listingFieldSettings)
  // since they're sensitive seller/negotiation info, not for buyers.
  sellerAskPrice: integer("seller_ask_price"),
  sellerBestPrice: integer("seller_best_price"),
  cashRatioPercent: integer("cash_ratio_percent"),
  // JSON-encoded string[] of amenityCatalog keys — same shape/encoding as
  // projects.amenities (see lib/amenities.ts's parseAmenities). Whether this
  // shows on the public listing page / post-listing form is admin-configurable
  // like the other listingFieldSettings-gated fields above.
  amenities: text("amenities"),
  // Settable both by the poster (post-listing form, at creation) and by an
  // admin (anytime, via the admin edit form) — unlike the unit-detail fields
  // above, not gated by listingFieldSettings; always shown when present, same
  // treatment as contactPhone/whatsappEnabled. Same YouTube/Vimeo-only
  // validation as projects.videoUrl / blogPosts.videoUrl (lib/video.ts).
  videoUrl: text("video_url"),
  views: integer("views").notNull().default(0),
  // Staleness tracking for the "still available?" nudge (see
  // src/lib/staleListings.ts and src/instrumentation.ts) — fake/abandoned
  // listings that never get taken down are one of the most common
  // complaints about Indian property portals, so an "active" listing that's
  // gone quiet gets checked on rather than left to rot indefinitely.
  // lastConfirmedAt starts at creation time and is bumped either by the
  // owner clicking "Yes, still available" (in the nudge email or their
  // dashboard) or by any edit they make to the listing — anything that
  // shows a human is still paying attention to it. No DB-level default:
  // SQLite's ALTER TABLE ADD COLUMN flatly rejects CURRENT_TIMESTAMP-style
  // defaults (only literal constants are allowed there, unlike CREATE
  // TABLE), so every insert path sets this explicitly instead (see
  // createListingAction / adminCreateListingAction) — every code path that
  // reads it treats a still-null row (only possible on very old data from
  // before this column existed) the same as "use createdAt" (see
  // staleListings.ts).
  lastConfirmedAt: text("last_confirmed_at"),
  // Set when the nudge email goes out; cleared back to null whenever
  // lastConfirmedAt is bumped. A non-null value that's more than
  // STALE_AUTO_FLAG_AFTER_DAYS old (see staleListings.ts) is what triggers
  // the automatic flip to status "expired" below.
  staleNudgeSentAt: text("stale_nudge_sent_at"),
  // Set only when staleListings.ts itself flips the status to "expired"
  // after a nudge went unanswered — left null when an owner explicitly
  // clicks "No, no longer available", so the admin listings page can tell
  // apart "we gave up waiting" from "the owner told us". Cleared whenever
  // the listing is reconfirmed.
  autoFlaggedStaleAt: text("auto_flagged_stale_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const listingImages = sqliteTable("listing_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Homepage category tiles ("New listings", "Homes for sale", ...). These used
// to be hardcoded in queries.ts with an auto-picked listing photo as the tile
// image — which meant the image changed underneath the admin and occasionally
// pointed at a broken/unexpected photo. Now they're rows an admin manages
// directly (own image + destination link), so the homepage always shows
// exactly what the admin set.
export const homeTiles = sqliteTable("home_tiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  href: text("href").notNull(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Singleton row (id is always 1) holding site-wide branding an admin can
// change without a redeploy: the header logo image, the browser favicon, and
// the homepage hero background photo. All nullable — null means "use the
// built-in default" (the text wordmark logo, the default green-H favicon
// shipped in public/, and the default illustrated skyline hero image).
export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  heroImageUrl: text("hero_image_url"),
  // Optional promo banner shown on the logged-in dashboard page only (see
  // DashboardBanner.tsx) — e.g. "list with an agent" or a partner offer.
  // Fully admin-controlled (not self-serve for owners/agents): a plain
  // image + destination link, no ad-network integration. Null image means
  // "don't show a banner at all", which is also the default until an admin
  // uploads one.
  dashboardBannerImageUrl: text("dashboard_banner_image_url"),
  dashboardBannerLinkUrl: text("dashboard_banner_link_url"),
  // Price (in INR) an owner/agent pays per "featured listing" credit — see
  // users.featuredCredits and creditOrders below. Snapshotted onto each
  // creditOrders row at purchase time, so changing this later never alters
  // the amount of an order already created (paid or not).
  featuredCreditPriceRupees: integer("featured_credit_price_rupees").notNull().default(500),
  // How many listings a user can post per calendar month before
  // createListingAction starts rejecting new ones (see
  // users.monthlyListingLimitOverride for the per-user exception, and
  // listingPostLog below for how "posted this month" is actually counted).
  // Applies to every agent/owner account that doesn't have its own
  // override; admins are never subject to this at all.
  defaultMonthlyListingLimit: integer("default_monthly_listing_limit").notNull().default(20),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// One row per attempted featured-credit purchase (see
// createFeaturedCreditOrderAction in app/actions.ts) — created the moment a
// Razorpay order is opened, before any payment has actually happened, so
// every checkout attempt is auditable regardless of whether it's ever
// completed. `status` only ever moves created -> paid or created -> failed,
// never backwards. Crediting users.featuredCredits happens exactly once,
// gated on this row's status still being "created" at update time (see
// verifyFeaturedCreditPaymentAction and the /api/payments/razorpay/webhook
// route, which both race to be the one that marks it paid — whichever gets
// there first wins, the other is a no-op) — that's what makes it safe for
// both the client-side confirmation and the webhook to attempt the same
// credit without ever double-crediting a purchase.
export const creditOrders = sqliteTable("credit_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  quantity: integer("quantity").notNull(),
  amountRupees: integer("amount_rupees").notNull(),
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  status: text("status", { enum: ["created", "paid", "failed"] }).notNull().default("created"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  paidAt: text("paid_at"),
});

// Permanent, append-only record of every listing a user has ever posted —
// exists solely to enforce the monthly posting limit (see
// users.monthlyListingLimitOverride / siteSettings.defaultMonthlyListingLimit
// and createListingAction / db/queries.ts's getMonthlyPostCount). Rows here
// are NEVER derived from or kept in sync with the live `listings` table: a
// row stays right where it is even after that listing is deleted, edited,
// or expires, specifically so deleting a listing and reposting it can't be
// used to dodge the cap. `listingId` is kept only so an admin can trace a
// log entry back to the listing it came from when it still exists — it
// plays no part in the quota count itself (only the presence of the row,
// keyed by user + month, does), and is nulled out (not cascaded away) if
// that listing is later deleted.
export const listingPostLog = sqliteTable("listing_post_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "set null" }),
  postedAt: text("posted_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Legal/policy pages (Terms of Use, Privacy Policy, Cookie Policy) shown in
// the footer, at fixed routes (/terms, /privacy, /cookies). The route and
// slug are fixed; title and body content are admin-editable from
// /admin/legal-pages. Content is stored as plain text (paragraphs separated
// by a blank line, "## " starts a heading) — see components/LegalContent —
// deliberately not HTML, so admin-authored text can never inject markup.
export const legalPages = sqliteTable("legal_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // "nri-guide" isn't legal boilerplate like the other three, but it's the
  // same shape of content (one long-form page, admin-edited as plain text
  // with "## " section headings, rendered by components/LegalContent.tsx) —
  // reusing this table avoids standing up a whole second CMS pattern (like
  // locality_guides) for what is, structurally, a single static page.
  slug: text("slug", { enum: ["terms", "privacy", "cookies", "nri-guide"] }).notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Social media links shown in the header and footer. Admin-managed rows —
// any number can be added, edited, reordered, or removed from
// /admin/social-links. `platform` picks which icon renders (see
// lib/social.ts / components/SocialIcon.tsx); "other" covers any platform
// outside that fixed icon set (rendered with a generic link/globe icon).
export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform", {
    enum: ["x", "linkedin", "instagram", "facebook", "youtube", "whatsapp", "other"],
  })
    .notNull()
    .default("other"),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Admin-managed locality suggestions — shown as the homepage's "Popular
// localities" pills and offered as <datalist> autocomplete when typing a
// listing's or project's locality (see lib/localities.ts's HYDERABAD_LOCALITIES,
// which now only seeds this table's starting rows, and every place that used
// to import that constant directly). Deliberately NOT a foreign key from
// listings.locality/projects.locality — those stay plain free-text columns,
// so adding, renaming, or deleting a row here never touches any existing
// listing or project; it only changes what's suggested going forward.
export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Master catalog of amenity types selectable when tagging a listing with its
// amenities (see listings.amenities below). Seeded once from the original
// fixed AMENITIES list in lib/amenities.ts (see ensure-amenity-catalog.ts) —
// same relationship as HYDERABAD_LOCALITIES -> locations above. Beyond the
// seed, an admin can add further custom amenities directly from the listing
// form (see resolveListingAmenities() in admin/actions.ts), and they
// immediately become selectable for every other listing too. No icon column —
// a custom amenity just renders with the generic fallback icon (see
// iconForAmenity() in lib/amenities.ts).
export const amenityCatalog = sqliteTable("amenity_catalog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Singleton row (id always 1) storing admin-configured show/hide toggles for
// the "extra" listing fields (lib/listingFields.ts LISTING_EXTRA_FIELDS) —
// per field, whether it shows on the public listing page and/or on the
// post-listing form. Stored as one JSON blob rather than a column per field
// so adding/removing a field later never needs a migration; missing entries
// just fall back to that field's coded default (see resolveFieldVisibility).
export const listingFieldSettings = sqliteTable("listing_field_settings", {
  id: integer("id").primaryKey(),
  config: text("config").notNull().default("{}"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Blog posts — admin-authored articles at /blog and /blog/[slug]. Body
// content is rich text (bold/italic/links/lists/headings), authored with the
// admin's rich text editor and saved as sanitized HTML (see
// lib/sanitizeHtml.ts) — sanitized again on every render as defense in
// depth, so a bug in the editor (or a compromised admin account) can never
// get a <script> onto the page. Video is a YouTube/Vimeo link only, not an
// uploaded file — keeps large media off this box's limited disk; the cover
// photo and optional gallery use the same upload pipeline as listing/project
// photos.
export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  category: text("category").notNull().default("General"),
  coverImageUrl: text("cover_image_url"),
  videoUrl: text("video_url"),
  contentHtml: text("content_html").notNull().default(""),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  publishedAt: text("published_at"),
  // A running counter, bumped once per page_views row recorded against this
  // post (see recordPageViewAction) — kept denormalized so the front-end post
  // page and the admin blog list can show a view count with a plain column
  // read instead of aggregating page_views on every render.
  viewCount: integer("view_count").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const blogImages = sqliteTable("blog_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => blogPosts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Admin-editable locality/area guide pages (e.g. "Gachibowli", "Kokapet") —
// same shape as blogPosts on purpose (slug, status, contentHtml sanitized
// with the same allowlist, publishedAt stamped once) since it's the same
// "admin writes long-form content, public reads it" pattern, just under
// /areas instead of /blog. Exists mainly for local SEO: a locality name is
// exactly what someone searches before they ever look at a specific
// listing, so a well-written page here can rank and pull them in before
// they've picked a property. metroConnectivity/orrAccess/upcomingInfra are
// short, separately-editable notes shown as a highlights strip at the top
// of the page — kept apart from the free-form contentHtml body so an admin
// can update "which metro line serves this" without hunting for it inside a
// long article.
export const localityGuides = sqliteTable("locality_guides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  heroImageUrl: text("hero_image_url"),
  // Same YouTube/Vimeo-only validation as blogPosts.videoUrl (see lib/video.ts)
  // — an optional short video (drone flyover, walkthrough) shown above the
  // write-up once an admin adds a link; renders nothing when null.
  videoUrl: text("video_url"),
  metroConnectivity: text("metro_connectivity"),
  orrAccess: text("orr_access"),
  upcomingInfra: text("upcoming_infra"),
  contentHtml: text("content_html").notNull().default(""),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  // Manual ordering for the /areas index — locality guides don't have a
  // natural publish-date ordering that matters to a reader the way blog
  // posts do, so the admin picks the order explicitly instead.
  displayOrder: integer("display_order").notNull().default(0),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Comments — logged-in users only, no anonymous/guest comments. New
// comments start "pending" and stay hidden from the public post until an
// admin approves them from /admin/blog/comments, so spam or abuse never
// lands on the live site unreviewed. Admin can also reject (kept for the
// record, distinct from delete) or delete outright.
export const blogComments = sqliteTable("blog_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => blogPosts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// One row per page load on the public site (see components/ViewTracker.tsx +
// recordPageViewAction) — never recorded for /admin. Powers the admin
// Analytics page: "people on the site right now" (distinct visitorId in the
// last few minutes), and daily/weekly/monthly/yearly page-view totals.
// visitorId is an anonymous, long-lived id set client-side in a non-httpOnly
// cookie purely to dedupe "how many distinct people" — it's never linked to
// a user account, so this table intentionally has no userId column.
export const pageViews = sqliteTable("page_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull(),
  visitorId: text("visitor_id").notNull(),
  blogPostId: integer("blog_post_id").references(() => blogPosts.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  // Set when the listing's owner/agent marks this inquiry as responded to
  // (see markInquiryRespondedAction) — null means still pending. The
  // contact-form inquiry and the in-app chat (conversations/chatMessages
  // below) are separate paths a buyer can use to reach a seller, so this
  // stays a manual "I replied by phone/email" checkbox rather than a real
  // read-receipt; it's what powers the response-rate and response-time
  // stats on /dashboard/inquiries.
  respondedAt: text("responded_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// ---- In-app chat (buyer ↔ seller/agent, per listing) ----
//
// One conversation per (listing, buyer) pair — every message a buyer sends
// about a given listing lands in the same thread rather than starting a new
// one each time, and the seller/agent always replies into that same thread.
// No DB-level uniqueness constraint on (listingId, buyerId): this schema
// otherwise has no composite/multi-column indexes, so the "find existing
// thread or create one" logic lives in getOrCreateConversation (queries.ts)
// instead of introducing that pattern for just this one table. A double
// -submit race would at worst create two threads for the same pair, which
// is harmless (both just show the same listing/buyer context) rather than
// a data-integrity problem.
//
// sellerId is denormalized from the listing's ownerId at creation time
// (listing ownership never changes after posting) purely so "my
// conversations as seller" can filter on conversations.sellerId directly
// instead of joining through listings on every read.
//
// buyerId/sellerId/chatMessages.senderId all cascade on user delete, same
// as blogComments.userId above — there's no admin "delete a user" feature
// today, so this is a not-yet-exercised default rather than a live concern,
// but it matches this schema's existing convention: a required (non-null)
// user reference cascades, a nullable "who authored this" reference (blog
// posts, locality guides) sets null instead.
export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Bumped on every new message so the inbox list can sort "most recently
  // active thread first" with a plain column read instead of a subquery
  // join against chat_messages on every dashboard load.
  lastMessageAt: text("last_message_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  // Each side's own "I've seen messages up to this point" marker, used to
  // compute unread counts (a message is unread if its createdAt is after
  // the reader's *ReadAt). Two separate columns rather than a per-message
  // read receipt table, since a thread only ever has two participants.
  buyerReadAt: text("buyer_read_at"),
  sellerReadAt: text("seller_read_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// ---- Scheduled viewings (video-call or in-person) ----
//
// One row per bookable slot the owner/agent opens up, which doubles as the
// booking itself once a buyer takes it — there's exactly one booking per
// slot, so this is a single table rather than a separate slots + bookings
// pair that would need a 1:1 join on every read. `status` walks
// open -> booked -> (optionally back to open, if the buyer cancels, or ->
// cancelled if the owner cancels it outright).
//
// startsAt is stored as a plain UTC ISO instant (a JS `new Date(...)
// .toISOString()`, same shape as every other *At column here) rather than
// in the owner's local time — that's what makes "show this in whichever
// timezone the viewer's browser is in" (the whole point of this feature for
// NRI buyers) just a client-side Date/Intl formatting concern (see
// components/LocalTime.tsx) instead of something this schema needs to know
// about at all.
//
// buyerId is nullable (only set once booked) and set-null on user delete —
// unlike conversations/chatMessages above, a slot's *existence* belongs to
// the owner, not to whichever buyer (if any) has booked it, so losing the
// buyer account shouldn't cascade-delete the owner's slot.
export const availabilitySlots = sqliteTable("availability_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  // Denormalized from the listing's ownerId at creation time (same
  // rationale as conversations.sellerId above) so "my listings' slots" can
  // filter directly on this column without joining through listings.
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startsAt: text("starts_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  meetingType: text("meeting_type", { enum: ["video_call", "in_person"] })
    .notNull()
    .default("video_call"),
  status: text("status", { enum: ["open", "booked", "cancelled"] })
    .notNull()
    .default("open"),
  buyerId: integer("buyer_id").references(() => users.id, { onDelete: "set null" }),
  // A short note the buyer can leave when booking (e.g. an alternate phone
  // number, or a specific question) — shown to the owner alongside the
  // booking, not a chat thread of its own.
  buyerNote: text("buyer_note"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

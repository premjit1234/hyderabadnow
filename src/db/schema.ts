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
  developerName: text("developer_name"),
  developerUrl: text("developer_url"),
  locality: text("locality").notNull(),
  city: text("city").notNull().default("Hyderabad"),
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
  reraApprovalYear: integer("rera_approval_year"),
  possessionYear: integer("possession_year"),
  unitDensityPerAcre: integer("unit_density_per_acre"),
  floorAreaRatio: real("floor_area_ratio"),
  description: text("description"),
  amenities: text("amenities"), // JSON-encoded string[] of amenity keys — see lib/amenities.ts
  brochureUrl: text("brochure_url"),
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
  status: text("status", { enum: ["active", "pending", "sold", "rented"] })
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
  views: integer("views").notNull().default(0),
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
  updatedAt: text("updated_at")
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
  slug: text("slug", { enum: ["terms", "privacy", "cookies"] }).notNull().unique(),
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

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

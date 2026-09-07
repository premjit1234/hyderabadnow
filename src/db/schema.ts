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

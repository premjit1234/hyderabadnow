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
  status: text("status", { enum: ["active", "pending", "sold", "rented"] })
    .notNull()
    .default("active"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
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

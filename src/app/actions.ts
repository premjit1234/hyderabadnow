"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { users, listings, listingImages, inquiries, blogPosts, blogComments, pageViews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

export type ActionState = { error?: string; success?: string } | null;

const signupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "agent", "seller"]),
  phone: z.string().optional(),
});

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, role, phone } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role, phone })
    .returning();

  await setSessionCookie({ id: user.id, name: user.name, email: user.email, role: user.role as never });
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    return { error: "No account found with that email." };
  }
  if (user.authProvider === "google") {
    return { error: "This account signs in with Google — use the \"Continue with Google\" button above." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  await setSessionCookie({ id: user.id, name: user.name, email: user.email, role: user.role as never });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

const completeProfileSchema = z.object({
  role: z.enum(["buyer", "agent", "seller"]),
  phone: z.string().optional(),
  agencyName: z.string().optional(),
});

// Shown once, right after a brand-new Google sign-up, to collect the account
// type our own signup form normally asks for up front.
export async function completeProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "Your session expired — please sign in again." };
  }

  const parsed = completeProfileSchema.safeParse({
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    agencyName: formData.get("agencyName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { role, phone, agencyName } = parsed.data;
  await db
    .update(users)
    .set({ role, phone, agencyName: role === "agent" ? agencyName : null })
    .where(eq(users.id, session.id));

  await setSessionCookie({ id: session.id, name: session.name, email: session.email, role });
  redirect("/dashboard");
}

const listingSchema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters"),
  description: z.string().min(20, "Add a bit more description (20+ characters)"),
  price: z.coerce.number().int().positive("Enter a valid price"),
  listingType: z.enum(["sale", "rent"]),
  propertyType: z.enum(["apartment", "villa", "independent_house", "plot", "commercial"]),
  bhk: z.coerce.number().int().min(0).max(10).optional(),
  areaSqft: z.coerce.number().int().positive("Enter a valid area"),
  locality: z.string().min(2, "Enter a locality"),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  towerName: z.string().optional(),
  unitNumber: z.string().optional(),
  unitFloor: z.coerce.number().int().optional(),
  facing: z.enum(["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"]).optional(),
  furnishingStatus: z.enum(["unfurnished", "semi_furnished", "fully_furnished"]).optional(),
  inventoryState: z.enum(["new", "resale"]).optional(),
  sellerAskPrice: z.coerce.number().int().positive().optional(),
  sellerBestPrice: z.coerce.number().int().positive().optional(),
  cashRatioPercent: z.coerce.number().int().min(0).max(100).optional(),
});

export async function createListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.role !== "agent" && session.role !== "seller" && session.role !== "admin")) {
    return { error: "Log in as an agent or owner to post a listing." };
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType"),
    bhk: formData.get("bhk") || undefined,
    areaSqft: formData.get("areaSqft"),
    locality: formData.get("locality"),
    address: formData.get("address") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    towerName: formData.get("towerName") || undefined,
    unitNumber: formData.get("unitNumber") || undefined,
    unitFloor: formData.get("unitFloor") || undefined,
    facing: formData.get("facing") || undefined,
    furnishingStatus: formData.get("furnishingStatus") || undefined,
    inventoryState: formData.get("inventoryState") || undefined,
    sellerAskPrice: formData.get("sellerAskPrice") || undefined,
    sellerBestPrice: formData.get("sellerBestPrice") || undefined,
    cashRatioPercent: formData.get("cashRatioPercent") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const data = parsed.data;
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a phone number to enable the WhatsApp connect button." };
  }

  const [listing] = await db
    .insert(listings)
    .values({
      title: data.title,
      description: data.description,
      price: data.price,
      listingType: data.listingType,
      propertyType: data.propertyType,
      bhk: data.propertyType === "plot" || data.propertyType === "commercial" ? null : data.bhk ?? null,
      areaSqft: data.areaSqft,
      locality: data.locality,
      address: data.address,
      ownerId: session.id,
      projectId,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      towerName: data.towerName?.trim() || null,
      unitNumber: data.unitNumber?.trim() || null,
      unitFloor: data.unitFloor ?? null,
      facing: data.facing,
      furnishingStatus: data.furnishingStatus,
      inventoryState: data.inventoryState,
      sellerAskPrice: data.sellerAskPrice ?? null,
      sellerBestPrice: data.sellerBestPrice ?? null,
      cashRatioPercent: data.cashRatioPercent ?? null,
    })
    .returning();

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const imageRows: { listingId: number; url: string; sortOrder: number }[] = [];
  let order = 0;
  for (const file of files.slice(0, 10)) {
    const url = await saveUploadedImage(file);
    if (url) {
      imageRows.push({ listingId: listing.id, url, sortOrder: order++ });
    }
  }
  if (imageRows.length > 0) {
    await db.insert(listingImages).values(imageRows);
  }

  redirect(`/listing/${listing.id}`);
}

const inquirySchema = z.object({
  listingId: z.coerce.number().int().positive(),
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(5, "Add a short message"),
});

export async function createInquiryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inquirySchema.safeParse({
    listingId: formData.get("listingId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { listingId, name, email, phone, message } = parsed.data;
  await db.insert(inquiries).values({ listingId, name, email, phone, message });

  return { success: "Your message has been sent. The lister will be in touch soon." };
}

const blogCommentSchema = z.object({
  content: z.string().trim().min(2, "Comment is too short").max(2000, "Keep comments under 2000 characters"),
});

export async function createBlogCommentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "Log in to leave a comment." };
  }

  const postId = Number(formData.get("postId"));
  if (!postId) return { error: "Missing post." };

  const parsed = blogCommentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your comment." };
  }

  const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, postId) });
  if (!post || post.status !== "published") {
    return { error: "This post isn't available for comments." };
  }

  await db.insert(blogComments).values({ postId, userId: session.id, content: parsed.data.content });

  revalidatePath(`/blog/${post.slug}`);
  return { success: "Thanks! Your comment is awaiting approval and will appear once reviewed." };
}

// Fired once per pathname change by <ViewTracker> (mounted only in the
// public (site) layout, never /admin — see that component) to power the
// admin Analytics page: page-view totals and "people on the site right now".
// visitorId is an anonymous id the client keeps in a long-lived cookie
// purely to dedupe distinct visitors; it's never tied to a logged-in user.
// Deliberately best-effort: no session/CSRF check (anonymous analytics, not
// a state change a user account owns) and no revalidatePath (the admin
// Analytics page reads fresh on every load; blog view counts are read live
// too since those pages are already dynamically rendered).
export async function recordPageViewAction(path: string, visitorId: string) {
  if (typeof path !== "string" || typeof visitorId !== "string") return;
  if (!path.startsWith("/") || path.length > 300) return;
  if (!/^[a-zA-Z0-9-]{10,100}$/.test(visitorId)) return;

  const slugMatch = path.match(/^\/blog\/([^/]+)\/?$/);
  let blogPostId: number | null = null;
  if (slugMatch) {
    const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.slug, slugMatch[1]) });
    if (post) blogPostId = post.id;
  }

  await db.insert(pageViews).values({ path: path.slice(0, 300), visitorId, blogPostId });
  if (blogPostId) {
    await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, blogPostId));
  }
}

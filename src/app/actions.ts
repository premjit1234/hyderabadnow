"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { users, listings, listingImages, inquiries, blogPosts, blogComments, pageViews, phoneOtps } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";
import { resolveListingAmenities } from "@/app/admin/actions";
import { getVideoEmbedUrl } from "@/lib/video";
import { confirmListingStillAvailable } from "@/lib/staleListings";
import { generateOtpCode, hashOtpCode, normalizePhoneForOtp } from "@/lib/sms";
import { sendOtpWhatsApp } from "@/lib/whatsappOtp";

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
  bathrooms: z.coerce.number().int().min(0).max(10).optional(),
  carParking: z.coerce.number().int().min(0).max(10).optional(),
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
  videoUrl: z.string().optional().refine((v) => !v || getVideoEmbedUrl(v) !== null, "Enter a valid YouTube video link"),
});

// ---- Phone verification (OTP via MSG91 WhatsApp — see lib/whatsappOtp.ts) ----
// Gates posting a listing (see PhoneVerificationGate.tsx / post-listing/page.tsx)
// so the "Phone Verified" badge shown next to a listing's contact number
// actually means something, rather than being an unverified self-report.

const otpPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

export async function requestPhoneOtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Log in first." };

  const parsed = otpPhoneSchema.safeParse(formData.get("phone"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid phone number." };
  const normalized = normalizePhoneForOtp(parsed.data);

  // One resend per cooldown window, regardless of which phone number it's
  // for — simplest possible rate limit against someone mashing "send code"
  // to run up a WhatsApp messaging bill.
  const recent = await db.query.phoneOtps.findFirst({
    where: eq(phoneOtps.userId, session.id),
    orderBy: [desc(phoneOtps.createdAt)],
  });
  if (recent && Date.now() - new Date(recent.createdAt).getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    return { error: "Please wait a minute before requesting another code." };
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await db.insert(phoneOtps).values({ userId: session.id, phone: normalized, codeHash: hashOtpCode(code), expiresAt });

  try {
    await sendOtpWhatsApp(normalized, code);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't send the verification code — try again." };
  }

  return { success: "Code sent." };
}

export async function verifyPhoneOtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Log in first." };

  const code = String(formData.get("code") || "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const row = await db.query.phoneOtps.findFirst({
    where: eq(phoneOtps.userId, session.id),
    orderBy: [desc(phoneOtps.createdAt)],
  });
  if (!row || row.consumedAt) return { error: "No pending code — request a new one." };
  if (new Date(row.expiresAt).getTime() < Date.now()) return { error: "That code expired — request a new one." };
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { error: "Too many incorrect attempts — request a new code." };

  if (hashOtpCode(code) !== row.codeHash) {
    await db.update(phoneOtps).set({ attempts: row.attempts + 1 }).where(eq(phoneOtps.id, row.id));
    const left = OTP_MAX_ATTEMPTS - row.attempts - 1;
    return { error: left > 0 ? `Incorrect code (${left} attempt${left === 1 ? "" : "s"} left).` : "Too many incorrect attempts — request a new code." };
  }

  await db.update(phoneOtps).set({ consumedAt: new Date().toISOString() }).where(eq(phoneOtps.id, row.id));
  await db
    .update(users)
    .set({ phone: row.phone, phoneVerified: true, phoneVerifiedAt: new Date().toISOString() })
    .where(eq(users.id, session.id));

  revalidatePath("/post-listing");
  return { success: "Phone verified." };
}

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
    bathrooms: formData.get("bathrooms") || undefined,
    carParking: formData.get("carParking") || undefined,
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
    videoUrl: formData.get("videoUrl") || undefined,
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
  const amenities = await resolveListingAmenities(formData);

  const [listing] = await db
    .insert(listings)
    .values({
      title: data.title,
      description: data.description,
      price: data.price,
      listingType: data.listingType,
      propertyType: data.propertyType,
      bhk: data.propertyType === "plot" || data.propertyType === "commercial" ? null : data.bhk ?? null,
      bathrooms: data.bathrooms ?? null,
      carParking: data.carParking ?? null,
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
      amenities,
      videoUrl: data.videoUrl || null,
      lastConfirmedAt: new Date().toISOString(),
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

// Lets a logged-in owner confirm their own listing right from the dashboard
// — a same-effect, no-email-needed alternative to clicking "Yes, still
// available" in the stale-listing nudge email (see lib/staleListings.ts and
// app/api/listings/confirm/route.ts, which handles the emailed link for a
// visitor who isn't logged in). Ownership is checked here since, unlike the
// emailed link, this comes from a plain form post rather than a signed
// per-listing token.
export async function dashboardConfirmListingAction(formData: FormData) {
  const session = await getSession();
  const listingId = Number(formData.get("listingId"));
  if (!session || !listingId) return;

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing || listing.ownerId !== session.id) return;

  await confirmListingStillAvailable(listingId);
  revalidatePath("/dashboard");
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

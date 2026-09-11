"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import {
  users,
  listings,
  listingImages,
  inquiries,
  blogPosts,
  blogComments,
  pageViews,
  phoneOtps,
  creditOrders,
} from "@/db/schema";
import { and, eq, gt, inArray, sql, desc } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";
import { resolveListingAmenities } from "@/app/admin/actions";
import { editListingSchema } from "@/lib/listingValidation";
import { getVideoEmbedUrl } from "@/lib/video";
import { confirmListingStillAvailable } from "@/lib/staleListings";
import { generateOtpCode, hashOtpCode, normalizePhoneForOtp } from "@/lib/sms";
import { sendOtpWhatsApp } from "@/lib/whatsappOtp";
import { getSiteSettings } from "@/db/queries";
import { createRazorpayOrder, getRazorpayKeyId, isRazorpayConfigured, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { creditFeaturedCreditOrder } from "@/lib/featuredCredits";

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

// ---- Owner self-service: edit / delete a listing from the dashboard ----
//
// Same validation shape as adminUpdateListingAction (see editListingSchema,
// exported from app/admin/actions.ts specifically so this doesn't duplicate
// it) — the fields an owner can edit are identical to what an admin can.
// Two differences from the admin action: authorization is an ownership
// check instead of requireAdmin(), and featured/verified are never touched
// here at all (not read from the form, not included in the update) — those
// stay admin-only trust/promotion signals an owner can't grant themselves,
// same rule listing.verified already follows everywhere else in the app.
export async function updateOwnListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Log in to edit your listing." };

  const listingId = Number(formData.get("listingId"));
  if (!listingId) return { error: "Missing listing." };

  const existing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!existing || (existing.ownerId !== session.id && session.role !== "admin")) {
    return { error: "You don't have permission to edit this listing." };
  }

  const parsed = editListingSchema.safeParse({
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
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    status: formData.get("status"),
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
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";
  if (whatsappEnabled && !data.contactPhone?.trim()) {
    return { error: "Enter a contact phone number to enable the WhatsApp button." };
  }
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;
  const amenities = await resolveListingAmenities(formData);

  await db
    .update(listings)
    .set({
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
      city: data.city,
      address: data.address || null,
      status: data.status,
      contactPhone: data.contactPhone?.trim() || null,
      whatsappEnabled,
      projectId,
      towerName: data.towerName?.trim() || null,
      unitNumber: data.unitNumber?.trim() || null,
      unitFloor: data.unitFloor ?? null,
      facing: data.facing ?? null,
      furnishingStatus: data.furnishingStatus ?? null,
      inventoryState: data.inventoryState ?? "new",
      sellerAskPrice: data.sellerAskPrice ?? null,
      sellerBestPrice: data.sellerBestPrice ?? null,
      cashRatioPercent: data.cashRatioPercent ?? null,
      amenities,
      videoUrl: data.videoUrl || null,
      // Same reasoning as the admin edit action: an owner actively editing
      // their listing is itself a sign it's still real and attended-to, so
      // this resets the staleness clock exactly like the "Yes, still
      // available" confirm button does (see lib/staleListings.ts).
      lastConfirmedAt: new Date().toISOString(),
      staleNudgeSentAt: null,
      autoFlaggedStaleAt: null,
    })
    .where(eq(listings.id, listingId));

  // Remove any photos the owner unchecked, scoped to this listing so a
  // tampered form field can never touch another listing's images.
  const removeIds = formData
    .getAll("removeImageId")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  if (removeIds.length > 0) {
    await db
      .delete(listingImages)
      .where(and(eq(listingImages.listingId, listingId), inArray(listingImages.id, removeIds)));
  }

  // Add any newly uploaded photos after the existing ones.
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${listingImages.sortOrder}), -1)` })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  let order = maxOrder + 1;
  const newRows: { listingId: number; url: string; sortOrder: number }[] = [];
  for (const file of files.slice(0, 10)) {
    const url = await saveUploadedImage(file);
    if (url) newRows.push({ listingId, url, sortOrder: order++ });
  }
  if (newRows.length > 0) {
    await db.insert(listingImages).values(newRows);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath(`/listing/${listingId}`);
  redirect(`/dashboard/listings/${listingId}/edit?saved=1`);
}

// Permanently deletes a listing the current user owns (or any listing, for
// an admin) — listingImages and inquiries both reference listings with ON
// DELETE CASCADE (see schema.ts), so this cleanly removes the listing's
// photos and inquiries too, same as adminDeleteListingAction. No separate
// confirmation step here since the dashboard's delete button itself asks
// for confirmation before this ever gets submitted (see
// DeleteListingButton.tsx) — this action trusts that already happened, the
// same way a plain form submit always does.
export async function deleteOwnListingAction(formData: FormData) {
  const session = await getSession();
  const listingId = Number(formData.get("listingId"));
  if (!session || !listingId) return;

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing || (listing.ownerId !== session.id && session.role !== "admin")) return;

  await db.delete(listings).where(eq(listings.id, listingId));
  revalidatePath("/dashboard");
}

// --- Featured-listing credits (buy credits, spend one to feature a listing) ---
//
// This is entirely separate from adminToggleFeaturedAction (admin/actions.ts)
// — that stays a free, unlimited, admin-only override for promotional
// purposes. These four actions are the owner-facing, credit-gated path:
// buy credits via Razorpay, then spend exactly one to feature your own
// listing. Deliberately no admin bypass here (unlike
// updateOwnListingAction/deleteOwnListingAction) — spending a credit should
// only ever spend the actual owner's own balance, and the dashboard only
// ever surfaces a user's own listings anyway, so a bypass would never be
// reachable through the UI.

// Starts a purchase: creates a Razorpay order for `quantity` credits at the
// current admin-set price, and a matching "created" row in creditOrders so
// verifyFeaturedCreditPaymentAction (below) and the webhook route both have
// something to look up and mark paid once Razorpay confirms the payment.
// Nothing is credited to the user yet — that only happens once a signature
// proves the payment actually went through (see creditFeaturedCreditOrder).
export async function createFeaturedCreditOrderAction(
  quantity: number
): Promise<
  | { success: true; razorpayOrderId: string; amountRupees: number; keyId: string; quantity: number }
  | { success: false; error: string }
> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in first." };

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return { success: false, error: "Enter a quantity between 1 and 100." };
  }

  if (!isRazorpayConfigured()) {
    return { success: false, error: "Buying credits isn't set up yet on this server. Please try again later." };
  }

  const { featuredCreditPriceRupees } = await getSiteSettings();
  const amountRupees = featuredCreditPriceRupees * quantity;

  let razorpayOrder: { id: string };
  try {
    razorpayOrder = await createRazorpayOrder({
      amountRupees,
      receipt: `fc_${session.id}_${Date.now()}`,
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    return { success: false, error: "Could not start payment. Please try again." };
  }

  await db.insert(creditOrders).values({
    userId: session.id,
    quantity,
    amountRupees,
    razorpayOrderId: razorpayOrder.id,
    status: "created",
  });

  const keyId = getRazorpayKeyId();
  if (!keyId) {
    // Shouldn't happen given the isRazorpayConfigured() check above, but
    // keep TypeScript honest and fail closed rather than sending the
    // browser a null key.
    return { success: false, error: "Buying credits isn't set up yet on this server. Please try again later." };
  }

  return { success: true, razorpayOrderId: razorpayOrder.id, amountRupees, keyId, quantity };
}

// Runs right after Razorpay Checkout's "handler" callback reports success in
// the browser. Verifies the cryptographic signature Razorpay hands back
// (proof the payment actually happened — see verifyRazorpayPaymentSignature)
// before crediting anything. The /api/payments/razorpay/webhook route calls
// the same shared creditFeaturedCreditOrder helper as a safety net in case
// the browser loses its connection right after paying and never reaches
// this action at all — whichever of the two gets there first wins, the
// other is a safe no-op (see that helper's own comment).
export async function verifyFeaturedCreditPaymentAction(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ success: true; creditsAdded: number } | { success: false; error: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Please log in first." };

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return { success: false, error: "Missing payment details." };
  }

  const order = await db.query.creditOrders.findFirst({ where: eq(creditOrders.razorpayOrderId, razorpayOrderId) });
  if (!order || order.userId !== session.id) {
    return { success: false, error: "Order not found." };
  }

  const validSignature = verifyRazorpayPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!validSignature) {
    return {
      success: false,
      error: "Payment could not be verified. If money was deducted, it will be credited automatically shortly.",
    };
  }

  const result = await creditFeaturedCreditOrder(razorpayOrderId, razorpayPaymentId);
  if (!result) return { success: false, error: "Order not found." };

  revalidatePath("/dashboard");
  return { success: true, creditsAdded: result.quantity };
}

// Spends exactly one credit to feature a listing the current user owns. The
// decrement is a single conditional UPDATE (`WHERE featured_credits > 0`)
// rather than a read-then-write, so two rapid clicks — or a click racing a
// webhook crediting the same account — can never push the balance negative
// or feature a listing without actually having spent a credit for it.
export async function featureListingWithCreditAction(formData: FormData) {
  const session = await getSession();
  const listingId = Number(formData.get("listingId"));
  if (!session || !listingId) return;

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing || listing.ownerId !== session.id) return;
  if (listing.featured) return;

  const updated = await db
    .update(users)
    .set({ featuredCredits: sql`${users.featuredCredits} - 1` })
    .where(and(eq(users.id, session.id), gt(users.featuredCredits, 0)))
    .returning({ id: users.id });

  if (updated.length === 0) {
    // No credits available — nothing to spend, nothing to feature.
    return;
  }

  await db.update(listings).set({ featured: true }).where(eq(listings.id, listingId));
  revalidatePath("/dashboard");
}

// Turns featured back off. Free, and does not refund the credit that was
// spent to turn it on (the user explicitly chose this policy) — a listing
// can simply be re-featured later by spending another credit.
export async function unfeatureOwnListingAction(formData: FormData) {
  const session = await getSession();
  const listingId = Number(formData.get("listingId"));
  if (!session || !listingId) return;

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing || listing.ownerId !== session.id) return;

  await db.update(listings).set({ featured: false }).where(eq(listings.id, listingId));
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
//
// listings.views works the same way as blogPosts.viewCount just above it —
// bumped here, on every tracked page view of a /listing/[id] page. Before
// this, nothing anywhere ever wrote to listings.views at all: the column
// existed and was shown on the owner dashboard and the listing table, but
// stayed permanently at its insert-time default of 0 no matter how many
// times a listing was actually viewed. No dedup by visitor, same as blog
// view counts — a repeat visit still counts, since this mirrors "page
// views" (an analytics number), not "unique viewers".
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

  const listingMatch = path.match(/^\/listing\/(\d+)\/?$/);
  const listingId = listingMatch ? Number(listingMatch[1]) : null;

  await db.insert(pageViews).values({ path: path.slice(0, 300), visitorId, blogPostId });
  if (blogPostId) {
    await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, blogPostId));
  }
  if (listingId != null) {
    await db
      .update(listings)
      .set({ views: sql`${listings.views} + 1` })
      .where(eq(listings.id, listingId));
  }
}

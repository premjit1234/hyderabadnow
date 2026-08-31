"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { users, listings, listingImages, inquiries } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const data = parsed.data;

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

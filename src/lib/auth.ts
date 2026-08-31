import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";
const COOKIE_NAME = "hn_session";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "buyer" | "agent" | "seller" | "admin";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Google-authenticated accounts never log in with a password, but the
// passwordHash column is NOT NULL — this fills it with a hash of an unguessable
// value nobody knows or types, so it exists but can never successfully verify.
export async function unusablePasswordHash() {
  return hashPassword(crypto.randomBytes(32).toString("hex"));
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
}

export async function setSessionCookie(user: SessionUser) {
  const token = signSession(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

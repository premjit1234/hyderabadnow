// Signed, no-login-required tokens embedded in the "still available?" nudge
// email's two action links (see lib/staleListings.ts and
// app/api/listings/confirm/route.ts) — the same trick unsubscribe links use.
// A recipient shouldn't have to log in just to say "yes, still listed" or
// "no, take it down", but the link still needs to prove it really came from
// that email and hasn't been guessed/tampered with — a JWT signed with the
// same secret that signs session cookies (lib/auth.ts) gives us both for
// free, with no new table to store/expire tokens in.
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";
const TOKEN_TTL = "45d"; // comfortably longer than the nudge-to-auto-flag window (see staleListings.ts)

export type ConfirmAction = "confirm" | "remove";

export type ConfirmTokenPayload = {
  listingId: number;
  action: ConfirmAction;
  purpose: "stale-check";
};

export function signConfirmToken(payload: ConfirmTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyConfirmToken(token: string): ConfirmTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ConfirmTokenPayload;
    if (decoded.purpose !== "stale-check" || typeof decoded.listingId !== "number") return null;
    return decoded;
  } catch {
    return null;
  }
}

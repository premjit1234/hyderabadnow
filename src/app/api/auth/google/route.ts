import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, isGoogleLoginConfigured } from "@/lib/google-oauth";

export const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  if (!isGoogleLoginConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", request.nextUrl.origin)
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // the round trip to Google and back should take seconds, not minutes
  });

  // request.nextUrl.origin reflects the Host header the browser actually used
  // (Caddy forwards it through unchanged), so this is correct on both
  // localhost:3000 during development and https://hyderabadnow.in in production —
  // as long as both are registered as authorized redirect URIs in Google Cloud Console.
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}

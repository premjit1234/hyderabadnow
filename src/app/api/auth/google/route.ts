import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, getAppUrl, isGoogleLoginConfigured } from "@/lib/google-oauth";

export const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request);

  if (!isGoogleLoginConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", appUrl));
  }

  const state = crypto.randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // the round trip to Google and back should take seconds, not minutes
  });

  // Must exactly match an Authorized redirect URI registered in Google Cloud
  // Console for this app — see APP_URL in .env.example for why this isn't
  // derived from the incoming request.
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}

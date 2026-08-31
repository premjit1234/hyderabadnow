import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { setSessionCookie, unusablePasswordHash } from "@/lib/auth";
import { exchangeCodeForGoogleUser } from "@/lib/google-oauth";
import { STATE_COOKIE } from "../route";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const loginError = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, origin));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);

  if (oauthError) {
    // e.g. the user clicked "Cancel" on Google's consent screen — not a bug
    return loginError("google_denied");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return loginError("invalid_state");
  }

  let googleUser;
  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    googleUser = await exchangeCodeForGoogleUser(code, redirectUri);
  } catch (err) {
    console.error("Google OAuth exchange failed:", err);
    return loginError("google_failed");
  }

  if (!googleUser.email_verified) {
    return loginError("google_email_unverified");
  }

  const byGoogleId = await db.query.users.findFirst({ where: eq(users.googleId, googleUser.sub) });
  if (byGoogleId) {
    await setSessionCookie({
      id: byGoogleId.id,
      name: byGoogleId.name,
      email: byGoogleId.email,
      role: byGoogleId.role as never,
    });
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  const byEmail = await db.query.users.findFirst({ where: eq(users.email, googleUser.email) });
  if (byEmail) {
    // Existing password account with the same (Google-verified) email — link it
    // so this person can use either login method going forward.
    await db.update(users).set({ googleId: googleUser.sub }).where(eq(users.id, byEmail.id));
    await setSessionCookie({ id: byEmail.id, name: byEmail.name, email: byEmail.email, role: byEmail.role as never });
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  const [created] = await db
    .insert(users)
    .values({
      name: googleUser.name || googleUser.email.split("@")[0],
      email: googleUser.email,
      passwordHash: await unusablePasswordHash(),
      authProvider: "google",
      googleId: googleUser.sub,
      role: "buyer",
    })
    .returning();

  await setSessionCookie({ id: created.id, name: created.name, email: created.email, role: created.role as never });
  // First-time Google sign-ups default to "buyer" — send them to pick their real
  // account type (buyer/agent/seller) instead of leaving agents stuck unable to post.
  return NextResponse.redirect(new URL("/complete-profile", origin));
}

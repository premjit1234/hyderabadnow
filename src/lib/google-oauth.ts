// Minimal server-side "Authorization Code" OAuth 2.0 flow against Google —
// no client SDK, no extra npm dependency. The redirect_uri is passed in by the
// caller (built from the incoming request) so this works unchanged on both
// localhost and the production domain, as long as both are registered as
// authorized redirect URIs in the Google Cloud Console.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function isGoogleLoginConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// Behind Caddy's reverse proxy, the Next.js server only ever sees the internal
// connection (Caddy -> localhost:3000), so request.nextUrl.origin resolves to
// something like "https://0.0.0.0:3000" instead of the public domain — that's
// not a URL Google (or a browser) can do anything with. APP_URL is the fix:
// an explicit, always-correct public origin, set once in .env. It also lets a
// redirect_uri be registered exactly once in Google Cloud Console per
// environment instead of trusting a client-controlled Host header.
export function getAppUrl(request: { nextUrl: { origin: string } }) {
  return (process.env.APP_URL || request.nextUrl.origin).replace(/\/$/, "");
}

export function buildGoogleAuthUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
};

export async function exchangeCodeForGoogleUser(
  code: string,
  redirectUri: string
): Promise<GoogleUserInfo> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const tokenData = (await tokenRes.json()) as { access_token: string };

  // Calling Google's own userinfo endpoint with the access token we just received
  // (rather than decoding the id_token ourselves) lets Google do the signature
  // verification — simpler and just as trustworthy for a server-to-server flow.
  const userRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`Google userinfo fetch failed: ${userRes.status} ${await userRes.text()}`);
  }
  return (await userRes.json()) as GoogleUserInfo;
}

// Sends transactional emails (currently just the "still listed?" nudge —
// see lib/staleListings.ts) via Resend, a low-friction email API with a
// generous free tier. Unlike sendOtpSms (lib/sms.ts), a missing/misconfigured
// setup here fails soft — logging a warning instead of throwing — because
// nothing security-sensitive depends on an email actually arriving; the
// worst case is a listing doesn't get nudged this cycle, which the next
// scheduled run (see src/instrumentation.ts) simply retries.
//
// Setup required on Resend's side before this can send real email:
//   1. Sign up at https://resend.com (free tier covers a small site's volume
//      comfortably).
//   2. Add and verify your sending domain there (Resend walks you through
//      adding a few DNS records) — sending from an unverified domain is
//      restricted to your own Resend account email, which is fine for
//      testing but not for real nudges to your users.
//   3. Create an API key (Settings -> API Keys) and set RESEND_API_KEY in
//      your server's .env, plus EMAIL_FROM, e.g.
//      "HyderabadNow <notifications@hyderabadnow.in>".
const RESEND_URL = "https://api.resend.com/emails";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[email] Not configured (RESEND_API_KEY/EMAIL_FROM missing) — skipped "${subject}" to ${to}.`);
    return false;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend send failed (${res.status}) for "${subject}" to ${to}: ${body.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}

// Sends the one-time phone-verification code (see phoneOtps in db/schema.ts
// and the OTP actions in src/app/actions.ts) via MSG91 — a popular, low-cost
// Indian SMS/OTP gateway. This deliberately does NOT use MSG91's own OTP
// widget/verify API: we generate, hash, store, and expire the code ourselves
// (see hashOtpCode/generateOtpCode below) so the whole verify flow works the
// same way regardless of provider, and MSG91 is used purely as a "send this
// SMS" transport via their Flow API.
//
// Setup required on MSG91's side before this can send a real SMS (none of
// this is something code can do for you):
//   1. Sign up at https://msg91.com and complete DLT registration — Indian
//      telecom regulation (TRAI) requires any transactional/OTP SMS sender
//      to be registered on a DLT platform first. MSG91's onboarding walks
//      you through this; it can take a day or two for approval.
//   2. In the MSG91 dashboard, create a Flow (a message template) containing
//      a variable named OTP, e.g. "Your HyderabadNow verification code is
//      ##OTP##. It expires in 10 minutes." Copy its Template ID.
//   3. Set MSG91_AUTH_KEY (from Settings -> API) and MSG91_TEMPLATE_ID (the
///     Flow's Template ID) in your server's .env.
//
// Until both env vars are set, sendOtpSms() never silently "succeeds" — it
// throws, so a misconfigured deployment can't end up treating unverified
// phone numbers as verified. Set OTP_DEV_MODE=true to instead log the code
// to the server console (for local/sandbox testing without a real MSG91
// account) — never enable that in production.
import { randomInt, createHmac } from "node:crypto";

const OTP_HASH_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";

// A fast keyed hash is enough here (unlike password hashing, which needs to
// be deliberately slow) — a 6-digit code already has a tiny keyspace, and
// what actually stops brute-forcing it is the attempt limit and expiry in
// verifyPhoneOtpAction, not hash cost. This just keeps the raw code out of
// the database (phone_otps.codeHash) so a DB leak alone can't be replayed.
export function hashOtpCode(code: string): string {
  return createHmac("sha256", OTP_HASH_SECRET).update(code).digest("hex");
}

const MSG91_SEND_URL = "https://control.msg91.com/api/v5/flow/";

export function generateOtpCode(): string {
  // 6 digits, zero-padded — crypto-strength, not Math.random().
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Same India-assumption as normalizePhoneForWhatsApp (lib/whatsapp.ts), kept
// as a separate copy rather than shared: this one's output format (plain
// "91XXXXXXXXXX", no "+") is specifically what MSG91's API expects, and the
// two normalizations are free to diverge if either provider's requirements
// change later.
export function normalizePhoneForOtp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const mobile = normalizePhoneForOtp(phone);

  if (!authKey || !templateId) {
    if (process.env.OTP_DEV_MODE === "true") {
      console.log(`[dev-mode OTP] Would send code ${code} to +${mobile} (MSG91 not configured).`);
      return;
    }
    throw new Error(
      "Phone verification isn't set up yet on this server — MSG91_AUTH_KEY / MSG91_TEMPLATE_ID are missing from .env."
    );
  }

  const res = await fetch(MSG91_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({
      template_id: templateId,
      recipients: [{ mobiles: mobile, OTP: code }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MSG91 SMS send failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

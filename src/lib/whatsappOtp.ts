// Sends the one-time phone-verification code via MSG91's WhatsApp Business
// API — the alternative transport to sms.ts's sendOtpSms, switched to
// because WhatsApp Business API onboarding (Meta Business verification +
// WABA setup + template approval) sits entirely outside India's DLT/TRAI
// regime, unlike transactional SMS, which requires DLT + PE-TM registration
// that can take weeks-to-months for a first-time individual business (SMS
// remains fully wired up in sms.ts if you complete DLT later and want to
// switch back, or add it as a fallback for numbers without WhatsApp).
//
// Code generation/hashing/expiry/attempt-limiting is unchanged and shared
// with the SMS path (see generateOtpCode/hashOtpCode/normalizePhoneForOtp in
// ./sms) — this file only owns the "send this WhatsApp message" transport.
// Note: this is unrelated to lib/whatsapp.ts, which builds wa.me "chat with
// the seller" links shown on listing pages — different feature, different
// MSG91 product (Business API vs. a plain deep link), naming kept distinct
// on purpose.
//
// Setup required on MSG91's side before this can send a real WhatsApp
// message (none of this is something code can do for you):
//   1. In your MSG91 dashboard, go to the WhatsApp channel and complete
//      Meta Business verification + WhatsApp Business API (WABA) setup.
//      This still needs business documents (GST/PAN/incorporation proof),
//      same as DLT, but is typically approved in days rather than weeks,
//      and needs no DLT/PE-TM registration at all.
//   2. Create an "Authentication" category template with MSG91/Meta — pick
//      the "Copy code" delivery method (not zero/one-tap auto-fill, which
//      are for native apps registering a package name/bundle ID with Meta;
//      this is a website, so the user just reads the code and types it in,
//      exactly like the SMS flow did). Once Meta approves it, note the
//      exact template name and language code MSG91 shows you.
//   3. Set MSG91_WHATSAPP_INTEGRATED_NUMBER (your WhatsApp Business number),
//      MSG91_WHATSAPP_TEMPLATE_NAME, and MSG91_WHATSAPP_LANGUAGE_CODE (e.g.
//      "en") in your server's .env. MSG91_AUTH_KEY is reused from the SMS
//      setup — no new key needed, as long as its Authkey Rule has WhatsApp
//      permission enabled (the default "Admin" rule does).
//
// The request shape below is copied verbatim from the curl sample MSG91's
// dashboard auto-generates on the template's own "Code { JSON }" page (the
// authoritative source — prefer re-checking that sample over this comment
// if MSG91 changes their API later). Two things worth knowing about it:
//   - "namespace" is sent as null — this account's API version doesn't need
//     a real value there, hence no MSG91_WHATSAPP_TEMPLATE_NAMESPACE env var.
//   - "language.policy": "deterministic" tells WhatsApp to send in exactly
//     the language specified, no fallback substitution — this is what
//     MSG91's own sample uses and there's no reason to deviate from it.
//
// Until every required env var is set, sendOtpWhatsApp() never silently
// "succeeds" — it throws, so a misconfigured deployment can't end up
// treating unverified phone numbers as verified. Set OTP_DEV_MODE=true to
// instead log the code to the server console (for local/sandbox testing
// without a real MSG91 account) — never enable that in production.
import { normalizePhoneForOtp } from "./sms";

const MSG91_WHATSAPP_SEND_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

export async function sendOtpWhatsApp(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER;
  const templateName = process.env.MSG91_WHATSAPP_TEMPLATE_NAME;
  const languageCode = process.env.MSG91_WHATSAPP_LANGUAGE_CODE || "en";
  const mobile = normalizePhoneForOtp(phone);

  if (!authKey || !integratedNumber || !templateName) {
    if (process.env.OTP_DEV_MODE === "true") {
      console.log(`[dev-mode OTP] Would send WhatsApp code ${code} to +${mobile} (MSG91 WhatsApp not configured).`);
      return;
    }
    throw new Error(
      "Phone verification isn't set up yet on this server — MSG91_WHATSAPP_INTEGRATED_NUMBER / " +
        "MSG91_WHATSAPP_TEMPLATE_NAME are missing from .env."
    );
  }

  const res = await fetch(MSG91_WHATSAPP_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({
      integrated_number: integratedNumber,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode, policy: "deterministic" },
          namespace: null,
          to_and_components: [
            {
              to: [mobile],
              // Two things populate the same code, confirmed against a real
              // failed send (MSG91 error: "buttons: Button at index 0 of
              // type Url requires a parameter"): body_1 fills the {{1}} in
              // the message text, and button_1 fills the "Copy Code"
              // button's own parameter — Meta's Cloud API implements that
              // button as a URL-type button under the hood even though the
              // UI just calls it "Copy Code," and it needs the code passed
              // to it separately from the body. Omitting button_1 is what
              // caused every real send to fail after MSG91 had already
              // accepted the request.
              components: {
                body_1: { type: "text", value: code },
                button_1: { type: "text", value: code },
              },
            },
          ],
        },
      },
    }),
  });

  // Log every attempt's raw response, success or not — MSG91's API has been
  // observed returning HTTP 200 with an error payload in the body for some
  // requests (rather than a non-2xx status), which res.ok alone would miss
  // and silently treat as a successful send. Temporary extra visibility
  // while diagnosing the first real-world sends; safe to trim down once
  // WhatsApp OTP delivery is confirmed reliable end-to-end.
  const responseBody = await res.text().catch(() => "");
  console.log(`[whatsapp-otp] MSG91 response (status ${res.status}) for +${mobile}: ${responseBody.slice(0, 500)}`);

  if (!res.ok) {
    throw new Error(`MSG91 WhatsApp send failed (${res.status}): ${responseBody.slice(0, 300)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseBody);
  } catch {
    // Not JSON — nothing more to check, treat the 2xx status as success.
    return;
  }
  // Some MSG91 endpoints report failure as `{"type": "error", ...}` inside a
  // 200 response rather than via the HTTP status code — catch that case too.
  if (parsed && typeof parsed === "object" && (parsed as { type?: string }).type === "error") {
    throw new Error(`MSG91 WhatsApp send failed: ${responseBody.slice(0, 300)}`);
  }
}

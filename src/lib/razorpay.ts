// Featured-listing credits are paid for through Razorpay Checkout — a
// popular Indian payment gateway (cards/UPI/netbanking). Same style as
// lib/sms.ts's MSG91 integration: talk to the provider's plain REST API via
// fetch rather than pulling in their SDK, since that's all either provider
// needs here.
//
// Setup required on Razorpay's side before this can take a real payment
// (none of this is something code can do for you):
//   1. Sign up at https://razorpay.com and complete KYC — required before
//      live (non-test) payments are accepted; test mode works immediately.
//   2. In Settings -> API Keys, generate a Key ID + Key Secret. Set them as
//      RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in your server's .env.
//   3. In Settings -> Webhooks, add a webhook for
//      https://<your-domain>/api/payments/razorpay/webhook subscribed to
//      the "payment.captured" event, and set its own secret as
//      RAZORPAY_WEBHOOK_SECRET in .env. This is a safety net, not the
//      primary path — see the webhook route's own comment for why it's
//      still needed even though the checkout flow also verifies payment
//      itself.
//
// Until RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set, buying credits fails
// with a clear error (see createFeaturedCreditOrderAction in app/actions.ts)
// rather than silently pretending to succeed — unlike OTP_DEV_MODE for SMS,
// there's no "fake success" dev mode here, since that would be one
// misconfigured env var away from handing out free credits in production.
import { createHmac, timingSafeEqual } from "node:crypto";

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// The Key ID is meant to be public (Razorpay Checkout runs client-side with
// it) — safe to hand back to the browser in a server action's return value.
export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID || null;
}

function basicAuthHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

// Creates a Razorpay order to open Checkout against. `amountRupees` is
// whole rupees — Razorpay's API wants the amount in paise (its smallest
// unit), so this multiplies by 100 internally; every other amount in this
// codebase (listings.price, siteSettings.featuredCreditPriceRupees, ...)
// stays in whole rupees, so that conversion is kept right here at the one
// boundary that actually needs paise.
export async function createRazorpayOrder(params: {
  amountRupees: number;
  receipt: string;
}): Promise<{ id: string }> {
  if (!isRazorpayConfigured()) {
    throw new Error(
      "Buying credits isn't set up yet on this server — RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing from .env."
    );
  }

  const res = await fetch(RAZORPAY_ORDERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: basicAuthHeader() },
    body: JSON.stringify({
      amount: Math.round(params.amountRupees * 100),
      currency: "INR",
      receipt: params.receipt,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

// Constant-time comparison — a plain === on attacker-influenced signatures
// would leak timing information about how many leading bytes matched.
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Verifies the signature Razorpay Checkout hands back to the browser on
// successful payment (see the "handler" callback in
// BuyFeaturedCreditsForm.tsx) — per Razorpay's documented scheme, HMAC-SHA256
// of "{order_id}|{payment_id}" keyed with the account's Key Secret. This is
// what stops a client from simply claiming a payment succeeded without one
// actually happening: only someone holding the Key Secret (i.e. Razorpay
// itself) could have produced a signature that verifies.
export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

// Verifies a Razorpay webhook request's signature — HMAC-SHA256 of the raw
// request body, keyed with the separate webhook secret (not the Key
// Secret) configured alongside the webhook URL in the Razorpay dashboard.
// `rawBody` must be the exact bytes Razorpay sent, before any JSON parsing
// — re-serializing a parsed object can reorder keys or change whitespace
// and silently break the signature check.
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

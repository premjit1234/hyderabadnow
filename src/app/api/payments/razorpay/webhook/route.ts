import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { creditFeaturedCreditOrder } from "@/lib/featuredCredits";

// Safety net for featured-credit purchases: verifyFeaturedCreditPaymentAction
// (app/actions.ts) is the primary path, running the instant Razorpay
// Checkout's "handler" callback fires in the browser. But if the browser
// tab closes, the network drops, or the user's phone locks right after
// paying, that callback may never run — this webhook is Razorpay's own
// documented way of still telling the server the payment went through, so
// the purchase gets credited even when the browser never checks back in.
//
// Both this route and the action call the same creditFeaturedCreditOrder
// helper, which is safe to call more than once for the same order (only the
// first call — whichever of the two, or whichever retried webhook delivery,
// gets there first — actually credits the user). So there's no harm in
// Razorpay retrying this webhook, and no harm in both paths firing for the
// same payment.
//
// Configure this in the Razorpay dashboard under Settings -> Webhooks:
// URL https://<your-domain>/api/payments/razorpay/webhook, event
// "payment.captured", with its own secret set as RAZORPAY_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    // Not an event we act on — acknowledge so Razorpay doesn't keep retrying.
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "Missing order/payment id" }, { status: 400 });
  }

  await creditFeaturedCreditOrder(orderId, paymentId);
  return NextResponse.json({ ok: true });
}

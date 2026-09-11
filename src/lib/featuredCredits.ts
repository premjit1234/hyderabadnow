// Shared "mark this credit order paid and top up the buyer's balance" step
// — used by both the client-side payment verification that runs right
// after Razorpay Checkout reports success (verifyFeaturedCreditPaymentAction
// in app/actions.ts) and the /api/payments/razorpay/webhook route, which
// exists specifically to still credit the purchase if the browser closes or
// loses its connection right after paying, before it ever gets to call the
// verification action.
//
// Both call sites race to be the one that flips creditOrders.status from
// "created" to "paid". The conditional UPDATE below (`WHERE status =
// 'created'`) only ever succeeds for whichever one gets there first — SQLite
// serializes writes to the same row — so the featuredCredits increment
// beneath it can only ever run once per order no matter how many times this
// gets called for the same order (a retried webhook delivery included).
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { creditOrders, users } from "@/db/schema";

export async function creditFeaturedCreditOrder(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<{ credited: boolean; quantity: number; userId: number } | null> {
  const order = await db.query.creditOrders.findFirst({ where: eq(creditOrders.razorpayOrderId, razorpayOrderId) });
  if (!order) return null;

  const updated = await db
    .update(creditOrders)
    .set({ status: "paid", razorpayPaymentId, paidAt: new Date().toISOString() })
    .where(and(eq(creditOrders.id, order.id), eq(creditOrders.status, "created")))
    .returning({ id: creditOrders.id });

  if (updated.length === 0) {
    // Already paid — the other caller won the race. Not an error, just
    // nothing left for this call to do.
    return { credited: false, quantity: order.quantity, userId: order.userId };
  }

  await db
    .update(users)
    .set({ featuredCredits: sql`${users.featuredCredits} + ${order.quantity}` })
    .where(eq(users.id, order.userId));

  return { credited: true, quantity: order.quantity, userId: order.userId };
}

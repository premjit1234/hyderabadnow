"use client";

import { useState } from "react";
import Script from "next/script";
import { createFeaturedCreditOrderAction, verifyFeaturedCreditPaymentAction } from "@/app/actions";

// Loads Razorpay Checkout.js and drives the standard order-then-verify flow
// it expects: 1) ask the server for an order (createFeaturedCreditOrderAction
// — this is also where the current per-credit price gets multiplied out, so
// the browser never gets to decide what it's charged), 2) open Checkout with
// that order id, 3) once the user pays, Checkout calls back into this
// component with a payment id + signature, which get sent straight to
// verifyFeaturedCreditPaymentAction for the actual crediting — nothing here
// ever marks the purchase successful on its own say-so.
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function BuyFeaturedCreditsForm({
  pricePerCredit,
  buyerName,
  buyerEmail,
}: {
  pricePerCredit: number;
  buyerName: string;
  buyerEmail: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  async function handleBuy() {
    setStatus("loading");
    setMessage(null);

    if (scriptFailed) {
      setStatus("error");
      setMessage("Couldn't load the payment widget. Check your connection and reload the page.");
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      setStatus("error");
      setMessage("Payment widget is still loading — please try again in a moment.");
      return;
    }

    const order = await createFeaturedCreditOrderAction(quantity);
    if (!order.success) {
      setStatus("error");
      setMessage(order.error);
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      order_id: order.razorpayOrderId,
      amount: Math.round(order.amountRupees * 100),
      currency: "INR",
      name: "HyderabadNow",
      description: `${order.quantity} featured listing credit${order.quantity > 1 ? "s" : ""}`,
      prefill: { name: buyerName, email: buyerEmail },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const result = await verifyFeaturedCreditPaymentAction({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (result.success) {
          setStatus("success");
          setMessage(`${result.creditsAdded} credit${result.creditsAdded > 1 ? "s" : ""} added to your account.`);
        } else {
          setStatus("error");
          setMessage(result.error);
        }
      },
      modal: {
        ondismiss: () => {
          setStatus("idle");
        },
      },
    });
    razorpay.open();
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        onError={() => setScriptFailed(true)}
      />
      <h3 className="text-sm font-bold text-stone-900">Buy featured listing credits</h3>
      <p className="mt-1 text-xs text-stone-500">
        ₹{pricePerCredit} per credit. Spend 1 credit any time to feature one of your listings.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          Quantity
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-20 rounded-md border border-stone-200 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={handleBuy}
          disabled={status === "loading"}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {status === "loading" ? "Processing..." : `Pay ₹${pricePerCredit * quantity}`}
        </button>
      </div>

      {status === "error" && message && <p className="mt-2 text-xs text-red-600">{message}</p>}
      {status === "success" && message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}
    </div>
  );
}

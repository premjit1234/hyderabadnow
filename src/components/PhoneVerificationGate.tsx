"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { requestPhoneOtpAction, verifyPhoneOtpAction, type ActionState } from "@/app/actions";

// Sits in front of PostListingForm (see post-listing/page.tsx) until the
// current account's phone is OTP-verified (see users.phoneVerified /
// lib/whatsappOtp.ts — the code is sent over WhatsApp, not SMS, since that
// needs no DLT/TRAI registration) — a one-time step per account, not per
// listing. Renders `children` (the actual form, passed down
// already-instantiated from the server component) once verified, and the
// two-step phone/code flow otherwise.
export default function PhoneVerificationGate({
  initialVerified,
  initialPhone,
  children,
}: {
  initialVerified: boolean;
  initialPhone: string | null;
  children: ReactNode;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(initialPhone ?? "");

  const [requestState, requestAction, requesting] = useActionState<ActionState, FormData>(requestPhoneOtpAction, null);
  const [verifyState, verifyAction, verifying] = useActionState<ActionState, FormData>(verifyPhoneOtpAction, null);

  useEffect(() => {
    if (requestState?.success) setStep("code");
  }, [requestState]);

  useEffect(() => {
    if (verifyState?.success) setVerified(true);
  }, [verifyState]);

  if (verified) return <>{children}</>;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-5">
      <h2 className="text-base font-bold text-stone-900">Verify your phone number over WhatsApp</h2>
      <p className="mt-1 text-sm text-stone-500">
        A one-time step before you can post — this is what backs the &quot;Phone Verified&quot; badge buyers see next
        to your contact number, so it actually means something. Make sure the number below has WhatsApp active, since
        that&apos;s where we&apos;ll send your code.
      </p>

      {step === "phone" ? (
        <form action={requestAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-stone-700">Phone number</label>
            <input
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 98480 11223"
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={requesting}
            className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {requesting ? "Sending…" : "Send WhatsApp code"}
          </button>
        </form>
      ) : (
        <div className="mt-4">
          <form action={verifyAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-stone-700">
                6-digit code sent via WhatsApp to {phone}
              </label>
              <input
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {verifying ? "Verifying…" : "Verify"}
            </button>
          </form>
          <button type="button" onClick={() => setStep("phone")} className="mt-2 text-xs text-stone-500 hover:underline">
            Wrong number? Change it
          </button>
        </div>
      )}

      {(requestState?.error || verifyState?.error) && (
        <p className="mt-3 text-sm text-red-600">{requestState?.error || verifyState?.error}</p>
      )}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInquiryAction, type ActionState } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";

export default function InquiryForm({ listingId }: { listingId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createInquiryAction,
    null
  );

  // A submitted inquiry is the clearest "this visit turned into a lead"
  // signal this page has — report it once, the moment the server action
  // confirms success, so Google Ads/Meta can eventually attribute it back
  // to whichever ad or search query brought this visitor here (see
  // lib/analytics.ts). The ref guards against re-firing on an unrelated
  // re-render while state.success stays true.
  const reported = useRef(false);
  useEffect(() => {
    if (state?.success && !reported.current) {
      reported.current = true;
      trackEvent("generate_lead", { listingId });
    }
  }, [state?.success, listingId]);

  if (state?.success) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Your name</label>
        <input
          name="name"
          required
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Phone (optional)</label>
        <input name="phone" className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Message</label>
        <textarea
          name="message"
          required
          rows={3}
          defaultValue="Hi, I'm interested in this property. Please share more details."
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Contact lister"}
      </button>
    </form>
  );
}

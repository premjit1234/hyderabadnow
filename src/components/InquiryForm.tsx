"use client";

import { useActionState } from "react";
import { createInquiryAction, type ActionState } from "@/app/actions";

export default function InquiryForm({ listingId }: { listingId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createInquiryAction,
    null
  );

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
        className="rounded-md bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Contact lister"}
      </button>
    </form>
  );
}

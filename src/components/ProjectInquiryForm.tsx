"use client";

import { useActionState, useEffect, useRef } from "react";
import { createProjectInquiryAction, type ActionState } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";

export default function ProjectInquiryForm({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createProjectInquiryAction,
    null
  );

  // Same lead-reporting pattern as InquiryForm.tsx on the listing page — see
  // its comment for why this fires once, on the server action's own
  // confirmation rather than on form submit.
  const reported = useRef(false);
  useEffect(() => {
    if (state?.success && !reported.current) {
      reported.current = true;
      trackEvent("generate_lead", { projectId });
    }
  }, [state?.success, projectId]);

  if (state?.success) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Your name</label>
        <input name="name" required className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
        <input type="email" name="email" required className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" />
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
          defaultValue={`Hi, I'm interested in ${projectName}. Please share more details.`}
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Enquire about this project"}
      </button>
    </form>
  );
}

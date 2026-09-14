"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAreaUpdateCommentAction, type ActionState } from "@/app/actions";

// Same shape as BlogCommentForm, but comments here go live immediately (no
// "awaiting approval" messaging) — see the areaUpdateComments schema comment.
export default function AreaUpdateCommentForm({ areaUpdateId }: { areaUpdateId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createAreaUpdateCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="areaUpdateId" value={areaUpdateId} />
      <textarea
        name="content"
        required
        rows={2}
        maxLength={1000}
        placeholder="Add a comment…"
        className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto shrink-0 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  );
}

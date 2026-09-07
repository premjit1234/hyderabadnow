"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBlogCommentAction, type ActionState } from "@/app/actions";

export default function BlogCommentForm({ postId }: { postId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createBlogCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="content"
        required
        rows={3}
        maxLength={2000}
        placeholder="Share your thoughts…"
        className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-400">Comments are reviewed before they appear.</p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Posting..." : "Post comment"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
    </form>
  );
}

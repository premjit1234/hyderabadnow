"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAreaUpdateAction, type ActionState } from "@/app/actions";

export default function AreaUpdatePostForm({ localityGuideId }: { localityGuideId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createAreaUpdateAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border border-stone-200 p-4">
      <input type="hidden" name="localityGuideId" value={localityGuideId} />
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Share a neighborhood update</label>
        <textarea
          name="content"
          required
          rows={3}
          maxLength={1000}
          placeholder="e.g. New metro entrance opened near the main junction, a new restaurant opened on the main road…"
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Photos (up to 5, optional)</label>
        <input
          type="file"
          name="images"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post update"}
      </button>
    </form>
  );
}

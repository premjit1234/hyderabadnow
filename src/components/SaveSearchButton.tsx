"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveSearchAction, type ActionState } from "@/app/actions";

// The "Save this search" affordance on /browse (see app/(site)/browse/page.tsx,
// which computes currentQueryString from the exact searchParams it just
// rendered from). Collapsed into a single button until clicked, so it
// doesn't compete with the filter form above it — expands into a small
// inline label field + confirm, and shows the action's own success/error
// message afterwards rather than navigating away.
export default function SaveSearchButton({ userId, queryString }: { userId: number | null; queryString: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveSearchAction, null);

  if (userId == null) {
    return (
      <Link href="/login" className="text-xs font-medium text-emerald-700 hover:underline">
        Log in to save this search
      </Link>
    );
  }

  if (state?.success) {
    return <p className="text-xs font-medium text-emerald-700">{state.success}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
      >
        Save this search
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="queryString" value={queryString} />
      <input
        name="label"
        placeholder="Name this search (optional)"
        className="w-48 rounded-md border border-stone-200 px-2.5 py-1.5 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-stone-500 hover:underline"
      >
        Cancel
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

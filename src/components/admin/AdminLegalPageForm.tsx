"use client";

import { useActionState } from "react";
import { adminUpdateLegalPageAction, type ActionState } from "@/app/admin/actions";

type Page = { id: number; slug: string; title: string; content: string };

export default function AdminLegalPageForm({ page }: { page: Page }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(adminUpdateLegalPageAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="pageId" value={page.id} />

      <div className="flex items-center justify-between gap-4">
        <label className="flex-1 text-sm font-semibold text-stone-900">
          Title
          <input
            name="title"
            required
            defaultValue={page.title}
            className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm font-normal"
          />
        </label>
        <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
          /{page.slug}
        </span>
      </div>

      <label className="text-sm font-semibold text-stone-900">
        Content
        <textarea
          name="content"
          required
          rows={10}
          defaultValue={page.content}
          className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 font-mono text-xs font-normal leading-relaxed"
        />
      </label>
      <p className="text-xs text-stone-400">
        Plain text — leave a blank line between paragraphs, and start a line with &ldquo;## &rdquo; for a section
        heading. This is a general starting template, not legal advice — have a lawyer review it before relying on
        it.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      </div>
    </form>
  );
}

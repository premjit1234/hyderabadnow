"use client";

import { useActionState } from "react";
import {
  adminCreateSocialLinkAction,
  adminUpdateSocialLinkAction,
  type ActionState,
} from "@/app/admin/actions";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import SocialIcon from "@/components/SocialIcon";

type Link = { id: number; platform: string; label: string; url: string; sortOrder: number };

export default function AdminSocialLinkForm({ link }: { link?: Link }) {
  const action = link ? adminUpdateSocialLinkAction : adminCreateSocialLinkAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      {link && <input type="hidden" name="linkId" value={link.id} />}

      {link && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-600">
          <SocialIcon platform={link.platform} className="h-5 w-5" />
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          name="platform"
          required
          defaultValue={link?.platform ?? "x"}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        >
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          name="label"
          required
          placeholder="Label, e.g. HyderabadNow on X"
          defaultValue={link?.label}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          name="url"
          required
          type="url"
          placeholder="https://..."
          defaultValue={link?.url}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-1.5 text-xs text-stone-600">
          Order
          <input
            type="number"
            name="sortOrder"
            defaultValue={link?.sortOrder ?? 0}
            className="w-16 rounded-md border border-stone-200 px-2 py-1 text-xs"
          />
        </label>
      </div>

      <div className="flex flex-col items-end gap-1">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : link ? "Save" : "Add link"}
        </button>
        {state?.error && <p className="max-w-40 text-right text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-700">{state.success}</p>}
      </div>
    </form>
  );
}

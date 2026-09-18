"use client";

import { useActionState } from "react";
import { adminUpdateAdPlacementsAction, type ActionState } from "@/app/admin/actions";
import { AD_PLACEMENTS, type AdPlacementSettings } from "@/lib/adPlacements";

export default function AdminAdPlacementsForm({ settings }: { settings: AdPlacementSettings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(adminUpdateAdPlacementsAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {AD_PLACEMENTS.map((placement) => {
        const slot = settings[placement.key];
        return (
          <div key={placement.key} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-stone-900">{placement.label}</p>
                <p className="text-xs text-stone-500">{placement.description}</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-stone-600">
                <input
                  type="checkbox"
                  name={`enabled_${placement.key}`}
                  defaultChecked={slot.enabled}
                  className="h-4 w-4"
                />
                Live
              </label>
            </div>
            <textarea
              name={`code_${placement.key}`}
              defaultValue={slot.code}
              rows={6}
              placeholder='Paste the full ad unit code here, e.g. <script async src="https://pagead2.googlesyndication.com/..."></script><ins class="adsbygoogle" ...></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'
              spellCheck={false}
              className="w-full rounded-md border border-stone-200 px-3 py-2 font-mono text-xs text-stone-700"
            />
          </div>
        );
      })}

      <p className="text-xs text-stone-500">
        Pasted code is rendered exactly as given, scripts included — only admins can edit this, so it&apos;s treated
        as trusted the same way site settings and social links are, not sanitized like public content.
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

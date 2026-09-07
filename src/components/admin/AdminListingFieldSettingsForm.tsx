"use client";

import { useActionState } from "react";
import { adminUpdateListingFieldSettingsAction, type ActionState } from "@/app/admin/actions";
import { LISTING_EXTRA_FIELDS, type ListingFieldVisibility } from "@/lib/listingFields";

export default function AdminListingFieldSettingsForm({ settings }: { settings: ListingFieldVisibility }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    adminUpdateListingFieldSettingsAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Field</th>
              <th className="px-4 py-3">Visible on public listing page</th>
              <th className="px-4 py-3">Visible on post-listing form</th>
            </tr>
          </thead>
          <tbody>
            {LISTING_EXTRA_FIELDS.map((field) => (
              <tr key={field.key} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">{field.label}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    name={`public_${field.key}`}
                    defaultChecked={settings[field.key].public}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    name={`form_${field.key}`}
                    defaultChecked={settings[field.key].form}
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-500">
        Your own admin edit form always shows every field regardless of these settings — this only controls what
        buyers/renters see on the public listing page, and what agents/owners see on the public post-listing form.
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

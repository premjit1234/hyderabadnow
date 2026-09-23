"use client";

import { useActionState } from "react";
import { adminCreateLocationAction, adminUpdateLocationAction, type ActionState } from "@/app/admin/actions";

type Location = { id: number; name: string; sortOrder: number; featured?: boolean };

export default function AdminLocationForm({ location }: { location?: Location }) {
  const action = location ? adminUpdateLocationAction : adminCreateLocationAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      {location && <input type="hidden" name="locationId" value={location.id} />}

      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          name="name"
          required
          placeholder="e.g. Gachibowli"
          defaultValue={location?.name}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-1.5 text-xs text-stone-600">
          Order
          <input
            type="number"
            name="sortOrder"
            defaultValue={location?.sortOrder ?? 0}
            className="w-16 rounded-md border border-stone-200 px-2 py-1 text-xs"
          />
        </label>
      </div>

      <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-stone-600">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={location?.featured ?? false}
          className="h-3.5 w-3.5 rounded border-stone-300"
        />
        Featured (shows on /browse, up to 6)
      </label>

      <div className="flex flex-col items-end gap-1">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : location ? "Save" : "Add location"}
        </button>
        {state?.error && <p className="max-w-52 text-right text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-700">{state.success}</p>}
      </div>
    </form>
  );
}

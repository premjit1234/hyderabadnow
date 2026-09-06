"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  adminCreateHomeTileAction,
  adminUpdateHomeTileAction,
  type ActionState,
} from "@/app/admin/actions";

type Tile = { id: number; label: string; href: string; imageUrl: string | null; sortOrder: number };

export default function AdminHomeTileForm({ tile }: { tile?: Tile }) {
  const action = tile ? adminUpdateHomeTileAction : adminCreateHomeTileAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      {tile && <input type="hidden" name="tileId" value={tile.id} />}

      {tile?.imageUrl && (
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
          <Image src={tile.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="label"
          required
          placeholder="Tile label, e.g. New listings"
          defaultValue={tile?.label}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          name="href"
          required
          placeholder="Destination link, e.g. /browse?listingType=sale"
          defaultValue={tile?.href}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
        <input
          type="file"
          name="imageFile"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="rounded-md border border-stone-200 px-2 py-1.5 text-xs sm:col-span-2"
        />
        <input
          name="imageUrl"
          placeholder="...or paste an image URL instead"
          className="rounded-md border border-stone-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <div className="flex items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            Order
            <input
              type="number"
              name="sortOrder"
              defaultValue={tile?.sortOrder ?? 0}
              className="w-16 rounded-md border border-stone-200 px-2 py-1 text-xs"
            />
          </label>
          {tile?.imageUrl && (
            <label className="flex items-center gap-1.5 text-xs text-red-600">
              <input type="checkbox" name="removeImage" className="h-3.5 w-3.5" />
              Remove image
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <button
          type="submit"
          disabled={pending}
          className="whitespace-nowrap rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : tile ? "Save" : "Add tile"}
        </button>
        {state?.error && <p className="max-w-40 text-right text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-700">{state.success}</p>}
      </div>
    </form>
  );
}

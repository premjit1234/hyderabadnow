"use client";

import Image from "next/image";
import { useActionState } from "react";
import { adminSaveMicrositeFloorPlanAction, adminDeleteMicrositeFloorPlanAction, type ActionState } from "@/app/admin/micrositeActions";

const inputClass = "w-full rounded-md border border-stone-200 px-2.5 py-2 text-sm";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

export type EditableFloorPlan = {
  id: number;
  label: string;
  plotAreaSqyd: number | null;
  builtUpAreaSqft: number | null;
  bedrooms: string | null;
  virtualTourUrl: string | null;
  images: { id: number; url: string }[];
};

/** One villa/unit configuration card — handles both "add a new one" (no
 * `floorPlan` prop) and "edit this one" (with `floorPlan`), each as its own
 * self-contained <form>. See adminSaveMicrositeFloorPlanAction's own comment
 * for why this isn't folded into the main page form. */
export default function MicrositeFloorPlanForm({ pageId, floorPlan }: { pageId: number; floorPlan?: EditableFloorPlan }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(adminSaveMicrositeFloorPlanAction, null);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="pageId" value={pageId} />
        {floorPlan && <input type="hidden" name="floorPlanId" value={floorPlan.id} />}

        <div>
          <label className={labelClass}>Label</label>
          <input name="label" required defaultValue={floorPlan?.label} placeholder="e.g. East Facing Villa" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Plot area (sq yd)</label>
            <input type="number" step="0.01" name="plotAreaSqyd" defaultValue={floorPlan?.plotAreaSqyd ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Built-up area (sqft)</label>
            <input type="number" name="builtUpAreaSqft" defaultValue={floorPlan?.builtUpAreaSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bedrooms</label>
            <input name="bedrooms" defaultValue={floorPlan?.bedrooms ?? ""} placeholder="e.g. 4 BHK" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Virtual walkthrough URL</label>
            <input name="virtualTourUrl" defaultValue={floorPlan?.virtualTourUrl ?? ""} placeholder="https://…" className={inputClass} />
          </div>
        </div>

        {floorPlan && floorPlan.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {floorPlan.images.map((img) => (
              <div key={img.id} className="flex flex-col items-center gap-1">
                <div className="relative aspect-square w-full overflow-hidden rounded-md border border-stone-200">
                  <Image src={img.url} alt="" fill sizes="100px" className="object-cover" />
                </div>
                <label className="flex items-center gap-1 text-[11px] text-red-600">
                  <input type="checkbox" name="removeImageId" value={img.id} className="h-3 w-3" />
                  Remove
                </label>
              </div>
            ))}
          </div>
        )}
        <div>
          <label className={labelClass}>{floorPlan ? "Add plan images (up to 3 at a time)" : "Plan images (up to 3, e.g. Ground/First/Second floor)"}</label>
          <input type="file" name="images" accept="image/png,image/jpeg,image/webp" multiple className={inputClass} />
        </div>

        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-700">{state.success}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : floorPlan ? "Save configuration" : "Add configuration"}
        </button>
      </form>

      {floorPlan && (
        <form action={adminDeleteMicrositeFloorPlanAction} className="mt-2 border-t border-stone-100 pt-2">
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="floorPlanId" value={floorPlan.id} />
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Delete this configuration
          </button>
        </form>
      )}
    </div>
  );
}

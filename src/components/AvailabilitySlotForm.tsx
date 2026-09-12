"use client";

import { useActionState } from "react";
import { addAvailabilitySlotAction, type ActionState } from "@/app/actions";

// Owner/agent side of scheduled viewings — posts one new bookable slot for
// a listing. The datetime-local input has no timezone of its own; it's
// always treated as IST wall-clock time by addAvailabilitySlotAction (every
// owner using this form is managing a Hyderabad listing), which is why the
// label says so explicitly rather than leaving it ambiguous.
export default function AvailabilitySlotForm({ listingId }: { listingId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addAvailabilitySlotAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white p-4">
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Date &amp; time (IST)</label>
        <input
          type="datetime-local"
          name="startsAtIst"
          required
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Duration</label>
        <select name="durationMinutes" defaultValue="30" className="rounded-md border border-stone-200 px-3 py-2 text-sm">
          <option value="15">15 min</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600">Type</label>
        <select name="meetingType" defaultValue="video_call" className="rounded-md border border-stone-200 px-3 py-2 text-sm">
          <option value="video_call">Video call</option>
          <option value="in_person">In person</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add slot"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-emerald-700">{state.success}</p>}
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { bookAvailabilitySlotAction, type ActionState } from "@/app/actions";
import LocalTime from "@/components/LocalTime";

type Slot = { id: number; startsAt: string; durationMinutes: number; meetingType: string };

const MEETING_TYPE_LABEL: Record<string, string> = {
  video_call: "Video call",
  in_person: "In person",
};

// The buyer-facing half of the scheduled-viewings feature — a pick-a-slot
// list on the listing page. Each open slot renders in the *buyer's own*
// local time via LocalTime (client-side, so it actually reflects their
// browser's timezone) with the IST equivalent alongside for reference.
// Client component because picking a slot and revealing its booking form is
// pure client interaction; the slot list itself is fetched server-side and
// passed in as a prop.
export default function ScheduleViewingSection({ slots }: { slots: Slot[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(bookAvailabilitySlotAction, null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  if (state?.success) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {state.success}
      </div>
    );
  }

  if (slots.length === 0) {
    return <p className="text-sm text-stone-400">No viewing times posted yet — check back soon, or use the chat/message options above.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {slots.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setSelectedSlotId(s.id)}
          className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
            selectedSlotId === s.id ? "border-emerald-600 bg-emerald-50" : "border-stone-200 hover:border-emerald-300"
          }`}
        >
          <span className="font-medium text-stone-800">
            <LocalTime iso={s.startsAt} />
          </span>
          <span className="text-xs text-stone-500">
            {MEETING_TYPE_LABEL[s.meetingType] ?? s.meetingType} · {s.durationMinutes} min
          </span>
        </button>
      ))}

      {selectedSlotId != null && (
        <form action={formAction} className="mt-1 flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
          <input type="hidden" name="slotId" value={selectedSlotId} />
          <textarea
            name="note"
            rows={2}
            placeholder="Anything the lister should know? (optional)"
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
          />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getListingById, getSlotsForOwnerListing } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { cancelAvailabilitySlotAction } from "@/app/actions";
import AvailabilitySlotForm from "@/components/AvailabilitySlotForm";
import LocalTime from "@/components/LocalTime";

const MEETING_TYPE_LABEL: Record<string, string> = {
  video_call: "Video call",
  in_person: "In person",
};

// Owner/agent-facing counterpart to dashboard/listings/[id]/edit — same
// ownership-or-admin gate, reached from a "Viewings" link next to that
// listing's row on the main dashboard. Lets an owner post new bookable
// slots and see who's booked (or cancelled) each one.
export default async function ListingAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const listing = await getListingById(listingId);
  if (!listing) notFound();
  if (listing.ownerId !== session.id && session.role !== "admin") notFound();

  const slots = await getSlotsForOwnerListing(listingId);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/dashboard" className="mb-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
        ← Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-stone-900">Viewing availability</h1>
      <p className="mb-6 text-sm text-stone-500">
        {listing.title} — post times buyers (including NRIs in other timezones) can book a video call or in-person
        viewing. Each buyer sees these converted to their own local time automatically.
      </p>

      <div className="mb-6">
        <AvailabilitySlotForm listingId={listingId} />
      </div>

      {slots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No slots posted yet — add one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {slots.map((s) => (
            <div key={s.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    <LocalTime iso={s.startsAt} showIst={false} />
                  </p>
                  <p className="text-xs text-stone-500">
                    {MEETING_TYPE_LABEL[s.meetingType] ?? s.meetingType} · {s.durationMinutes} min
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    s.status === "booked"
                      ? "bg-emerald-100 text-emerald-800"
                      : s.status === "cancelled"
                        ? "bg-stone-100 text-stone-400"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.status === "booked" ? "Booked" : s.status === "cancelled" ? "Cancelled" : "Open"}
                </span>
              </div>

              {s.status === "booked" && s.buyer && (
                <div className="mt-2 rounded-md bg-stone-50 p-2.5 text-xs text-stone-600">
                  <p>
                    Booked by <span className="font-medium text-stone-800">{s.buyer.name}</span> ({s.buyer.email})
                  </p>
                  {s.buyerNote && <p className="mt-1">Note: {s.buyerNote}</p>}
                </div>
              )}

              {s.status !== "cancelled" && (
                <form action={cancelAvailabilitySlotAction} className="mt-2">
                  <input type="hidden" name="slotId" value={s.id} />
                  <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                    Cancel this slot
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

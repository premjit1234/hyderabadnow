// Transactional emails for scheduled-viewing bookings (see
// db/schema.ts's availabilitySlots and the book/cancel actions in
// app/actions.ts) — sent via the same Resend wrapper staleListings.ts uses
// for its "still listed?" nudge (lib/email.ts), so a missing/misconfigured
// RESEND_API_KEY fails soft here too rather than blocking the booking
// itself.
//
// Email can't auto-convert to "the recipient's local time" the way the
// listing page does (components/LocalTime.tsx runs in the visitor's own
// browser) — a static HTML email has no idea who's reading it or from
// where. So every time shown here is explicitly labelled IST, and the
// email links back to the site where the buyer's browser will show the
// same slot converted to their own local time.
import { sendEmail } from "./email";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function formatIst(startsAt: string): string {
  return new Date(startsAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MEETING_TYPE_LABEL: Record<string, string> = {
  video_call: "video call",
  in_person: "in-person visit",
};

export async function sendBookingConfirmedEmails(opts: {
  listingTitle: string;
  listingUrl: string;
  startsAt: string;
  meetingType: string;
  buyerName: string;
  buyerEmail: string;
  buyerNote: string | null;
  ownerName: string;
  ownerEmail: string;
}) {
  const when = formatIst(opts.startsAt);
  const meeting = MEETING_TYPE_LABEL[opts.meetingType] ?? opts.meetingType;

  await Promise.all([
    sendEmail({
      to: opts.buyerEmail,
      subject: `Confirmed: viewing for "${opts.listingTitle}" on ${when} IST`,
      html: `
        <p>Hi ${escapeHtml(opts.buyerName)},</p>
        <p>Your ${meeting} for "<strong>${escapeHtml(opts.listingTitle)}</strong>" is confirmed for
           <strong>${when} (India Standard Time)</strong> with ${escapeHtml(opts.ownerName)}.</p>
        <p><a href="${opts.listingUrl}" style="color:#047857;">View the listing</a> — the page shows this same time
           converted to whatever timezone your device is set to.</p>
        <p style="color:#78716c;font-size:13px;">Need to reschedule or cancel? You can do that from the listing page.</p>
      `,
    }),
    sendEmail({
      to: opts.ownerEmail,
      subject: `New viewing booked: "${opts.listingTitle}" on ${when} IST`,
      html: `
        <p>Hi ${escapeHtml(opts.ownerName)},</p>
        <p>${escapeHtml(opts.buyerName)} (${escapeHtml(opts.buyerEmail)}) just booked a ${meeting} for
           "<strong>${escapeHtml(opts.listingTitle)}</strong>" at <strong>${when} (IST)</strong>.</p>
        ${opts.buyerNote ? `<p>Note from the buyer: "${escapeHtml(opts.buyerNote)}"</p>` : ""}
        <p><a href="${opts.listingUrl}" style="color:#047857;">View the listing</a></p>
      `,
    }),
  ]);
}

export async function sendBookingCancelledEmail(opts: {
  listingTitle: string;
  startsAt: string;
  recipientName: string;
  recipientEmail: string;
  cancelledByOwner: boolean;
}) {
  const when = formatIst(opts.startsAt);
  await sendEmail({
    to: opts.recipientEmail,
    subject: `Cancelled: viewing for "${opts.listingTitle}" on ${when} IST`,
    html: `
      <p>Hi ${escapeHtml(opts.recipientName)},</p>
      <p>The viewing for "<strong>${escapeHtml(opts.listingTitle)}</strong>" scheduled for
         <strong>${when} (India Standard Time)</strong> has been cancelled
         ${opts.cancelledByOwner ? "by the lister" : "by the buyer"}.</p>
    `,
  });
}

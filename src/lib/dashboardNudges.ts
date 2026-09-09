// Pure helper for the actionable-nudges panel on the logged-in dashboard
// (src/app/(site)/dashboard/page.tsx) — no DB access itself, just turns data
// the page already fetched into a short list of things worth the owner's
// attention. Kept separate from the page so the logic is easy to unit-test
// and to read on its own.
export type DashboardNudge = {
  id: string;
  tone: "warning" | "info";
  message: string;
  actionHref?: string;
  actionLabel?: string;
};

type NudgeListing = {
  status: string;
  verified: boolean;
  views: number;
  createdAt: string;
};

// A listing with zero views this long after posting is worth flagging —
// long enough that "nobody's found it yet" is a real signal, not just "it
// went up an hour ago."
const NO_VIEWS_AFTER_DAYS = 14;

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

export function computeDashboardNudges({
  listings,
  phoneVerified,
}: {
  listings: NudgeListing[];
  phoneVerified: boolean;
}): DashboardNudge[] {
  const nudges: DashboardNudge[] = [];

  if (!phoneVerified) {
    nudges.push({
      id: "phone-unverified",
      tone: "warning",
      message: "Your phone isn't verified yet. Verified sellers show a trust badge buyers can see on every listing.",
      actionHref: "/post-listing",
      actionLabel: "Verify over WhatsApp",
    });
  }

  const active = listings.filter((l) => l.status === "active" || l.status === "pending");

  const unverifiedActive = active.filter((l) => !l.verified).length;
  if (unverifiedActive > 0) {
    nudges.push({
      id: "listings-pending-review",
      tone: "info",
      message:
        unverifiedActive === 1
          ? "1 of your listings hasn't been reviewed for the “Verified” badge yet. Our team typically reviews new listings within a few days."
          : `${unverifiedActive} of your listings haven't been reviewed for the “Verified” badge yet. Our team typically reviews new listings within a few days.`,
    });
  }

  const quiet = active.filter((l) => l.views === 0 && daysSince(l.createdAt) >= NO_VIEWS_AFTER_DAYS).length;
  if (quiet > 0) {
    nudges.push({
      id: "no-views",
      tone: "warning",
      message:
        quiet === 1
          ? `1 listing hasn't had a single view in ${NO_VIEWS_AFTER_DAYS}+ days. Consider adding more photos, double-checking the price, or sharing the link directly.`
          : `${quiet} listings haven't had a single view in ${NO_VIEWS_AFTER_DAYS}+ days. Consider adding more photos, double-checking the price, or sharing the link directly.`,
    });
  }

  const expired = listings.filter((l) => l.status === "expired").length;
  if (expired > 0) {
    nudges.push({
      id: "expired-listings",
      tone: "info",
      message:
        expired === 1
          ? "1 listing is marked expired after going quiet. Still available? Relist it below."
          : `${expired} listings are marked expired after going quiet. Still available? Relist them below.`,
    });
  }

  return nudges;
}

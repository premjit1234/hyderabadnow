"use client";

import { trackEvent, type TrackEventName } from "@/lib/analytics";

// A plain <a> that reports a conversion event on click before letting the
// browser follow the link as normal (tel:/wa.me links navigate away or open
// another app, so there's no "after" moment to hook into server-side — the
// click itself is the only signal available). Used for the listing page's
// "Connect on WhatsApp" and phone-number links (see listing/[id]/page.tsx)
// so, once ads are running, a click-through that leads to a real contact
// attempt can actually be counted as a conversion, not just a pageview.
export default function TrackedContactLink({
  href,
  event,
  className,
  target,
  rel,
  children,
}: {
  href: string;
  event: TrackEventName;
  className?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => trackEvent(event)}
    >
      {children}
    </a>
  );
}

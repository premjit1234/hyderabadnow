// Client-side tracking helper — a thin, safe wrapper around whatever
// tracking scripts app/layout.tsx conditionally loaded (GA4's gtag.js,
// Meta's fbq, both driven by siteSettings.gaMeasurementId/metaPixelId — see
// SiteSettingsForm.tsx's "Marketing & analytics" card). Call this from any
// "use client" component at the moment a real lead signal happens —
// submitting the inquiry form, clicking "Connect on WhatsApp", tapping the
// phone number — so that once ads are running, Google Ads/Meta can actually
// tell which clicks turned into a lead instead of only counting pageviews.
//
// Safe to call unconditionally, everywhere, regardless of whether any
// tracking is configured: every call is guarded by a typeof/feature check,
// so with no IDs set (the default) this is a complete no-op.
export type TrackEventName = "generate_lead" | "whatsapp_click" | "phone_click" | "share_click";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: TrackEventName, params?: Record<string, string | number | undefined>): void {
  if (typeof window === "undefined") return;

  try {
    // GA4 — standard gtag 'event' call. Also fires the Google Ads
    // conversion tag at the same moment, when one is configured: Google
    // Ads reads the AW- tag's own conversion events separately from GA4's,
    // but both ride on the same gtag() queue once the base tag is loaded
    // (see app/layout.tsx), so one call here covers both.
    window.gtag?.("event", name, params);
  } catch {
    // Never let a tracking call break the actual feature it's attached to.
  }

  try {
    // Meta Pixel — map our event names onto Meta's own standard event
    // vocabulary where one exists, so Ads Manager's built-in reporting
    // recognizes them (custom names still work, just without that).
    const metaStandardEvent =
      name === "generate_lead" ? "Lead" : name === "whatsapp_click" || name === "phone_click" ? "Contact" : null;
    if (metaStandardEvent) {
      window.fbq?.("track", metaStandardEvent, params);
    } else {
      window.fbq?.("trackCustom", name, params);
    }
  } catch {
    // Same reasoning as above.
  }
}

"use client";

import { useState } from "react";

function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );
}

// Sits next to the "Connect on WhatsApp" button on a listing page (see
// listing/[id]/page.tsx) so a visitor can pass the listing along even when
// they're not the one contacting the owner — turning every viewer into a
// possible distribution channel, not just an inquiry.
//
// Uses the Web Share API where the browser supports it, which opens the
// device's native share sheet (WhatsApp, SMS, Instagram DM, etc. — whatever
// the visitor already has installed) rather than limiting them to WhatsApp
// specifically. Falls back to copying a WhatsApp-ready line ("title — url")
// to the clipboard on desktop browsers that don't support it.
//
// Feature detection (navigator.share, navigator.clipboard) only happens
// inside the click handler, never at render time — window/navigator don't
// exist during SSR, so checking them while rendering would make the
// server-rendered markup and the hydrated client markup disagree.
export default function ShareListingButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // Visitor cancelled the native share sheet, or the browser refused —
        // either way, fall through to copy so the click still does something.
      }
    }
    try {
      await navigator.clipboard.writeText(`${title} — ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions, insecure context) — nothing more we
      // can safely do without a visible fallback UI; the click just no-ops.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      data-testid="share-listing-button"
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-stone-200 py-2 text-sm font-medium text-stone-600 hover:border-emerald-600 hover:text-emerald-700"
    >
      <ShareIcon className="h-4 w-4" />
      {copied ? "Link copied!" : "Share this listing"}
    </button>
  );
}

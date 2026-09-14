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

// Compact sibling of ShareListingButton (see that file for why: Web Share API
// where supported, clipboard-copy fallback otherwise) — sized as a small
// icon button rather than a full-width one, since it sits in the header of
// an already-busy area-update card alongside the author name and date.
export default function AreaUpdateShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // Visitor cancelled the native share sheet, or the browser refused —
        // fall through to copy so the click still does something.
      }
    }
    try {
      await navigator.clipboard.writeText(`${title} — ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — no safe fallback UI here, click just no-ops.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Share this update"
      className="flex shrink-0 items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-500 hover:border-emerald-600 hover:text-emerald-700"
    >
      <ShareIcon className="h-3.5 w-3.5" />
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16V5a1 1 0 0 1 1-1h11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A one-click "promote this" panel — auto-generates the caption (see
// lib/socialCaption.ts) and opens each platform's own public share-intent
// URL (no API key, app review, or account connection needed for any of
// these; that's exactly why they're plain links rather than real API
// calls). Used on the owner/agent listing-edit page and the admin blog
// edit page, right where someone naturally lands immediately after posting
// or publishing something — the moment they're most likely to actually
// share it.
//
// X, Facebook, and LinkedIn's share intents only accept a URL (X also takes
// pre-filled text; Facebook and LinkedIn pull their own preview from the
// page's OG tags and ignore any text passed in), so the full caption is
// always offered as a one-click copy for pasting into WhatsApp Status,
// Instagram, or wherever the text itself is needed verbatim.
export default function PromoteShareLinks({ url, caption }: { url: string; caption: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      trackEvent("share_click", { channel: "copy_caption" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions, insecure context) — nothing more we
      // can safely do without a visible fallback UI; the click just no-ops.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedCaption = encodeURIComponent(caption);

  const links = [
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodedCaption}` },
    { key: "x", label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodedCaption}` },
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-stone-900">Promote this</h3>
      <p className="mt-1 text-xs text-stone-500">
        Ready-made caption below — one click opens each platform with it pre-filled (or copy it for WhatsApp
        Status/Instagram).
      </p>

      <pre className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-stone-50 p-3 font-sans text-xs text-stone-600">
        {caption}
      </pre>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyCaption}
          className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-indigo-500 hover:text-indigo-600"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy caption"}
        </button>
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("share_click", { channel: l.key })}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:from-indigo-700 hover:to-violet-700"
          >
            Share to {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

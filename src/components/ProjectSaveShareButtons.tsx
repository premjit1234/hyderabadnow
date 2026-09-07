"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hn_saved_projects";

function readSavedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private browsing / storage disabled — the button still works for this
    // page view, it just won't remember the choice next visit.
  }
}

function HeartIcon({ filled, ...props }: React.SVGProps<SVGSVGElement> & { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} {...props}>
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.1C.6 8 1.8 4.6 5 3.6c2-.6 4 .1 5.3 1.9L12 7.2l1.7-1.7c1.3-1.8 3.3-2.5 5.3-1.9 3.2 1 4.4 4.4 2.8 7.8-2.3 4.5-9.8 9.1-9.8 9.1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" strokeLinecap="round" />
    </svg>
  );
}

/** Client-side "shortlist" + "share" controls for a project detail page.
 * Saving is anonymous, per-browser localStorage (no account needed) — good
 * enough for "let me come back to this later" without a whole favorites
 * schema/table. Share uses the native share sheet on devices that support
 * it, falling back to copying the link. */
export default function ProjectSaveShareButtons({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(readSavedIds().includes(projectId));
  }, [projectId]);

  function toggleSaved() {
    const ids = readSavedIds();
    const next = ids.includes(projectId) ? ids.filter((id) => id !== projectId) : [...ids, projectId];
    writeSavedIds(next);
    setSaved(next.includes(projectId));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: projectName, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently no-op rather than error.
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={saved}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition ${
          saved
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-stone-200 text-stone-700 hover:border-rose-200 hover:text-rose-600"
        }`}
      >
        <HeartIcon filled={saved} className="h-4 w-4 shrink-0" />
        {saved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={share}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
      >
        <ShareIcon className="h-4 w-4 shrink-0" />
        {copied ? "Link copied!" : "Share"}
      </button>
    </div>
  );
}

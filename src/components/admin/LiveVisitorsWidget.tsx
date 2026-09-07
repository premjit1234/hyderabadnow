"use client";

import { useEffect, useState } from "react";
import { getLiveVisitorCountAction } from "@/app/admin/actions";

const POLL_MS = 15_000;

// Seeded with the server-rendered count from the page's first load (no
// flash of "0"), then re-fetches on an interval so the number in front of
// the admin keeps moving without them reloading the page.
export default function LiveVisitorsWidget({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const n = await getLiveVisitorCountAction();
        if (!cancelled) setCount(n);
      } catch {
        // Best-effort — keep showing the last known count on a failed poll.
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">People on the site right now</p>
      </div>
      <p className="mt-2 text-4xl font-bold text-stone-900">{count.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-xs text-stone-400">Active in the last 5 minutes · updates automatically</p>
    </div>
  );
}

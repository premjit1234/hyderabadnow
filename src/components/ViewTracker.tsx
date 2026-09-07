"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordPageViewAction } from "@/app/actions";

const VISITOR_COOKIE = "hn_vid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// A long-lived, anonymous per-browser id — not a session/auth cookie, just
// lets the admin Analytics page dedupe "how many distinct people are on the
// site right now". Read/written with plain document.cookie (no server round
// trip needed) since it carries no sensitive data.
function getOrCreateVisitorId(): string {
  const match = document.cookie.match(/(?:^|;\s*)hn_vid=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const id = crypto.randomUUID();
  document.cookie = `${VISITOR_COOKIE}=${id}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  return id;
}

// Mounted once in app/(site)/layout.tsx — the public site's shared layout —
// so it never fires for /admin (a sibling route group with its own layout).
// It renders nothing; it just records one page view per pathname change.
// A layout persists across client-side navigations rather than remounting,
// so this fires from a usePathname()-keyed effect (not on mount) to catch
// every soft <Link> navigation, not just the first hard page load.
export default function ViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    const visitorId = getOrCreateVisitorId();
    recordPageViewAction(pathname, visitorId).catch(() => {
      // Best-effort analytics — a failed beacon shouldn't surface to the visitor.
    });
  }, [pathname]);

  return null;
}

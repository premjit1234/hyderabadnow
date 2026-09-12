"use client";

import { useEffect, useState } from "react";

// Renders a UTC ISO instant in whichever timezone the VIEWER's own browser
// is set to — the entire point of storing availabilitySlots.startsAt as a
// plain UTC instant (see schema.ts's comment on that table). A server
// component can't do this: it would render in the server's own timezone,
// which defeats the purpose for an NRI buyer checking a Hyderabad listing
// from a different timezone. The IST reference alongside is for the other
// side of that same conversation — the agent posting the slot is almost
// always in India and thinks in IST regardless of what the buyer sees.
//
// Deferred to after mount rather than computed on first render: this is a
// "use client" component, but Next still server-renders it once for the
// initial HTML — using the server process's own timezone, not the
// visitor's — so computing the local time immediately would render one
// value on the server and a different one the moment React hydrates on the
// visitor's actual browser, a hydration mismatch. Waiting for `mounted`
// means the very first paint (server AND the client's first render, before
// hydration settles) shows an identical neutral placeholder, and the real
// local time appears an instant later once we know we're in the browser.
export default function LocalTime({ iso, showIst = true }: { iso: string; showIst?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Deliberate use of an effect purely to detect "we're now running in
    // the browser, post-hydration" — there's no other way to distinguish
    // that from "still on the server-rendered/first-paint HTML", which is
    // exactly the distinction this component needs (see the comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  if (!mounted) {
    return <span className="text-stone-400">…</span>;
  }

  const local = date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const ist = date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <span>
      {local}
      {showIst && <span className="ml-1 text-stone-400">({ist} IST)</span>}
    </span>
  );
}

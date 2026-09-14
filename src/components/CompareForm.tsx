"use client";

import { useState, type ReactNode } from "react";

// Wraps the /projects grid — each card renders its own plain checkbox named
// "ids" (see that page), and this just listens for change events bubbling up
// (React's synthetic events do this naturally, so the checkboxes themselves
// don't need to be client components) to show a live "N selected" count and
// gate the submit button to the 2-5 range a comparison table actually needs.
// The form itself is a plain GET to /projects/compare — with JS disabled it
// still works, just without the live count/gating (the compare page itself
// re-validates and gracefully caps at 5 either way).
export default function CompareForm({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  function handleChange(e: React.ChangeEvent<HTMLFormElement>) {
    setCount(e.currentTarget.querySelectorAll('input[name="ids"]:checked').length);
  }

  return (
    <form method="GET" action="/projects/compare" onChange={handleChange}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2.5">
        <p className="text-sm text-stone-600">
          {count === 0
            ? "Select 2-5 projects below to compare specs and pricing."
            : `${count} project${count === 1 ? "" : "s"} selected${count > 5 ? " — pick at most 5" : count === 1 ? " — pick at least one more" : ""}.`}
        </p>
        <button
          type="submit"
          disabled={count < 2 || count > 5}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare selected
        </button>
      </div>
      {children}
    </form>
  );
}

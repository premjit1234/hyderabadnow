"use client";

import { useState } from "react";
import Link from "next/link";

// The desktop nav (Buy/Rent/Sell/Projects/Blog/...) is `hidden md:flex` in
// Header.tsx — below that breakpoint there was previously no way to reach
// any of those links at all, just the logo and a Sign up button. This is
// the mobile replacement: a hamburger button that drops down a full list of
// the same links, shown only below `md` (mirrors the desktop nav's
// breakpoint exactly so exactly one of the two is ever visible).
type NavItem = { href: string; label: string };

export default function MobileNav({
  navItems,
  session,
  logoutAction,
}: {
  navItems: NavItem[];
  session: { name: string } | null;
  logoutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-auto md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md text-stone-700 hover:bg-stone-100"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-stone-200 bg-white shadow-sm">
          <nav className="flex flex-col px-4 py-2 text-[15px] font-medium text-stone-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-stone-100 py-3 last:border-b-0 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col border-t border-stone-200 pt-2">
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="py-3 hover:text-emerald-700">
                    {session.name.split(" ")[0]}&apos;s account
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className="w-full py-3 text-left hover:text-emerald-700">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="py-3 hover:text-emerald-700">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="py-3 hover:text-emerald-700">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

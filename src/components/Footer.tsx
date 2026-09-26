import Link from "next/link";
import { getLegalPages, getSocialLinks } from "@/db/queries";
import SocialIcon from "@/components/SocialIcon";

// Same "Explore" links as Header's nav — kept as a small local constant
// rather than importing Header's own list (Header composes it with
// session-dependent items like "My listings"/"Messages" that don't belong
// in a public, session-agnostic footer).
const EXPLORE_LINKS = [
  { href: "/browse?listingType=sale", label: "Buy" },
  { href: "/browse?listingType=rent", label: "Rent" },
  { href: "/post-listing", label: "Sell" },
  { href: "/projects", label: "Projects" },
  { href: "/areas", label: "Neighborhood guides" },
  { href: "/blog", label: "Blog" },
];

export default async function Footer() {
  const [legalPages, socialLinks] = await Promise.all([getLegalPages(), getSocialLinks()]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-800 bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-sm font-bold text-white">
                H
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                hyderabad<span className="text-emerald-400">now</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">
              Property listings for Hyderabad, posted directly by agents and owners — no middlemen, no hidden
              brokerage.
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 text-stone-400 transition hover:border-emerald-500 hover:text-emerald-400"
                  >
                    <SocialIcon platform={link.platform} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-stone-400 transition hover:text-emerald-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {legalPages.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white">Legal</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {legalPages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/${page.slug}`} className="text-stone-400 transition hover:text-emerald-400">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row sm:justify-between">
          <p>© {year} HyderabadNow. All rights reserved.</p>
          <p>Made for Hyderabad&apos;s homebuyers and tenants.</p>
        </div>
      </div>
    </footer>
  );
}

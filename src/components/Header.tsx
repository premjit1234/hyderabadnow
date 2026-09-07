import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSiteSettings, getSocialLinks } from "@/db/queries";
import { logoutAction } from "@/app/actions";
import SocialIcon from "@/components/SocialIcon";

export default async function Header() {
  const [session, { logoUrl }, socialLinks] = await Promise.all([
    getSession(),
    getSiteSettings(),
    getSocialLinks(),
  ]);
  const canPost = session && (session.role === "agent" || session.role === "seller" || session.role === "admin");

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      {/* A slim utility bar for social links at the very top of the page,
          separate from the matching row in the footer — hidden entirely
          when no links are configured, and hidden on mobile to keep the
          header compact there (same pattern as the nav items below). */}
      {socialLinks.length > 0 && (
        <div className="hidden border-b border-stone-100 bg-stone-50 sm:block">
          <div className="mx-auto flex max-w-7xl justify-end gap-3 px-4 py-1.5 sm:px-6">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-stone-400 transition hover:text-emerald-700"
              >
                <SocialIcon platform={link.platform} className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logoUrl ? (
            <span className="relative block h-9 w-auto min-w-[36px]">
              {/* Admin-uploaded logo — unknown dimensions, so an intrinsic-size
                  <img> (not next/image's fill/width-height modes) fits the header
                  height while keeping the image's own aspect ratio. */}
              <img src={logoUrl} alt="HyderabadNow" className="h-9 w-auto object-contain" />
            </span>
          ) : (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-700 text-sm font-bold text-white">
                H
              </span>
              <span className="text-lg font-bold tracking-tight text-stone-900">
                hyderabad<span className="text-emerald-700">now</span>
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-6 text-[15px] font-medium text-stone-700 md:flex">
          <Link href="/browse?listingType=sale" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
            Buy
          </Link>
          <Link href="/browse?listingType=rent" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
            Rent
          </Link>
          <Link href="/post-listing" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
            Sell
          </Link>
          <Link href="/browse" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
            All listings
          </Link>
          <Link href="/projects" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
            Projects
          </Link>
          {canPost && (
            <Link href="/dashboard" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
              My listings
            </Link>
          )}
          {session?.role === "admin" && (
            <Link href="/admin" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4 text-[15px]">
              <Link href="/dashboard" className="hidden font-medium text-stone-700 hover:text-emerald-700 sm:inline">
                {session.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button className="font-medium text-stone-700 hover:text-stone-950" type="submit">
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden text-[15px] font-medium text-stone-700 hover:text-stone-950 sm:inline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-stone-900 px-4 py-2 text-[15px] font-semibold text-white hover:bg-stone-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

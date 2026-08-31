import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export default async function Header() {
  const session = await getSession();
  const canPost = session && (session.role === "agent" || session.role === "seller" || session.role === "admin");

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-700 text-sm font-bold text-white">
            H
          </span>
          <span className="text-lg font-bold tracking-tight text-stone-900">
            hyderabad<span className="text-emerald-700">now</span>
          </span>
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
          {canPost && (
            <Link href="/dashboard" className="border-b-2 border-transparent py-1 hover:border-emerald-700 hover:text-emerald-800">
              My listings
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

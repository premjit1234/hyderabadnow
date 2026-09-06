import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import AdminNavLink from "@/components/admin/AdminNavLink";

const NAV = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/projects", label: "Projects", icon: "layers" },
  { href: "/admin/listings", label: "Listings", icon: "building" },
  { href: "/admin/home-tiles", label: "Homepage tiles", icon: "image" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "mail" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-stone-100 text-stone-900">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-slate-900 text-slate-200 lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 text-sm font-bold text-white">
            H
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">hyderabadnow</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Admin</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {NAV.map((item) => (
            <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="border-t border-slate-800 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ← View site
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-bold text-stone-900 lg:hidden">
            hyderabadnow <span className="text-indigo-600">admin</span>
          </Link>
          <nav className="flex items-center gap-4 overflow-x-auto text-sm font-medium text-stone-500 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 hover:text-indigo-600">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-stone-900">{session.name}</p>
              <p className="text-xs leading-tight text-stone-500">{session.email}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {session.name.charAt(0).toUpperCase()}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300 hover:text-stone-900"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

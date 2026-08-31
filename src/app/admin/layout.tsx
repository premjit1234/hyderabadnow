import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center gap-6 border-b border-stone-200 pb-4">
        <h1 className="text-xl font-bold text-stone-900">Admin</h1>
        <nav className="flex gap-5 text-sm font-medium text-stone-600">
          <Link href="/admin" className="hover:text-emerald-700">
            Overview
          </Link>
          <Link href="/admin/users" className="hover:text-emerald-700">
            Users
          </Link>
          <Link href="/admin/listings" className="hover:text-emerald-700">
            Listings
          </Link>
        </nav>
      </div>
      {children}
    </main>
  );
}

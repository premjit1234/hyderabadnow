import Link from "next/link";
import { getAdminStats } from "@/db/queries";

const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyers",
  agent: "Agents",
  seller: "Owners",
  admin: "Admins",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  sold: "Sold",
  rented: "Rented",
};

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:border-emerald-600 hover:shadow-sm">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total users" value={stats.totalUsers} href="/admin/users" />
        <StatCard label="Total listings" value={stats.totalListings} href="/admin/listings" />
        <StatCard label="Total inquiries" value={stats.totalInquiries} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Users by role</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.usersByRole.map((r) => (
            <StatCard key={r.role} label={ROLE_LABELS[r.role] ?? r.role} value={r.n} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Listings by status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.listingsByStatus.map((s) => (
            <StatCard key={s.status} label={STATUS_LABELS[s.status] ?? s.status} value={s.n} />
          ))}
        </div>
      </div>
    </div>
  );
}

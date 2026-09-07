import { getAdminStats, getLiveVisitorCount } from "@/db/queries";
import StatCard from "@/components/admin/StatCard";

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

export default async function AdminOverviewPage() {
  const [stats, liveVisitors] = await Promise.all([getAdminStats(), getLiveVisitorCount()]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Overview</h1>
        <p className="mt-1 text-sm text-stone-500">A snapshot of everything on HyderabadNow.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} href="/admin/users" />
        <StatCard label="Total listings" value={stats.totalListings} href="/admin/listings" />
        <StatCard label="Total inquiries" value={stats.totalInquiries} href="/admin/inquiries" />
        {/* Snapshot as of this page load — see /admin/analytics for the
            auto-refreshing version and daily/weekly/monthly/yearly traffic. */}
        <StatCard label="On site right now" value={liveVisitors} href="/admin/analytics" />
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Users by role</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.usersByRole.map((r) => (
            <StatCard key={r.role} label={ROLE_LABELS[r.role] ?? r.role} value={r.n} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Listings by status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.listingsByStatus.map((s) => (
            <StatCard key={s.status} label={STATUS_LABELS[s.status] ?? s.status} value={s.n} />
          ))}
        </div>
      </div>
    </div>
  );
}

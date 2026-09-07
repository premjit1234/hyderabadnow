import { getLiveVisitorCount, getPageViewStats, getDailyPageViewSeries } from "@/db/queries";
import StatCard from "@/components/admin/StatCard";
import LiveVisitorsWidget from "@/components/admin/LiveVisitorsWidget";
import DailyViewsChart from "@/components/admin/DailyViewsChart";

export default async function AdminAnalyticsPage() {
  const [liveCount, stats, series] = await Promise.all([
    getLiveVisitorCount(),
    getPageViewStats(),
    getDailyPageViewSeries(14),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Analytics</h1>
        <p className="mt-1 text-sm text-stone-500">
          Traffic across the public site — every page except /admin.
        </p>
      </div>

      <LiveVisitorsWidget initialCount={liveCount} />

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Page views</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Today" value={stats.today.toLocaleString("en-IN")} />
          <StatCard label="This week" value={stats.week.toLocaleString("en-IN")} />
          <StatCard label="This month" value={stats.month.toLocaleString("en-IN")} />
          <StatCard label="This year" value={stats.year.toLocaleString("en-IN")} />
        </div>
        <p className="mt-2 text-xs text-stone-400">
          Each figure is "to date" — this week since Monday, this month since the 1st, this year since 1 January. All-time total: {stats.allTime.toLocaleString("en-IN")}.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Page views — last 14 days</h2>
        <DailyViewsChart series={series} />
      </div>
    </div>
  );
}

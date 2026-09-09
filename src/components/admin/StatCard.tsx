import Link from "next/link";

// Shared by the admin Overview/Analytics pages AND the logged-in-user
// dashboard (src/app/(site)/dashboard/page.tsx) so their stat tiles stay
// visually identical — kept in components/admin for historical reasons
// (that's where it was first written) even though it has no admin-specific
// behavior; imported cross-folder from the dashboard rather than moved, to
// avoid leaving a stale duplicate file behind on disk.
export default function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:-translate-y-0.5 hover:shadow-md">
      {content}
    </Link>
  ) : (
    content
  );
}

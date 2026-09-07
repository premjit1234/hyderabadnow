import Link from "next/link";

// Shared by the Overview and Analytics admin pages so their stat tiles stay
// visually identical.
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

import Link from "next/link";
import type { listings } from "@/db/schema";
import type { ListViewFieldDef } from "@/lib/listViewFields";
import type { ListViewSearchParams } from "@/lib/listViewUrl";
import ListViewTable from "@/components/ListViewTable";

type ListingRow = typeof listings.$inferSelect;

export default function ListingsListView({
  rows,
  fields,
  sp,
}: {
  rows: ListingRow[];
  fields: ListViewFieldDef[];
  sp: ListViewSearchParams;
}) {
  return (
    <ListViewTable
      rows={rows}
      fields={fields}
      sp={sp}
      basePath="/browse"
      titleLabel="Title"
      emptyMessage="No listings match the current filters."
      renderTitle={(row) => (
        <Link href={`/listing/${row.id}`} className="hover:underline">
          {row.title}
        </Link>
      )}
    />
  );
}

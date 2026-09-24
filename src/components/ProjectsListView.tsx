import Link from "next/link";
import type { projects } from "@/db/schema";
import type { ListViewFieldDef } from "@/lib/listViewFields";
import type { ListViewSearchParams } from "@/lib/listViewUrl";
import { projectHref } from "@/lib/format";
import ListViewTable from "@/components/ListViewTable";

type ProjectRow = typeof projects.$inferSelect;

export default function ProjectsListView({
  rows,
  fields,
  sp,
}: {
  rows: ProjectRow[];
  fields: ListViewFieldDef[];
  sp: ListViewSearchParams;
}) {
  return (
    <ListViewTable
      rows={rows}
      fields={fields}
      sp={sp}
      basePath="/projects"
      titleLabel="Name"
      emptyMessage="No projects match the current filters."
      renderTitle={(row) => (
        <Link href={projectHref(row)} className="hover:underline">
          {row.name}
        </Link>
      )}
    />
  );
}

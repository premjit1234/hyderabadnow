import { notFound } from "next/navigation";
import { getProjectById, getLocationNames } from "@/db/queries";
import ProjectForm from "@/components/admin/ProjectForm";

export default async function AdminEditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  const project = await getProjectById(projectId);
  if (!project) notFound();

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const localities = await getLocationNames();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Edit project</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">{project.name}</p>
      {saved && <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>}
      <ProjectForm project={project} localities={localities} />
    </div>
  );
}

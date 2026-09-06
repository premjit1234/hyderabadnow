import ProjectForm from "@/components/admin/ProjectForm";

export default function AdminNewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Add a project</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Once created, agents and owners can attach their listings to it from the post-listing form.
      </p>
      <ProjectForm />
    </div>
  );
}

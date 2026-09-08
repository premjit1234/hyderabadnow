import BulkProjectUploadForm from "@/components/admin/BulkProjectUploadForm";

export default function AdminBulkUploadProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold text-stone-900">Bulk upload projects</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Download the template, fill in as many projects as you have details for, then upload it here. You'll get a
        chance to review what will be created before anything is saved.
      </p>
      <BulkProjectUploadForm />
    </div>
  );
}

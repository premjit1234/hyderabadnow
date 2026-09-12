import AdminLocalityGuideForm from "@/components/admin/AdminLocalityGuideForm";

export default function AdminNewLocalityGuidePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">New locality guide</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">Save as a draft, or publish it right away.</p>
      <AdminLocalityGuideForm />
    </div>
  );
}

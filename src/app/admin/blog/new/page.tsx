import AdminBlogPostForm from "@/components/admin/AdminBlogPostForm";

export default function AdminNewBlogPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">New post</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">Save as a draft, or publish it right away.</p>
      <AdminBlogPostForm />
    </div>
  );
}

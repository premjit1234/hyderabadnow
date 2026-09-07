import { notFound } from "next/navigation";
import { getLegalPageBySlug } from "@/db/queries";
import LegalContent from "@/components/LegalContent";

export default async function TermsPage() {
  const page = await getLegalPageBySlug("terms");
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">{page.title}</h1>
      <p className="mb-8 mt-1 text-xs text-stone-400">
        Last updated{" "}
        {new Date(page.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <LegalContent content={page.content} />
    </main>
  );
}

import CompleteProfileForm from "@/components/CompleteProfileForm";

export default function CompleteProfilePage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-stone-900">One more step</h1>
      <p className="mb-6 text-sm text-stone-500">
        Tell us a bit about yourself so we can set up your HyderabadNow account.
      </p>
      <CompleteProfileForm />
    </main>
  );
}

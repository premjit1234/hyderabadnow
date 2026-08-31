import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Create your account</h1>
      <SignupForm />
    </main>
  );
}

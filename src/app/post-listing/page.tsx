import Link from "next/link";
import { getSession } from "@/lib/auth";
import PostListingForm from "@/components/PostListingForm";

export default async function PostListingPage() {
  const session = await getSession();

  const canPost =
    session && (session.role === "agent" || session.role === "seller" || session.role === "admin");

  if (!canPost) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-stone-900">Post a property</h1>
        <p className="mt-2 text-stone-500">
          {session
            ? "Only agents and property owners can post listings. Contact us if you'd like to switch account types."
            : "Log in as an agent or property owner to post a listing."}
        </p>
        {!session && (
          <Link
            href="/login"
            className="mt-6 rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Log in
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Post a property</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Fill in the details below. Your listing goes live immediately.
      </p>
      <PostListingForm />
    </main>
  );
}

import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  getProjectsForSelect,
  getListingFieldSettings,
  getLocationNames,
  getAmenityCatalog,
  getUserById,
  getListingQuotaStatus,
} from "@/db/queries";
import PostListingForm from "@/components/PostListingForm";
import PhoneVerificationGate from "@/components/PhoneVerificationGate";

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

  const [projects, fieldSettings, localities, amenityCatalog, currentUser] = await Promise.all([
    getProjectsForSelect(),
    getListingFieldSettings(),
    getLocationNames(),
    getAmenityCatalog(),
    // Read fresh from the DB rather than trusting session.phoneVerified —
    // the session cookie is a JWT signed once at login and can be stale for
    // up to 30 days (see lib/auth.ts), so it can't be relied on to reflect a
    // verification that happened earlier in this same session.
    getUserById(session.id),
  ]);

  // Same monthly cap createListingAction enforces on submit — checked here
  // too so someone who's already used up this month's quota sees that
  // clearly instead of filling out the whole form first. Admins have no cap
  // at all (see getListingQuotaStatus's own comment).
  const quota =
    session.role === "admin"
      ? null
      : await getListingQuotaStatus({
          id: session.id,
          monthlyListingLimitOverride: currentUser?.monthlyListingLimitOverride ?? null,
        });

  if (quota?.reachedLimit) {
    const resetLabel = quota.resetsAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-stone-900">Monthly posting limit reached</h1>
        <p className="mt-2 text-stone-500">
          You&apos;ve posted {quota.used} of {quota.limit} listings allowed this month. Your limit resets on{" "}
          {resetLabel}.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Go to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Post a property</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Fill in the details below. Your listing goes live immediately.
      </p>
      {quota && (
        <p className="mb-6 rounded-md bg-stone-50 px-3 py-2 text-xs text-stone-500">
          {quota.used}/{quota.limit} listings posted this month · {quota.remaining} left
        </p>
      )}
      <PhoneVerificationGate initialVerified={currentUser?.phoneVerified ?? false} initialPhone={currentUser?.phone ?? null}>
        <PostListingForm
          projects={projects}
          fieldSettings={fieldSettings}
          localities={localities}
          amenityCatalog={amenityCatalog}
        />
      </PhoneVerificationGate>
    </main>
  );
}

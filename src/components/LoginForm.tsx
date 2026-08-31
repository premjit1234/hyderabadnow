"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/app/actions";
import GoogleButton from "@/components/GoogleButton";

const GOOGLE_ERRORS: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  invalid_state: "That sign-in link expired — please try again.",
  google_failed: "Google sign-in didn't go through — please try again.",
  google_email_unverified: "That Google account's email isn't verified. Try a different account or sign up with a password.",
  google_not_configured: "Google sign-in isn't set up yet.",
};

export default function LoginForm({ googleError }: { googleError?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {googleError && GOOGLE_ERRORS[googleError] && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{GOOGLE_ERRORS[googleError]}</p>
      )}
      <GoogleButton label="Continue with Google" />
      <div className="flex items-center gap-3 text-xs text-stone-400">
        <div className="h-px flex-1 bg-stone-200" />
        or log in with email
        <div className="h-px flex-1 bg-stone-200" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
        <input
          type="password"
          name="password"
          required
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
      <p className="text-center text-sm text-stone-500">
        No account?{" "}
        <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
          Sign up
        </Link>
      </p>
      <p className="rounded-md bg-stone-50 p-3 text-xs text-stone-500">
        Demo accounts (password <code className="font-mono">password123</code>):{" "}
        priya.agent@hyderabadnow.in (agent), anitha.owner@hyderabadnow.in (owner),
        rahul.buyer@hyderabadnow.in (buyer)
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type ActionState } from "@/app/actions";
import GoogleButton from "@/components/GoogleButton";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signupAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <GoogleButton label="Sign up with Google" />
      <div className="flex items-center gap-3 text-xs text-stone-400">
        <div className="h-px flex-1 bg-stone-200" />
        or sign up with email
        <div className="h-px flex-1 bg-stone-200" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Full name</label>
        <input
          name="name"
          required
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
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
        <label className="mb-1 block text-sm font-medium text-stone-700">Phone (optional)</label>
        <input name="phone" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">I am a...</label>
        <select
          name="role"
          defaultValue="buyer"
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        >
          <option value="buyer">Buyer / renter</option>
          <option value="agent">Real estate agent</option>
          <option value="seller">Property owner (selling/renting directly)</option>
        </select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

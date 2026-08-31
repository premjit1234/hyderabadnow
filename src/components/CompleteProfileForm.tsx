"use client";

import { useActionState, useState } from "react";
import { completeProfileAction, type ActionState } from "@/app/actions";

export default function CompleteProfileForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(completeProfileAction, null);
  const [role, setRole] = useState<"buyer" | "agent" | "seller">("buyer");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">I am a...</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        >
          <option value="buyer">Buyer / renter</option>
          <option value="agent">Real estate agent</option>
          <option value="seller">Property owner (selling/renting directly)</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Phone (optional)</label>
        <input name="phone" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm" />
      </div>
      {role === "agent" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Agency name (optional)</label>
          <input name="agencyName" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm" />
        </div>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}

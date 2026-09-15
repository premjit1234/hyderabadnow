"use client";

import { useActionState, useState } from "react";
import { switchAccountTypeAction, type ActionState } from "@/app/actions";

// Shown to a "buyer" account on the dashboard (see canPost in
// dashboard/page.tsx) — lets them self-upgrade to agent/owner right here
// instead of the old dead-end "contact us" message. Same role choices as
// CompleteProfileForm, minus "buyer" itself (nothing to switch to there).
export default function SwitchAccountTypeForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(switchAccountTypeAction, null);
  const [role, setRole] = useState<"agent" | "seller">("seller");

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-stone-600">Switch account to</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
        >
          <option value="seller">Property owner (selling/renting directly)</option>
          <option value="agent">Real estate agent</option>
        </select>
      </div>
      {role === "agent" && (
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-stone-600">Agency name (optional)</label>
          <input name="agencyName" className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" />
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Switching..." : "Switch account type"}
      </button>
      {state?.error && <p className="text-sm text-red-600 sm:basis-full">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700 sm:basis-full">{state.success}</p>}
    </form>
  );
}

"use client";

import { deleteOwnListingAction } from "@/app/actions";

// Wraps the owner-facing delete action in a plain confirm() guard — the
// admin panel's equivalent button (see admin/listings/page.tsx) skips
// confirmation entirely, but this one is reachable by regular owners/agents
// rather than trusted admins, so a stray click shouldn't permanently delete a
// listing (and its photos + inquiries, via ON DELETE CASCADE) with no
// recovery. onSubmit runs before the form's action fires; returning false /
// calling preventDefault stops the request entirely when the user backs out.
export default function DeleteListingButton({ listingId, listingTitle }: { listingId: number; listingTitle: string }) {
  return (
    <form
      action={deleteOwnListingAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${listingTitle}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="listingId" value={listingId} />
      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
        Delete
      </button>
    </form>
  );
}

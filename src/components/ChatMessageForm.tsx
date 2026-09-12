"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction, type ActionState } from "@/app/actions";

// Shared by two call sites: starting a new chat from a listing page (pass
// `listingId`) and replying inside an existing thread (pass
// `conversationId`) — sendMessageAction itself branches on which hidden
// field is present, so this component just needs to render the right one.
// On success the server action redirects to /messages/[id] (see
// sendMessageAction), so there's no client-side "sent!" state to show here —
// only the error path ever actually renders after a submit.
export default function ChatMessageForm({
  listingId,
  conversationId,
  placeholder,
  submitLabel = "Send",
  autoFocus = false,
}: {
  listingId?: number;
  conversationId?: number;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(sendMessageAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the textarea after a reply is sent from within an existing
  // thread — sendMessageAction revalidates the thread page so the new
  // message appears above, but useActionState doesn't reset form fields on
  // its own after a submit that didn't error.
  useEffect(() => {
    if (!pending && !state?.error && conversationId) formRef.current?.reset();
  }, [pending, state, conversationId]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      {conversationId && <input type="hidden" name="conversationId" value={conversationId} />}
      <textarea
        name="message"
        required
        rows={conversationId ? 2 : 3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        defaultValue={listingId ? "Hi, I'm interested in this property — is it still available?" : undefined}
        className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}

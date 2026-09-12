import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getConversationsForUser } from "@/db/queries";

export default async function MessagesInboxPage() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-stone-900">Log in to view your messages</h1>
        <Link
          href="/login"
          className="mt-6 rounded-md bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Log in
        </Link>
      </main>
    );
  }

  const conversationsList = await getConversationsForUser(session.id);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-stone-900">Messages</h1>
      <p className="mb-6 text-sm text-stone-500">Chats you&apos;ve started or received about listings.</p>

      {conversationsList.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No conversations yet — start one from any listing page.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversationsList.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className={`flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                c.unread ? "border-emerald-300" : "border-stone-200"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm ${c.unread ? "font-bold text-stone-900" : "font-semibold text-stone-800"}`}>
                    {c.otherPartyName}
                  </p>
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />}
                </div>
                <p className="mt-0.5 truncate text-xs text-stone-500">About: {c.listingTitle}</p>
                {c.lastMessagePreview && (
                  <p className={`mt-1.5 truncate text-sm ${c.unread ? "text-stone-800" : "text-stone-500"}`}>
                    {c.lastMessagePreview}
                  </p>
                )}
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-stone-400">
                {new Date(c.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

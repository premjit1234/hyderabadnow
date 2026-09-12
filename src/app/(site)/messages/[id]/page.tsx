import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConversationDetail, getMessagesForConversation } from "@/db/queries";
import ChatMessageForm from "@/components/ChatMessageForm";
import MarkConversationRead from "@/components/MarkConversationRead";

export default async function ConversationThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversationId = Number(id);
  const session = await getSession();

  if (!session) redirect(`/login?next=/messages/${id}`);
  if (!Number.isInteger(conversationId)) notFound();

  const convo = await getConversationDetail(conversationId);
  if (!convo) notFound();

  const isParty = convo.buyerId === session.id || convo.sellerId === session.id;
  if (!isParty && session.role !== "admin") notFound();

  const messages = await getMessagesForConversation(conversationId);
  const otherPartyName = convo.buyerId === session.id ? convo.sellerName : convo.buyerName;

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
      <MarkConversationRead conversationId={conversationId} />

      <Link href="/messages" className="mb-4 text-sm font-medium text-emerald-700 hover:underline">
        ← All messages
      </Link>

      <div className="mb-4 rounded-xl border border-stone-200 bg-white p-4">
        <p className="font-semibold text-stone-900">{otherPartyName}</p>
        <Link href={`/listing/${convo.listingId}`} className="text-xs font-medium text-indigo-600 hover:underline">
          About: {convo.listingTitle} →
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-stone-400">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === session.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-emerald-700 text-white" : "border border-stone-200 bg-white text-stone-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-emerald-100" : "text-stone-400"}`}>
                    {new Date(m.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4">
        <ChatMessageForm conversationId={conversationId} placeholder="Type a message…" submitLabel="Send" autoFocus />
      </div>
    </main>
  );
}

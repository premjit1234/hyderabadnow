"use client";

import { useEffect, useRef } from "react";
import { markConversationReadAction } from "@/app/actions";

// Renders nothing — fires once per conversation id when a thread page is
// opened, same "client component beacons a server action on mount" shape as
// ViewTracker.tsx uses for page-view analytics. A server component can't do
// this itself: writing on every GET render of /messages/[id] would mean a
// prefetch or a bot crawling the page could silently mark messages read
// before a person ever saw them.
export default function MarkConversationRead({ conversationId }: { conversationId: number }) {
  const marked = useRef<number | null>(null);

  useEffect(() => {
    if (marked.current === conversationId) return;
    marked.current = conversationId;
    markConversationReadAction(conversationId).catch(() => {
      // Best-effort — a failed read-marker shouldn't surface to the viewer.
    });
  }, [conversationId]);

  return null;
}

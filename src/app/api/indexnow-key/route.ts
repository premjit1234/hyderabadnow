import { INDEXNOW_KEY } from "@/lib/indexnow";

// Serves the IndexNow ownership key as plain text — see lib/indexnow.ts for
// why this exists and why the key itself is a hardcoded constant rather
// than a secret. IndexNow's own crawler fetches this exact URL (passed as
// keyLocation on every ping) to confirm the pinging host actually controls
// this domain before trusting any of its "here's a new/changed URL" calls.
export async function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

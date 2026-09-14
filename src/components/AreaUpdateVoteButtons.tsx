import { voteOnAreaUpdateAction } from "@/app/actions";

// Plain server-rendered forms, no client JS — each button is its own
// one-field <form action> (see voteOnAreaUpdateAction), so voting works even
// with JavaScript disabled and needs no client component at all.
export default function AreaUpdateVoteButtons({
  areaUpdateId,
  localitySlug,
  score,
  myVote,
  canVote,
}: {
  areaUpdateId: number;
  localitySlug: string;
  score: number;
  myVote: number;
  canVote: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" title={canVote ? undefined : "Log in to vote"}>
      <form action={voteOnAreaUpdateAction}>
        <input type="hidden" name="areaUpdateId" value={areaUpdateId} />
        <input type="hidden" name="localitySlug" value={localitySlug} />
        <input type="hidden" name="value" value="1" />
        <button
          type="submit"
          disabled={!canVote}
          aria-label="Upvote"
          className={`rounded-md border px-2 py-1 text-sm leading-none ${
            myVote === 1
              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
              : "border-stone-200 text-stone-500 hover:border-stone-300"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          ▲
        </button>
      </form>
      <span data-testid="vote-score" className="min-w-[1.5rem] text-center text-sm font-semibold text-stone-700">
        {score}
      </span>
      <form action={voteOnAreaUpdateAction}>
        <input type="hidden" name="areaUpdateId" value={areaUpdateId} />
        <input type="hidden" name="localitySlug" value={localitySlug} />
        <input type="hidden" name="value" value="-1" />
        <button
          type="submit"
          disabled={!canVote}
          aria-label="Downvote"
          className={`rounded-md border px-2 py-1 text-sm leading-none ${
            myVote === -1
              ? "border-red-500 bg-red-50 text-red-600"
              : "border-stone-200 text-stone-500 hover:border-stone-300"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          ▼
        </button>
      </form>
    </div>
  );
}

// Manual/ad-hoc trigger for the stale-listing sweep that normally runs on a
// timer inside the server process (see src/instrumentation.ts) — useful for
// testing the email/expiry flow without waiting for the timer, or for
// running it by hand right after deploying this feature for the first time.
import { runStaleListingCheck } from "../lib/staleListings";

async function main() {
  const { nudged, expired } = await runStaleListingCheck();
  console.log(`Sent ${nudged} "still available?" nudge(s), auto-expired ${expired} listing(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Runs the stale-listing sweep (src/lib/staleListings.ts) on a repeating
// timer inside the same Node.js process that serves the app — this app runs
// as a single container (see docker-compose.yml, one "web" service, no
// horizontal scaling), so there's no need for a separate cron container or
// system crontab: `register()` below is called once, automatically, when
// that one server process boots (see Next's instrumentation.js docs), and
// it just keeps its own interval running for the life of the process.
//
// If this app is ever scaled to multiple instances, this needs to move to a
// single dedicated worker (or gain a DB-backed lock) — as written, every
// instance would run its own timer and could double-send nudge emails.
//
// Deliberately NOT a static top-level import: Next.js compiles
// instrumentation.ts for both the Node.js and Edge runtimes by default (see
// the "Specifying the runtime" section of its docs), and lib/staleListings.ts
// pulls in the db client, which pulls in better-sqlite3's native addon —
// something the Edge bundle can't include at all (build fails with "Module
// not found" on its .node binary). Loading it with a dynamic import()
// *inside* the Node-only branch below keeps it out of the Edge bundle
// entirely, while still running normally in the real server process.

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const INITIAL_DELAY_MS = 60 * 1000; // let the server finish booting first

const SAVED_SEARCH_CHECK_INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes
const SAVED_SEARCH_INITIAL_DELAY_MS = 90 * 1000; // stagger from the stale-listing sweep's own initial delay

export function register() {
  // Also rules out any Node-only code running during Edge-targeted builds
  // or middleware — this job only makes sense in the actual long-lived
  // Node.js server process.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const runAndReschedule = () => {
    import("@/lib/staleListings")
      .then(({ runStaleListingCheck }) => runStaleListingCheck())
      .then(({ nudged, expired }) => {
        if (nudged || expired) {
          console.log(`[stale-listings] sent ${nudged} nudge(s), auto-expired ${expired} listing(s).`);
        }
      })
      .catch((err) => {
        // A transient failure (e.g. Resend/DB hiccup) should never crash the
        // server or stop future runs — just log and try again next cycle.
        console.error("[stale-listings] check failed:", err);
      })
      .finally(() => {
        setTimeout(runAndReschedule, CHECK_INTERVAL_MS);
      });
  };

  setTimeout(runAndReschedule, INITIAL_DELAY_MS);

  // Saved-search alerts (lib/savedSearchAlerts.ts) — same single-process
  // timer approach as the stale-listing sweep above, on its own independent
  // schedule/offset so one job's runtime never delays the other. A shorter
  // interval than the 6-hour stale-listing sweep since "a new listing
  // appeared" is much more time-sensitive to a buyer than "nudge a listing
  // owner" is.
  const runSavedSearchAlertsAndReschedule = () => {
    import("@/lib/savedSearchAlerts")
      .then(({ runSavedSearchAlertSweep }) => runSavedSearchAlertSweep())
      .then(({ checked, notified }) => {
        if (notified) {
          console.log(`[saved-search-alerts] checked ${checked} saved search(es), emailed ${notified}.`);
        }
      })
      .catch((err) => {
        console.error("[saved-search-alerts] sweep failed:", err);
      })
      .finally(() => {
        setTimeout(runSavedSearchAlertsAndReschedule, SAVED_SEARCH_CHECK_INTERVAL_MS);
      });
  };

  setTimeout(runSavedSearchAlertsAndReschedule, SAVED_SEARCH_INITIAL_DELAY_MS);
}

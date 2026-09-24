// Manual/ad-hoc trigger for the saved-search alert sweep that normally runs
// on a timer inside the server process (see src/instrumentation.ts) — useful
// for testing the alert email flow without waiting for the timer, exactly
// like db:check-stale-listings does for that sweep.
import { runSavedSearchAlertSweep } from "../lib/savedSearchAlerts";

async function main() {
  const { checked, notified } = await runSavedSearchAlertSweep();
  console.log(`Checked ${checked} saved search(es), emailed ${notified}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

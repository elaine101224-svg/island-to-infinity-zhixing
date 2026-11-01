# Bug verification · 18 October 2026

## Fixed and deployed

- Public calendar API previously discarded approved event time/type/venue. Added optional editorial fields and the corresponding Website Content controls; private schedule data is still excluded.
- Empty time ranges now display “Time to be confirmed”; four known meeting times were saved and republished, while two unknown times remain blank in data.
- ISO calendar dates now use local calendar-date parsing in public/admin calendars, activity records, dashboard reminders and the shared event card, preventing western-time-zone date shifts.
- Failed public/admin calendar and activity-list loads now show an explicit error with a retry action rather than a misleading empty list/calendar.
- Public event/day controls support keyboard operation. Event details use a scrollable native dialog, Escape/close controls, explicit focus restoration and mobile-safe dimensions.

PRs: [#5](https://github.com/elaine101224-svg/island-to-infinity-zhixing/pull/5), [#6](https://github.com/elaine101224-svg/island-to-infinity-zhixing/pull/6). Focus follow-up commit: `a5e0a33c571ef04ccb6dc506f3baf0e89edf6fc3`.

## Results

- 93 unit/integration tests passed, including calendar time validation and public/private API projection regression tests.
- TypeScript and production build passed. ESLint: zero errors, pre-existing warnings remain.
- Live authenticated requests to 13 public/admin pages succeeded, including preview, plans, schedule, team and activities.
- Live API counts: 4 families; 9 active plans (all years); 28 total member records, including 24 current-year active members and 9 with previous-year membership; 15 internal schedule entries; 5 activity records.
- All six tested admin API endpoints return 401 to anonymous clients.
- Public schedule: 6 entries; 4 known meeting time ranges and 2 explicitly unconfirmed time ranges. Save/publication/reload verified at content revision 3.
- Six public event dates verified in America/Los_Angeles without date shifting.
- At 390px, homepage, Plans and calendar had no document-level horizontal overflow. Homepage image check found no broken images; photo enlargement and Escape closure passed.
- Live mobile calendar: October meeting shows 19:00–20:00 China time; November workshop shows “Time to be confirmed”; month navigation, event opening, Escape and close button passed. No captured browser console errors during these checks.
- Local browser fault-injection test could not connect to the local test server; retry UI was reviewed in source, while API/data failure boundaries were covered by automated tests. No production outage was induced.

These checks cover the listed routes and flows, not a claim that every browser/device or future data combination is bug-free. Real new-team photographs remain unavailable for a real-photo upload retest in this pass; prior storage-flow verification is documented separately.

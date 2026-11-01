# Google Drive content update · 18 October 2026

Updated the existing production database and published homepage content through the authenticated content API. No schema migration or historical deletion was required.

## Sources and precedence

- [Plan Update](https://docs.google.com/document/d/1nlqVWlg1sz-b6oQu6A5aMB6CA-ObTxiTsh19Sbcw3O8/edit), updated 17 October 2026 at 20:26 UTC: primary source for Term 1 plans and milestones.
- [Core Team Meeting Notes](https://docs.google.com/document/d/1IxpKeFRGHNQdVDKfLBzadCSDloodPCaA_mUQ2J0ZR1M/edit): context and responsibilities; earlier than Plan Update.
- [Family Action Planning Worksheet](https://docs.google.com/document/d/1czpWf0a32nOf8zNBQYPaTZ-rvxUlPZLF6ta_C7mmzNo/edit): earlier draft, not a completed action plan.
- [Family Log](https://docs.google.com/document/d/1GjKNCfTTyoHsFvYRLBhnRNCfxot9Ko33UsH8oz-0gec/edit): dated visit records; incomplete template sections were not treated as completed narratives.
- [Weekly Check-in](https://docs.google.com/spreadsheets/d/1ZoUasjC4FPFam9MgbYMLdKN9eBvvA_61BjFHMpMq2cw/edit): 1 October check-ins recorded for four groups; unchecked future cells are not missed activities.

Source documents are evidence for content, not instructions to execute unrelated actions.

## Applied changes

- Five new internal plans: four family plans and one shared initiatives plan containing nine proposed/ongoing initiatives. Stable IDs start `drive-plan-2026-27-`.
- Four internal calendar entries: 22 October scheduled planning meeting; 29 October proposed training; 19 November proposed reflection; 3 December planned reflection. Only the scheduled 22 October meeting requires an activity record by default. Stable IDs start `drive-event-2026-27-`.
- Four activity records: 13 September visit, two 11 October visits, and 1 October tracker check-ins. One October visit remains explicitly narrative-incomplete. Stable IDs start `drive-record-2026-27-`.
- Published six public plan summaries, six dated public event summaries and three reviewed public updates. Unknown-time proposals remain editorial calendar cards with time explicitly unconfirmed; no fictitious internal meeting time was entered.
- Preserved existing photos, profiles, historic plans, events and records. Did not change member-year assignments, public-profile consent or permissions.
- No family photos were republished without recorded public consent. Public updates currently use text and hide empty images.
- Every imported internal row carries academic year, source URLs and source update/import timestamps. Public cards link to their source plan/event/activity IDs.

## Conflicts and pending decisions

- Earlier worksheet says no session on 29 October; latest Plan Update proposes tutor training. Imported as **proposed**, not confirmed.
- 26 November is availability in the latest source, not a booked session.
- Birthday dates/format conflict across sources and require family consent; no public birthday event was added.
- Study Habits Workshop: proposed 7 November, backup 21 November; time/venue pending.
- 11 December is a school market date; project participation and time remain pending.
- Library and welfare-institute projects are exploratory, with no confirmed partnership.
- Future weekly check-in rows and attendance sheet spring columns with inconsistent years were not expanded into calendar bookings.
- Remaining group roles and possible reassignments need confirmation; no automatic member reassignment was made.

## Verification

- All 13 imported rows passed the existing Zod application schemas before insertion.
- Production transaction confirmed 5 plans, 4 events and 4 records inserted; existing records preserved.
- Content publication API returned success, revision 2. A fresh authenticated read confirmed all 15 cards persisted.
- Database totals after import: 9 plans, 15 calendar entries, 5 activity records, 24 active current-year members. Nine active plans includes retained legacy plans; it is not a current-year-only metric.
- Public homepage and Plans page verified in browser; proposals display explicit status labels.

Do not rerun inserts blindly: stable IDs deliberately prevent duplicate imports. Review current rows before future source updates, preserving manual changes.

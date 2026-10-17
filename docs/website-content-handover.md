# Website content and annual handover

The public website uses a separate reviewed content document, not internal family, plan, team or activity rows. Login at `/login`, then use **Website Content**.

## Publish a team introduction

1. Confirm the current academic year under Website Content (August–July).
2. In Team, use **Unassigned year** to review existing members. Confirm school years individually; retain previous years. The previous roster has not been silently assigned to 2026–27.
3. Edit the public name, public role and family group. Internal roles do not grant login permissions and are never used as public role labels.
4. Select the independent public-profile checkbox. Optionally upload a portrait and confirm consent. Save.
5. Under Website Content, upload the real full-team photograph, write alt text/caption and confirm consent. Choose hero or Team position. Photos fit in full and never crop.
6. Edit up to four group introductions and photographs. Use a member’s public role to identify a coordinator. Reorder with Move up.
7. Save draft, open Preview saved draft, then Publish website. Member changes go live only with a new website publication. Republish after archiving members or changing consent to update the public snapshot.

No current-year team photo, group membership, coordinator, role or count is inferred from historic records. Missing public portraits use initials. Missing photos are hidden.

## Public updates and pages

Add entries in Website Content: Latest update, Families introduction, Public plan, or Public calendar event. Write a separate public summary. Never paste private visit notes, contact information, addresses or identifying family details. An update must link to an existing completed activity record. Select Include in next publication, save/preview/publish. Homepage shows the latest three approved past-dated updates. Internal records are not auto-published.

Historical photos stay labelled by year in Our Journey. The original semester outline is retained under Plans as a planning framework, not a confirmed event calendar.

## Storage and privacy

Photos are validated and compressed to WebP (long edge at most 2400px, no crop, EXIF removed), with a 4MB input limit. The existing Supabase project now has a private `photos` bucket because no storage bucket existed. Upload URLs persist across refreshes and deployments. Draft photos require the existing admin session. Anonymous visitors can retrieve only photo IDs referenced by the current published document. Do not replace this with a public bucket or browser storage.

Internal APIs require the existing signed admin session; mutations also require CSRF. Internal Supabase tables and editorial tables have RLS enabled with no anonymous or authenticated grants. Access is through the server-only service key. The informational Supabase `rls_enabled_no_policy` notice is expected for these server-only tables: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .

Publication stores an immutable historical document and updates the current snapshot with optimistic revision checks. Concurrent edits return 409 rather than overwriting another editor. Saving a draft never changes the live document. No historic rows were deleted or rewritten.

## Statistics

Dashboard Active Plans is **all years**, matching the full normalized Plans list. Legacy singular `familyId` is normalized at read time. All admin browser requests use the current origin. Failed requests display an error instead of an empty roster or zero.

Active members count only the selected current school year with active status; existing members without confirmed years are not counted. Recorded sessions count actual past-dated activity records in that academic year. Needs recording excludes cancelled events, events marked not requiring a record, future events and events with an existing record. The default is current school year; View history shows older reminders.

Unverified homepage counters and count-up animations have been removed. No estimated or fabricated impact numbers are shown.

## Materials needed

- A consent-cleared, original 2026–27 full-team photograph.
- Up to four family-group photographs, public group names and short introductions.
- Confirmed academic-year memberships, public names/roles and group coordinators.
- Optional consent-cleared individual portraits.
- Up to three recent completed activity records with reviewed public summaries, dates and approved photos.
- Reviewed public Families / Plans / Schedule introductions if these pages should contain entries.

# Member verification — 24 October 2026

## Environment and boundaries

Owner authorized the existing `elaine101224-svg's Org` with a strict free-only limit. Supabase quoted $0/month. Created `island-to-infinity-member-test`, project `iqqdkmlmumosqltgtvjk`, Singapore. This is an independent database, not a paid branch. Both member schemas were applied here first. After hosted checks passed, the additive schemas were applied to production with both launch gates closed. Only fabricated people, responsibilities and reflections were loaded. Dummy credentials stay in temporary private files outside the repository. No emails were sent to fabricated addresses.

Five disposable native Auth identities represent admin, group-A coordinator, member A, member B and uninvited school user. SQL fixture provisioning with hashed random passwords and confirmed dummy emails is test setup, not the application's onboarding workflow. Their editable user metadata deliberately claims admin, to test that authorization ignores it.

## Verified

- 133 local tests pass, including real PostgreSQL RLS via PGlite and API regression tests. Type checking passes. Production build passes with network access for the existing Google Fonts dependencies.
- Hosted native Auth accepts all five dummy identities, and hosted PostgREST enforces member/coordinator/admin scopes. Uninvited identities see no member tasks. Forged metadata does not grant admin access.
- Anonymous table access, direct role changes and reading the confidential master workspace are rejected.
- Task RPC saves persist across identities. Stale edits and cross-group writes are rejected.
- Reflection submission binds the authenticated author despite spoofed payload fields. Another group cannot read the reflection; the correct coordinator can review it.
- Native session refresh retains access to persistent permitted data. All test sessions sign out.
- Controlled hosted tests confirm revocation immediately blocks an already-issued native access token. The database emergency switch likewise blocks an administrator's existing token. Both read and mutation paths were checked. All controlled-test sessions signed out; readback confirms the isolated database gate is now `false`.
- `scripts/member-security-check.sql` returns zero grant/RLS violations against the hosted test schema.
- The owner confirmed a real school test email reached the inbox and that the newest email body contains a numeric OTP. Resend records delivery. The displayed subject remains the default; this is a branding discrepancy, not evidence that the body failed to update.

## Hosted issue found and fixed

PostgREST enables safe-update protections that the local PostgreSQL test engine does not reproduce. Projection-refresh deletes without predicates caused task saves to fail with `DELETE requires a WHERE clause`. The three complete refreshes now use explicit primary-key predicates. The same protections stay enabled. After applying this fix to the isolated database, the task, reflection, refresh and sign-out checks above passed through real HTTP calls.

One subsequent broad repeat timed out on a network request and signed its sessions out; do not describe that repeat as fully passing. The hosted script now bounds network waits and records whether a run completed. Mutation timeouts can be ambiguous: reload state before retrying.

## Remaining launch gates

- Native email code verification, confirmed identity, sign-out and rejection of code reuse passed on 24 October 2026. `scripts/check-member-email.mjs` serves a temporary loopback-only form; it never logs codes or sessions and grants no member permissions. The owner supplied a fresh code for the explicitly authorized native verification test instead. The native Auth API verified it, signed the session out and rejected reuse; no alternate browser surface was used.
- Auth settings were completed manually by the owner and verified through native behavior tests; see “Auth configuration completed by owner” below. Site URL remains `https://islandtoinfinity.online`.
- Test the complete Next.js invitation, first sign-in, reload, assignment and reflection workflows in an isolated deployment with its own server-only configuration. Native password-session/HTTP tests are not a substitute for email onboarding in the app.
- A private pre-change data snapshot of all 17 existing public business tables (66 rows) was saved outside the repository with restricted file permissions and a verified checksum. A post-migration comparison confirmed all 17 business tables unchanged. This is not a full PostgreSQL/Auth/storage backup or a certified full restore. Complete backup/restore planning before real-member release. Reconcile the actual roster privately; no real members were provisioned or invited.
- Deploy with `MEMBERS_ENABLED=false` and the database gate off. Enabling real member access remains a separate owner release decision.

Security advisor notes: six `RLS Enabled No Policy` informational findings correspond to intentionally service-only tables. The authenticated SECURITY DEFINER warning on `member_change` is intentional and requires review: its native identity/live-membership checks are essential, and browser roles have no direct write grants. The test project's leaked-password protection warning applies to password fixtures; member UI uses email OTP. These are documented findings, not a claim of zero advisor warnings.

## Release preparation follow-up

Production native email OTP verification succeeded, followed by global sign-out and rejection of replay. The sanitized result is recorded in `member-email-verification-result.json`.

The production member tables and initial planning document are saved with no real member accounts. Planning contains 13 calendar items, four groups and nine shared projects. No actual identities were inferred from source interest lists. The Vercel runtime has `MEMBERS_ENABLED=false`; the database gate is also false.

The administrator preview previously imported the planning seed into a browser bundle, including private interest lists. It now fetches seed data through an authenticated, no-store server endpoint. Anonymous preview requests are rejected. Build-output checks found none of the distinctive interest-list strings in public static assets. This adds one security-boundary test, bringing the suite to 130 tests.

Security maintenance updates Next.js to 16.4.3, sharp to 0.35.5, Anthropic SDK to 0.91.1, and Vitest/coverage to 5.0.5 with Node 24 types. Supabase JS is pinned at 2.118.0. Full dependency audit reported zero known vulnerabilities at the first release. A later same-day audit required updating Zod to 4.6.6 and overriding Miniflare’s Undici dependency to 7.30.1; the post-fix audit again reports zero known vulnerabilities. Type checking and production build pass. Lint has zero errors and 26 warnings; the newly introduced mount-effect performance recommendation stays visible as a warning for existing async loaders and hydration-safe date initialization.

The initial staged deployment passed readiness, existing public pages/sewing rendering, anonymous admin-data rejection, closed member access, actual admin authentication, calendar/group/project initialization, empty member authorization dashboard and rejection of a non-school invitation. The patched replacement `https://island-to-infinity-zhixing-hairni6y9.vercel.app` passed the same deployed checks and was promoted to `https://islandtoinfinity.online` on 24 October 2026. Deployment ID: `dpl_CmKDZre2JxYbU97zg2qRUDoQs9g6`. Both member launch gates remain closed. Browser access to the public site was also denied, so no visual/browser-end-to-end acceptance or new screenshot is claimed.

The owner explicitly re-authorized Supabase browser access, but a saved browser permission still blocks `supabase.com`. No alternate browser or management-API workaround was used. The owner requested the direct Auth settings URL to open it themselves. The owner subsequently completed that handoff; native behavior checks now verify signup rejection and code expiry.

Owner-provided documentary and current group photo are pending **after launch**; see `post-launch-media.md`. Neither asset is uploaded or public.

## Auth configuration completed by owner

Owner confirmed the requested console settings on 24 October 2026. Native provider probes independently returned `signup_disabled` for a deliberately invalid empty-password email signup and `anonymous_provider_disabled` for an empty signup request; neither created an identity or sent email. OTP expiry was set by the owner to 600 seconds. A disposable Auth-only fixture was verified using an admin-generated OTP in process memory (no email, no member account). After backdating only its recovery timestamp by eleven minutes, native verification rejected it with `otp_expired`. The fixture was removed, its session signed out and the member database gate verified closed. The sanitized evidence is in `member-invite-auth-result.json`.

A first-invitation incompatibility was found: native OTP routes unconfirmed identities into the signup handler, which fails when public signups are disabled. The server now precreates an OTP-ready identity with `email_confirm:true`, without a password, session or email. The member row remains `invited`, and only a successful native OTP verification activates it. Invalid verification is explicitly tested to leave membership unactivated. The local suite now has 133 passing tests; type checking and production build pass.

## Final release review

The public repository must not contain the brief's private coordinator/interest lists. New-install seed defaults are now anonymous (`TBC`, no interest names); existing secured database planning is preserved. The supplied brief stays locally Git-ignored. The health endpoint exposes only a public commit identifier so the formal domain can be compared to the pushed release.

A separate five-identity hosted native OTP fixture check now verifies code entry, role/group row scopes, reuse rejection, refresh and sign-out without contacting any dummy mailbox. Token hashes are installed only in the isolated test project; this does not certify SMTP delivery or a full Next.js browser onboarding flow. The actual public/member-site browser surfaces remain denied by saved browser permissions, and staging server credentials are not available through the current connector/CLI session. Those limits are retained rather than represented as completed browser acceptance.

Media derivatives have been prepared without altering originals. Uploads are private pending public-photo authorization; the storage readback and anonymous-denial receipt is kept outside the repository in the private media folder.

Hosted retesting exposed a real stale-edit timeout: raising SQLSTATE `40001` for an optimistic conflict triggered PostgREST automatic transaction retries. Business conflicts now raise `PT409`, while the app preserves HTTP 409 handling and supports older database error codes during rollout. The narrow function-only migration was applied to the isolated project first; the complete hosted task/reflection/persistence/refresh/sign-out check then passed, including stale and cross-group denial. The same migration was applied to production without changing data, grants or policies. The test gate was reset closed. Earlier timed-out runs are superseded by `member-hosted-final-result.json`; they are not counted as passes.

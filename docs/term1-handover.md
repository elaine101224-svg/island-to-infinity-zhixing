# Term 1 workspace — Phase 1 handover

## What is implemented

`/admin/term` lives inside the existing administrator shell and requires the existing signed admin session. Its API independently checks authentication, CSRF and Zod validation. Public pages and sewing routes do not import semester data. There is no member route, registration endpoint, invite sender or member-access switch.

The workspace contains the semester calendar, four generic family groups, editable role allocation, a planning roster and availability, nine shared projects, separate expressions of interest and confirmed participants, linked tasks, reflections, and monthly group recaps. Task ownership and due dates are optional. Saving is explicit; revisions protect against lost updates. A database trigger records each saved snapshot atomically. Audit actor is explicitly `shared-admin-session`, not an invented individual identity.

The member selector is an **admin-operated planning preview**, not impersonation or an access-control mechanism. Admins can edit all records in every preview. Before any actual member access, build authenticated server-side own-task/group permissions, scoped response projections, invitation and verified school-email mappings. Do not reuse the admin selector as authorization.

## Planning source

The Git-ignored local `docs/island_to_infinity_codex_term1_brief.md` is copied from the supplied local brief, snapshot 23 October 2026. Linked Google documents were not re-imported; no claim that this snapshot is newer than subsequent member updates. It initializes only an absent workspace. Saved workspaces are never reseeded on read or overwritten on load failure.

- 22 October: scheduled in source, not verified completed; conservatively pending verification.
- 29 October: Proposed; conflict with older no-session worksheet is retained.
- 31 October: generic private approval-pending activity; identifying birthday detail omitted.
- 7 November workshop and 21 November backup are linked alternatives, not two commitments.
- 19 November: proposed reflection; visit conflict flagged.
- Windows retain start/end dates; unknown times stay null. All times are Asia/Shanghai.
- School event dates are distinct from our participation, which remains TBC until separately evidenced.
- Projects keep original tracker statuses. Private names and interest lists stay only in the secured saved workspace and local brief; the public Git repository ships anonymous defaults.

The supplied brief is a planning reference. It is not authorization to invite members, retrieve confidential case notes, change school email policy, publish private plans or migrate production.

## Staging storage setup (not applied to production)

1. Back up the target database using the operator's approved process. Use a staging project with non-sensitive dummy records.
2. Review `scripts/term-workspace-schema.sql`. It adds workspace and audit tables, enables RLS, revokes PUBLIC/anon/authenticated access, and grants only the server service role the required operations. No browser policies exist intentionally in Phase 1. The existing server key must be configured; the term API refuses anon-key fallback.
3. Apply the script to staging. Run `scripts/term-workspace-security-check.sql` as the staging database owner. There is no local PostgreSQL client/runtime available in this workspace, so these database assertions have not been executed here.
4. Start the app against staging, sign in with an administrator, open `/admin/term`, edit and Save. Verify revision increment and a matching audit row. Test simultaneous editors (second save gets 409), reload persistence, database outage and retry. Until setup, **Open local planning preview** allows reviewing/editing the supplied snapshot but does not claim it is saved; Save reports configuration/storage errors.
5. No SQL, production deployment, live invitations, public-calendar imports or production member accounts were executed as part of this implementation.

## Verification and remaining launch gates

Automated tests cover seed truth, evidence requirements, nullable dates/times, cross-group assignment rejection, no reseed on database error, authenticated saving, stale-revision conflicts, CSRF and denial of regular member/coordinator/uninvited callers before launch. Existing public/merchandise regression tests remain in the suite. These API tests use a mocked database; they are not a substitute for real staging RLS/persistence tests.

Before Phase 2: verify school email domain privately, reconcile roster without inferring identity from names, implement invitations and user-level identity, review per-operation/group RLS and server checks with admin/coordinator/member/uninvited test accounts, protect uploads, complete safeguarding/privacy review, and obtain an explicit release decision. Confidential case management remains outside this workspace. Free-text fields are for non-sensitive planning only; no automated detector can guarantee users never enter sensitive text. Do not launch until these gates pass.

## Phase 2 follow-up

Member authentication, scoped database projections and member-facing workflows are now implemented separately. The Phase 1 sections above describe the original milestone. Use `docs/member-launch-checklist.md` for the current release status and required gates; no hosted member launch has occurred.

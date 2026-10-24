# Allowlist member access · 24 October 2026

The owner approved enabling sign-in for the supplied 23-person school-email list, with no invitation or notification emails. Personal names, email mappings, provisioning receipts and backups are stored outside this public repository.

- All 23 accounts have the ordinary `member` role. Existing identities and current-year roster records are reused; no elevated platform roles are inferred from names.
- Only the two owner-designated school emails configured in the server-only `MEMBER_ROSTER_EDITORS` variable may edit the roster. This capability grants no household access or account-management role. Shared administrator credentials alone cannot bypass roster write checks once configured.
- Unassigned members have no family-group record access. Their own ungrouped tasks and the sanitized shared calendar/projects remain available. Reflections require an actual group assignment.
- Authorization records await the member's first native school-email OTP verification. These approved roster authorizations expire on 1 July 2027 if never activated; account activation requires a matching verified Auth identity. Account creation does not request or send an email. Members request their own sign-in code.
- Roster edits use authenticated server-side capability checks, same-origin protection, strict fields, compare-and-swap and audit entries. Contact data, household assignments, Auth roles and email bindings cannot be changed through the member roster endpoint. Public profiles still require the existing separate publication workflow.

Validation: 147 automated tests, typecheck, lint (existing warnings), build; an independent hosted Supabase dummy account signed in through real Auth and exercised JWT/RLS. Unassigned group access, raw workspace access and role escalation were denied. The dummy account and sessions were removed and its test environment gate restored. Native browser interaction review remains limited by browser access policy.

Public presentation in the same release: Our Journey precedes the introduction, the Our Team navigation item is removed, and the documentary has a real film-frame poster from the closing project logo (180.5 seconds).

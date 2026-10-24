# Unified school-email workspace

The owner identified that her Leader roster position was incorrectly presented as an ordinary-member workspace. Team position remains separate from authorization, but the verified owner's account now has explicit administrator permissions. No other account gains administrator privileges; the two-person roster editor allowlist remains unchanged.

- Verified school administrators enter the existing Admin workspace through a same-origin POST. The server signs a subject-bound Admin session without exposing the admin password.
- Subject-bound sessions require the same verified school account and live active administrator role on every protected request. Tampering, another member's session, demotion and revocation fail closed. Legacy password sessions continue to work.
- Member and Admin workspaces share the sidebar, warm palette, heading styles and calendar component. Members get a read-only calendar and only their authorized data. The designated roster editors use the same card directory in both interfaces.
- Sign-out clears both school and Admin cookies and reloads the signed-out page. The account-management actor uses the verified personal identity when available.
- Team position is loaded from the member's own roster profile, rather than displaying the internal authorization role as their team position.

Validation: automated permission/session tests cover forged-role bodies, origin checks, subject binding, changed roles, revoked sessions and logout. An explicit opt-in test uses two synthetic school-email identities against the independent free Supabase test project to exercise real Auth, SSR cookies, Admin-session validation, RLS and direct role-escalation denial. It sends no email. Browser visual/interaction acceptance remains limited by the existing browser access policy.

# Workspace usability release — 29 October 2026

Production: dpl_FGo213HfLGnwRHjVuzVbeGzDfFkE, promoted to the existing domain. Final owner decision: member and administrator sign-in remain independent. No handover guide or administrator email-code UI was shipped.

Member tasks:
- All assigned family/project work is visible on My Tasks, with deadline sorting, task-year selection, search, team and due/help filters. Team information is secondary; My Projects and My Calendar remain available.
- Removed acknowledgement/Confirm as a required step. Existing unstarted assigned work is To do; administrator, coordinator and import creation paths now start tasks as Not started. Legacy status values remain readable.
- Task details show deliverable/requirements, timing notes, linked activity context and personal/shared progress. Calendar task selection opens the details; no-deadline listing excludes completed/cancelled personal work.
- Added manual refresh and unsaved-draft protection across query-parameter navigation. Non-JSON server failures produce actionable messages.

Administrator operations:
- Added editing of task titles/instructions/timing notes, guarded by master revision. Text edits are restricted to one task at a time and preserve progress/evidence.
- Added private family/project creation, team membership maintenance and coordinator appointment. New projects are internally assignable and not automatically published.
- Added Mark reviewed for shared activity/time proposals, with record concurrency checks. It does not auto-confirm or change formal calendar entries.
- Removed obsolete legacy group/review controls from the main calendar flow. Historical tools remain available. Four untouched role-allocation placeholders were cancelled and the unused campus proposal was archived; records were not deleted.

Continuity:
- One shared workspace persists across years. A current school-year setting controls new task metadata and default task filters. Existing tasks retain their original school year. Calendar has direct date navigation. Participation years and graduation cohorts remain separate.
- Interface references to a named owner were replaced with team leaders. Existing factual task content/names were preserved. Administrator sessions can maintain member profiles without being on fixed editor email lists; designated verified editors remain supported.
- Graduation options are generated from the current year and stored cohorts, rather than ending permanently in 2030.

Owner account:
- Existing Yiling (Elaine) Xie / ylxie25@uwcchina.org identity remains active with the same person ID and five task assignments; its platform role is now member, as explicitly requested. The independent password administrator account is unchanged.
- Member logout signs out only the local member session and preserves admin cookies. Admin logout uses its own endpoint. Live API verification confirmed own five tasks, rejection by admin APIs, local logout and no admin-cookie deletion. Browser verification confirmed Elaine's five To do tasks and expanded task requirements; the independent admin workspace remained accessible in another tab.

Database changes and safeguards:
- direct_task_todo migration: only coordinator task default changes.
- workspace_school_years migration: coordinator task year metadata and a metadata-only backfill. The historical 2026-27-T1 database row key remains the stable internal storage slot, not a user-visible year restriction.
- Master revisions 17→18 changed acknowledgement states and placeholders; 18→19 added year metadata; 19→20 temporarily removed the new root field for old-runtime compatibility; after promotion 20→21 restored it. No task owners, instructions, evidence, contributions, memberships or confirmed activity times were overwritten.
- Private backups: before-workspace-streamline-2026-10-29.json, before-workspace-year-metadata-2026-10-29.json and before-owner-member-separation-2026-10-29.json in the parent private-backups directory. Derived verification receipts are in private-media.

Validation:
- 279 tests passed; one opt-in test skipped. TypeScript, targeted ESLint (no errors), whitespace checks, detector scan and production build passed. A pre-existing MemberAccess effect warning remains.
- Eleven public pages/endpoints returned 200. Local dummy-member rendering at desktop and 390px verified task search, expanded requirements and zero page-level horizontal overflow. The temporary preview route was removed before deployment.
- Staged and official health checks passed. No production progress/completion, attendance or proposal records were modified to simulate tests; no emails were sent during verification.
- Existing Supabase advisory warnings concern intentional member-facing RLS/function discovery and password settings; no permissions were broadened in the coordinator function migrations. Passwordless member entry remains the owner-selected existing policy.

Rollback: application target dpl_ChhCFRhCiCLaqBnxbitDbq64BjSG. Before using an old runtime, remove the optional activeSchoolYear root field in a revision-guarded update to preserve strict-schema compatibility. Do not restore entire old documents over newer member progress. The owner role change and metadata changes can be reverted individually from the private backups if explicitly requested.

## Sewing public request form

The public Sewing flow now accepts an anonymous questionnaire: product, quantity, name, WeChat contact, optional date and request notes. Group requests require a group name. No email verification, account, file upload, quote acceptance or payment is needed. Reference images are exchanged later on WeChat. Old public login/orders links display the new form.

`/admin/sewing` provides a private enquiries inbox, contact search, closed-record filter, copyable WeChat contact, follow-up status and internal notes. Private enquiries APIs require admin identity. Submission responses disclose only the generated reference. Existing order records remain in storage (there were zero before rollout); no schema migration or outbound message is used. Same-origin checks, input limits, honeypot, contact/IP rate limiting, retry idempotency and version checks are enforced.

Validation: TypeScript passed; 288 tests passed with one opt-in test skipped; scoped ESLint passed with existing image warnings; production build and staged database health passed. Deployment: `dpl_84nUa5nhDBZJi8TL8t3DKo9Ejf2p` (`island-to-infinity-zhixing-b1q7hcc55.vercel.app`).

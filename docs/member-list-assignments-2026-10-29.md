# Member list assignment synchronization — 29 October 2026

Production deployment: dpl_2dcLpBPsR44GMikguV22XZf3p7yG, promoted to the existing project. Local working tree upload includes the preceding family/project membership editor. No database records, account roles or login states were changed.

Both Member directory and Profiles & Contacts now display current family and project assignments from the revisioned term workspace, including coordinators and deduplicating overlapping membership. Profiles can be filtered by actual family/project. The profile editor links to team assignment management instead of presenting obsolete A/B/C/D and assignedFamilyIds fields as current assignments. Existing legacy data is preserved.

Read-only production inspection found 24 current people and 22 with scope membership. Shawn (Jiankun Fu) and Jerry (Jiayuan Zhang) have no recorded family/project membership; the user subsequently confirmed both belong to Kaiyan. Added both to Kaiyan in workspace revision 14, preserving other membership, tasks and account data. Readback confirmed nine Kaiyan members and zero current people without a family/project assignment. Backup: private-backups/before-kaiyan-shawn-jerry-2026-10-29.json in the parent project directory.

Validation: existing full suite 258 passed, one opt-in skipped; two new directory synchronization tests also passed. TypeScript, focused ESLint, diff whitespace check and Vercel production build passed. Staged health returned 200 with database ready; unauthenticated directory returned 401. No browser-rendered or authenticated production directory verification was performed.

Rollback application target: dpl_8weKvZESkZxHMFz7JkQnXqCLDBxj. No database rollback is needed.

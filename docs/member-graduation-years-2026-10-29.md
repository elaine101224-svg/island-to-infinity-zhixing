# Graduation years — 29 October 2026

Replaced grade presentation and editing with an explicit graduationYear field. The cohort is a stored value such as 2027fall, independent of participation school years and current active/inactive status. Historical grade values are preserved for compatibility. No ongoing status-based or calendar-based recalculation is performed.

One-time user-directed mapping: currently inactive members → 2026fall; DP2 → 2027fall; DP1 → 2028fall; FP → 2029fall. Production readback: 4, 2, 5 and 17 members respectively, with no missing cohorts. Member profile records and their updatedAt fields alone changed; account roles/states, memberships and tasks were unchanged.

Both directory views and Profiles & Contacts display graduation year. Admin directory and profile filters support graduation cohort; selecting a cohort includes historical participation years so the 2026fall members are accessible without an additional school-year toggle. Selecting a cohort in profiles also resets the status filter to All. Graduation-year editors accept future cohorts matching 20XXfall; current UI options include 2026–2030 and every existing stored cohort. Participation school years remain editable separately.

Validation: 263 tests passed, one opt-in skipped; TypeScript, focused ESLint and whitespace check passed. Added coverage for saving graduation year while preserving school-year history and rejecting grade labels in the cohort field.

Private backup: private-backups/before-graduation-years-2026-10-29.json in the parent project directory (mode 0600). Application rollback target before this change: dpl_6SfxGWPx9qLje578bcMjix656niU. Data rollback should restore graduationYear only from backup and retain newer member changes, never replace whole profiles without checking updatedAt.

Production deployment: dpl_ChhCFRhCiCLaqBnxbitDbq64BjSG. Production build and staged health check passed.

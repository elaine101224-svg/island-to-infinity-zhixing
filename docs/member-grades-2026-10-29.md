# Member grades — 29 October 2026

Added optional private profile grade (FP, DP1, DP2) to profile validation, roster editing and directory serialization. Both member list surfaces and admin profiles display the grade; editors can amend it. School-year history remains independent.

User-directed mapping for the 24 current members:
- DP2: Jasmine Angela Pangilinan; Zhihan (Sebastian) Zhu.
- DP1: Zihan (Crystal) Xu; Yiling (Elaine X) Xie; Kaustubh Kumar Agrawal; Maline Muleka Khuntheng; Sula Isabela Adams-Orchard.
- FP: the other 17 current members, including Siyu (Elaine W) Wang.

The user specified international students plus named exceptions, corrected DPY to DP1, directed grouping by names, then corrected Jasmine and Sebastian to DP2. These are grade values only; no nationality classification was stored. Historical members were unchanged. Readback verified DP1=5, DP2=2, FP=17. Profiles and updatedAt alone were updated; account states, roles, workspace memberships, tasks and progress were unchanged.

Private backup before grade writes: parent project's private-backups/before-member-grades-2026-10-29.json (mode 0600).

Validation: full suite before DP2 extension: 261 passed, one opt-in skipped. After adding DP2: TypeScript and 12 focused tests passed, including explicit DP2 save and invalid-grade rejection. A pre-existing MemberRoster effect lint warning remains; no lint errors were found. Initial grade build deployed as dpl_3qyidKATfhEcx3Z4Ye1UVNpoYcvE; final production deployment dpl_6SfxGWPx9qLje578bcMjix656niU adds DP2 to the edit dropdowns and validators. Its production build and staged health check passed.

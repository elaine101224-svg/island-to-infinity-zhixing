# 常熟爱心缝纫队 × Island to Infinity

## Delivered routes

- `/sewing`: public project introduction, products, collaborations, team story, process, FAQ and WeChat contact.
- `/sewing/products`, `/sewing/collaborations`, `/sewing/story`, `/sewing/faq`, `/sewing/wechat`: focused public views.
- `/sewing/preview`: free browser-only SVG/Canvas studio; pullover hoodie, zip hoodie, T-shirt, jersey; front/back originals, touch drag, range controls, rotation, HEX/custom colors, export. No AI generation service is used.
- `/sewing/login`: school email OTP (no password, no Microsoft SSO).
- `/sewing/request`: individual/group request, optional originals and saved previews, review summary, unique idempotent reference.
- `/sewing/orders`, `/sewing/orders/[uuid]`: own requests, private files, assigned contact, quote versions, explicit confirmation, progress and payment history.
- `/sewing/manage`, `/sewing/manage/[uuid]`: assigned member workspace, accessed through the same school email login.
- `/admin/sewing`: existing admin session; request management, assignment, members, bilingual product/content editing and photo upload/replacement/reordering.

The main navigation and existing admin navigation contain entries. The site's existing layouts and warm palette remain in use. Unknown prices, minimum quantities, fabrics, delivery timings, actual swatches and contacts are not fabricated. Garment illustrations and design previews are labelled separately from real photos. No unverified Ohana collaboration is presented as completed work.

## Database / migration

Applied additive Supabase migration `sewing_private_customization` to the project already referenced by the website: `jbukbnmgkmjyfesaqqjq`. Source: `scripts/sewing-schema.sql`. This creates 10 `sewing_*` tables, three restricted RPC/trigger functions and the `sewing-private` bucket. It does not modify existing project records or existing storage access policies.

Every new table has RLS enabled. `anon` and Supabase `authenticated` have **no table privileges**. The server uses an explicit `SUPABASE_SERVICE_ROLE_KEY`; this module never falls back to the existing public key. All customer/member ownership and assignment checks are performed server-side on each private request. Sessions contain a random 256-bit opaque token in an httpOnly, SameSite cookie; only its SHA-256 hash is stored. Sessions expire after 7 days, and school-domain allowlisting is rechecked for each authenticated request.

The security advisor reports informational `RLS Enabled No Policy` entries. This is intentional for these service-only tables: the browser has no direct Data API access, and no permissive RLS policies are needed. [Supabase explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Required server configuration

Set these in the existing deployment's server environment; never send secrets in chat or put them in `NEXT_PUBLIC_*`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing project's URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database/storage access |
| `ADMIN_PASSWORD` | Existing administrator login |
| `SEWING_SCHOOL_DOMAINS` | Confirmed exact school email domain(s), comma-separated; empty disables school login |
| `SEWING_MAIL_API_KEY` | Resend transactional-email API key; no account or subscription was created |
| `SEWING_MAIL_FROM` | Sender address on a verified sending domain |
| `SEWING_NOTIFY_EMAILS` | Both agreed recipients (maker's inbox + Island to Infinity inbox); empty leaves notifications pending |

School mailbox domain confirmed by the project owner: `uwcchina.org`. This is the default allowlist, overridable by `SEWING_SCHOOL_DOMAINS`; an explicit empty value disables login. Public WeChat contacts: `elaine_10x / jasmine`. Teams display names: `Yiling(Elaine) Xie / Jasmine Angela Pangilinan`. These display names are not used to infer member email accounts. Runtime credentials are absent from this local checkout. Database migration is applied, but actual browser-to-database persistence and email delivery remain disabled until server environment variables are supplied. The app displays a clear setup banner; it does not substitute localStorage or sample orders. The only localStorage value is the language preference.

OTP email includes Chinese and English. Codes are generated server-side, HMAC-hashed, expire in 10 minutes, allow 5 attempts, and are consumed atomically. Resends are limited to 1/minute and 10/day per address, plus IP and global delivery limits stored in PostgreSQL. Do not put OTP codes or tokens in logs. A failed mail attempt may require waiting for the resend window before retrying.

## Files and order workflow

PNG, JPG and WebP only, maximum 5 MB each. Both advertised MIME and binary signature are checked on the server. Original uploaded bytes are retained; SVG/HTML uploads are rejected. Files live in a private bucket, never under the existing public upload route. `/api/sewing/files/[uuid]` authenticates and checks ownership or current assignment before streaming bytes with `private, no-store` and `nosniff`. Only administrator-uploaded, explicitly public photo records are served through `/api/sewing-photo/[uuid]`.

Each order has an immutable UUID, optimistic integer version and append-only quote/history arrays updated through compare-and-swap. Double submission uses the same UUID. A retry returns only the reference, preventing internal note leakage. A concurrent edit returns a conflict rather than overwriting a quote. Any revised quote clears confirmation and returns to awaiting confirmation. Only the owning customer can confirm the latest quote. Production cannot begin without that exact confirmation. Status changes require a customer-visible explanation. Internal notes cannot silently change the customer-visible status; payment changes receive a public timestamped history entry.

Payment is directly to the maker via WeChat. There is no payment gateway or payment-proof upload requirement.

## Notifications and operation

New requests are enqueued transactionally with the order insert. Dashboard reminders work regardless of email setup. If mail and recipients are configured, the server attempts notification after the order commits. Failed or unconfigured notifications remain pending. Members/admins can retry from a request; pending counts appear to administrators. No scheduled retry service was subscribed to. Mail delivery uses the order UUID as provider idempotency key to reduce duplicate delivery on retries. A successful provider acceptance is recorded; it is not a claim that the recipient read it. No automatic personal WeChat integration exists.

The “copy Chinese summary” action includes reference, garment, quantity, preferred delivery, name and contact details; copy only for people involved in the request. If clipboard access is unavailable in WeChat, a selectable summary is shown for manual copying.

Administrators add school-email members through `/admin/sewing`, including customer-visible contact information, then assign orders. Makers do not need admin accounts. They share materials and confirmations via WeChat; the assigned member updates the website.

Periodic housekeeping can remove expired sessions, OTP rows and expired limiter rows. Unattached files/previews are retained; review retention and consent before launch and establish a periodic cleanup routine. Never delete attached files or quote records as part of generic cleanup. No paid scheduler is required for the first release.

## Content still needed

1. School domain confirmed: `uwcchina.org`; member accounts still need complete school email addresses.
2. WeChat and Teams contacts supplied; complete school email addresses are still needed to provision the named follow-up members.
3. Verified product descriptions, actual swatches, reference price ranges, minimum quantities, fabrics/techniques and lead times.
4. Approved team/work photos, team introduction, and verified collaboration evidence, including Ohana design/product comparisons if supplied. Exclude sensitive family/child information.
5. Both notification email recipients and a verified sender/mail service configuration.
6. Server environment configuration and deployment through the existing release process.

## Validation

- TypeScript check passed.
- ESLint passed with warnings only (existing warnings plus deliberate native image elements for private streams and uploaded media).
- Production Next.js build passed, including existing routes and new sewing routes.
- 91 automated tests passed: 75 existing, 16 added. New API integration tests use a mocked database and cover ownership, member assignment, internal-note filtering, unauthorized file references, idempotent retries, quote revisions, customer confirmation, production gating, payment history and version conflicts.
- Real database transaction smoke test passed for distributed rate limiting, OTP expiry, five-attempt cap, attempt counts/one-time use, notification trigger and optimistic version matching. All smoke-test rows were rolled back.
- Real database audit confirmed all 10 new tables deny anonymous/authenticated direct reads, RPC execution is not public, the bucket is private with a 5 MB limit, and no storage object policy permits browser access.
- Browser checks: public pages, Chinese/English switching and remembered language, four garment styles and both sides, preserved original-image placement/adjustment on side switching, front/back PNG exports, and 390 px mobile layout.
- Remaining live acceptance: actual school-email OTP delivery, full authenticated browser attachment/order round trip and real assigned-member/customer accounts, once runtime secrets/domain/email are configured. No claim of these being live is made.

## Cost

Template previews/exports run locally with no per-generation API cost. Database, private storage, bandwidth, hosting and transactional email consume the existing services' quotas and may incur fees as usage grows. Free tiers are not permanent guarantees. No new paid service, project, branch or subscription was purchased.

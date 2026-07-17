# Security Report

Findings are grounded in the source as it sits in this repository. Each
entry has severity, where it lives, and what was changed (or what to do
next).

## Severity legend

| Severity | Meaning |
|---|---|
| Critical | Trivially exploitable, real data exposure |
| High | Reachable but requires some preconditions |
| Medium | Weakens the posture, needs prompt to land |
| Low | Hygiene / defense in depth |

---

## Critical

### S1. Unauthenticated PII reads on admin routes (fixed)

**Where**: `app/api/admin/team/route.ts`, `app/api/admin/activities/route.ts`

The GET handlers exposed `TeamMember[]` (with `email`, `phone`,
`assignedFamilyIds`) and `ActivityRecord[]` (which can include session
summaries and follow-ups) without a session check. Anyone with the URL
saw the data.

**Fix applied**: both GET handlers now call `validateSession()` first and
return `401 { error: "Unauthorized" }` when no valid session cookie is
present. Both responses also set `Cache-Control: no-store` so CDNs and
browsers don't cache PII.

### S2. Public schedule could leak private events (fixed)

**Where**: `app/(site)/schedule/page.tsx`

The page called `GET /api/admin/schedule`, which returns **all** events
regardless of the `isPublic` flag. Private events (visits with named
families, internal meetings) were visible to unauthenticated visitors.

**Fix applied**: the page now calls `GET /api/schedule`, which filters
`event.isPublic === true` server-side.

---

## High

### S3. Constant-time password compare was missing (fixed)

**Where**: `lib/auth.ts::createSession`

Login used `password !== ADMIN_PASSWORD`. That is a non-constant-time
compare, exposing the password one character at a time over many
requests.

**Fix applied**: `createSession` now uses the already-present
`safeEqual` (exported for reuse). Returns early on length mismatch,
otherwise uses `crypto.timingSafeEqual`.

### S4. No rate limiting on `/api/admin/login` (fixed)

**Where**: `app/api/admin/login/route.ts`

Repeated guessing was unlimited.

**Fix applied**: a 60-second, 8-attempt per-process limiter
(`checkLoginRate` in `lib/auth.ts`). On a hit, the route returns
`429 { error: "Too many login attempts. Try again in a minute." }`.

Note: the limiter is in-memory per Vercel instance — not coordinated
across the fleet. For multi-region deployments, swap it for a shared
store (Upstash, Vercel KV, or Supabase table).

---

## Medium

### S5. Supabase service-role fallback to anon key (existing, intentional)

**Where**: `lib/supabase.ts`

If `SUPABASE_SERVICE_ROLE_KEY` is missing, the code falls back to
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, which is also a hard-coded fallback
value when the env var is not set. This is intentional for first-run
demo, but it is dangerous in production: if RLS is enabled and the
service role key is ever missing, anon-tier permissions apply.

**Recommended**: remove the hard-coded fallback strings. The current
hard-coded URL/key are for a demo project; rotate them or move them
to a server-only env at deploy time.

### S6. `lib/data.ts` console.log leaked configuration (fixed)

**Where**: `lib/data.ts`

`console.log('API_BASE:', API_BASE)` ran on every cold start and printed
the production hostname. Removed.

### S7. Server components fetch the API over HTTP to themselves

**Where**: `app/(site)/families/page.tsx`, `app/(site)/families/[id]/page.tsx`,
`app/(site)/plans/page.tsx`

Server Components build URLs via `NEXT_PUBLIC_SITE_URL` and `fetch`
themselves. This causes an extra round-trip on every request, plus the
public site will return `502` if the env var points to a wrong host.

**Recommended**: refactor `lib/data.ts` to call `lib/supabase.ts`
directly inside the server component (the API layer is just a thin
adapter). The route handlers can remain for the admin client's
client-side `fetch` calls.

### S8. CSV / image handling accepts arbitrary base64

**Where**: `app/admin/families/page.tsx` photo upload

`FileReader.readAsDataURL` and the matching Supabase `data` JSON column
let an admin upload arbitrary base64 blobs. Nothing validates file type,
size, or strips EXIF metadata. An admin (or a hijacked admin session)
can exfiltrate or hide data in a 10MB base64 image.

**Recommended**: upload to Supabase Storage instead of embedding bytes
in a row, enforce an allow-list of MIME types, cap file size at ~5MB,
and run image sanitisation server-side.

---

## Low

### S9. CSRF

The session cookie uses `SameSite=strict`, which closes the obvious CSRF
gap for cookie-based auth. Mutations are still possible from any same-site
context, but the site is fully same-origin by design.

**Recommended**: for defence in depth on future expansion, add a
double-submit token (a meta `<input name="_csrf">` injected on every
form) and reject mutations that lack it.

### S10. Generic error bodies

`/api/admin/team/route.ts` and similar route handlers surface Supabase
error messages verbatim (`{ error: error.message }`). In production
these can leak schema or policy details to a half-authenticated user.

**Fix applied** for team/activities: GET now requires auth before the
Supabase call, so the surface is reduced to "unauthorized" or our own
generic message. Other admin routes still leak Supabase errors on write
failures — wrap them with `{ error: 'Failed to <verb>' }` before
shipping.

### S11. Dependencies not pinned exactly

`package.json` uses caret ranges. Acceptable for app code, but `lucide-react`
is pinned at `^1.7.0` (Sept 2023) while every other dep is current. New
lucide icons used in newer code may not exist at this version, leading
to silent rendering issues.

**Recommended**: bump `lucide-react` to current latest and audit any
icon names that disappear.

### S12. Pre-flight input validation absent on admin writes

Admin POST/PUT handlers accept arbitrary JSON. They reject only a falsy
body. There is no per-field validation, no max-length checks, and no
shape enforcement. Bad data (extra-large strings, missing
`consentGiven`) reaches the database.

**Recommended**: introduce `zod` (or hand-written guards) at the top of
each handler and return `400` for the first violation.

---

## Hardening checklist (post-deploy)

- [ ] Rotate the hard-coded Supabase URL/key in `lib/supabase.ts`; remove
      fallback strings entirely.
- [ ] Wire `@upstash/ratelimit` for a global login rate limit.
- [ ] Add structured `request_id` to every server log so failed requests
      can be correlated across Supabase, Anthropic, and Next.
- [ ] Convert team/activities payloads to PGP-encrypted columns at rest
      (currently all data lives as plain JSON in `data`).
- [ ] Enable Vercel Web Application Firewall (Vercel Security) and turn
      on bot protection for `/admin/*`.

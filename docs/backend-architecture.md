# Backend Architecture

A factual map of how this app serves requests, where data lives, and the moving
parts that can fail in production. Everything below is verified against the
code in this repository.

## System Architecture

A single Next.js 16 (App Router) deployment hosting both the public site and
the admin dashboard. There is no separate backend service — every API path is a
Next.js Route Handler in `app/api/**/route.ts`. Persistence lives in Supabase
(Postgres), which the route handlers call through the server-only client in
`lib/supabase.ts`.

```
┌────────────────────────────────────────────────────────────────────┐
│                         Vercel Edge / Node                         │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐  │
│  │  Next.js App Router      │    │  Route Handlers (app/api/*)  │  │
│  │  - (site) public pages   │    │  - /api/ai-assistant         │  │
│  │  - /admin (gated)        │    │  - /api/schedule   (public)  │  │
│  │  - /login (admin login)  │    │  - /api/admin/*    (mutating)│  │
│  └──────────┬───────────────┘    │       │ supabase.from(...)    │  │
│             │ server components  └───────┼────────────────────────┘  │
│             │  fetch(...) / direct       │                           │
└─────────────┼────────────────────────────┼───────────────────────────┘
              │                            │ service-role key (server)
              ▼                            ▼
       Self (internal fetch)       Supabase Postgres
                                   tables: families, plans,
                                   schedule, team_members,
                                   activity_records
```

External dependency: Anthropic Claude (or any Anthropic-compatible gateway)
called from `lib/anthropic.ts`. Configurable via `ANTHROPIC_BASE_URL` and
`ANTHROPIC_MODEL`.

## Request Lifecycle (typical load)

1. Browser GETs a public route (e.g. `/families`).
2. The Server Component fetches `${API_BASE}/api/admin/families` from
   `lib/data.ts`.
3. Route handler reads the `families` table via Supabase, maps rows to the
   `Family` interface, responds with JSON.
4. Server Component renders cards and returns HTML.
5. Browser hydrates client components (Navbar, PhotoGallery, etc.).

Admin mutating lifecycle (e.g. `PUT /api/admin/families/[id]`):

1. Admin client (`app/admin/...`) POSTs JSON.
2. Route handler runs `await validateSession()`. Reads the `admin_session`
   cookie, base64-decodes the payload, recomputes the HMAC, compares in
   constant time.
3. On success, the handler calls Supabase and returns the saved row.
4. Client toasts the result via `components/admin/Toast.tsx`.

## Dependency Graph

```
app/(site)/*          components/layout/*, components/home/*,
                      components/families/*, components/plans/*,
                      components/schedule/*, components/ui/*
                                  │
                                  ▼
                       lib/data.ts ──► fetch({API_BASE}/api/admin/*)

app/admin/*           components/admin/*, lib/data.ts
                                  ▼
                       app/api/admin/* ──► lib/supabase.ts

app/api/admin/login   lib/auth (createSession)
app/api/admin/logout  lib/auth (destroySession)
app/api/ai-assistant  lib/anthropic (Anthropic SDK)
app/api/schedule      lib/supabase (public read-only filter)
app/api/health        lib/supabase, lib/logger
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | yes (admin) | Admin login + HMAC key for sessions |
| `ANTHROPIC_API_KEY` | yes (AI) | Anthropic SDK auth |
| `ANTHROPIC_BASE_URL` | optional | Override endpoint for compatible gateways |
| `ANTHROPIC_MODEL` | optional | Default `claude-sonnet-4-20250514` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Fallback key when no service role |
| `SUPABASE_SERVICE_ROLE_KEY` | recommended | Bypasses RLS for server-side mutations |
| `NEXT_PUBLIC_SITE_URL` | recommended | Server-component `fetch` base URL |
| `VERCEL_URL` | optional | Auto-detected production base |

## Data Layer

There is no SQL in this app. Data lives in Supabase tables; each row is a
JSON-encoded object in a `data` column. The route handlers unwrap
`row.data ?? row` before responding. This is the simplest possible schema —
flexible, but loses indexability and constraints. See `database-review.md`
for the trade-offs.

## Auth Flow

HMAC-signed session cookie (`lib/auth.ts`).

```
client POST {password}
   │
   ▼
login/route.ts  ──► createSession(password)
                       │
                       ├─ if !ADMIN_PASSWORD          → null → 401
                       ├─ if !safeEqual(pwd, ADMIN_PW) → null → 401
                       ├─ if !checkLoginRate(key)      → 429
                       └─ payload = { expiresAt }
                          sig    = hmac_sha256(ADMIN_PW, payload)
                          cookie = base64(JSON({ payload, sig }))
                                   httpOnly, sameSite=strict, secure=prod
                                   path=/
                                   maxAge=24h
```

`validateSession()` recomputes the signature with the current
`ADMIN_PASSWORD` and compares in constant time. Rotating the password
invalidates every outstanding session, which is the desired behaviour.

## Third-Party Integrations

- **Anthropic**: AI assistant. Wrapped in a thin client that maps SDK errors
  to `AINotConfiguredError` (503) and `AIUpstreamError` (502/429).
- **Supabase**: data store. Reachable from server only (service role key when
  set, anon key otherwise).

There are no cron jobs, no email flows, and no file storage beyond
`public/images/` (which Vercel serves as static assets).

## Deployment

Target: Vercel. Static assets (`public/**`) are served by the CDN; dynamic
routes run on Vercel Functions. Environment variables are configured in the
Vercel dashboard. No infrastructure-as-code is checked in — env vars live
only in the deployment platform.

## Failure Boundaries

| Failure | Visible symptom | Bounded by |
|---|---|---|
| Supabase down | Read-only public pages show empty lists; admin GETs 500 | `fetchAPI` returns `[]` rather than throwing |
| Anthropic key missing | `/api/ai-assistant` → 503 with friendly message | `AINotConfiguredError` |
| Anthropic upstream 429 | `/api/ai-assistant` → 429 | Mapped from `AIUpstreamError.status` |
| `ADMIN_PASSWORD` missing | `validateSession` returns false → admin pages redirect to `/login` | `isAdminModeConfigured()` |
| Vercel cold start | First request slower than subsequent; no graceful degradation beyond the documented `maxDuration` on `/api/ai-assistant` (`60s`) | Vercel Function timeout |

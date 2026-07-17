# API Specification

All routes are Next.js Route Handlers. JSON is the default Content-Type.
`Cache-Control: no-store` is set on every mutating or PII-bearing response.

## Legend

| Marker | Meaning |
|---|---|
| 🔓 | Public |
| 🔐 | Requires valid `admin_session` cookie |
| 🛡️ | Public read-only where data is already anonymized |

## Auth

### `POST /api/admin/login`

Authenticate as admin. Issues the `admin_session` cookie on success.

- **Body**: `{ "password": string }`
- **Auth**: none
- **Rate limit**: 8 attempts / 60s (in-memory; per-process)
- **200**: `{ success: true }`; Set-Cookie: admin_session=…
- **400**: missing password — `{ error: "Password required" }`
- **401**: wrong password — `{ error: "Invalid credentials" }`
- **429**: `{ error: "Too many login attempts. Try again in a minute." }`
- **500**: internal error — `{ error: "Internal server error" }`

### `POST /api/admin/logout`

Clears the session cookie.

- **Auth**: none required (idempotent)
- **200**: `{ success: true }`
- **500**: `{ error: "Internal server error" }`

## Public Reads

### `GET /api/schedule` 🔓

Public, anonymized schedule.

- **200**: `ScheduleEvent[]` where `isPublic === true`
- **500**: `{ error: "Failed to read schedule" }`

### `GET /api/ai-assistant` (POST only)

This route is POST-only; GET returns 405.

## Public-Projection Reads (currently unauthenticated)

These routes serve already-anonymized records. They intentionally avoid
exposing email, phone, or any direct family identifier. If you add private
fields to the rows, gate the routes — see `security-report.md`.

### `GET /api/admin/families` 🛡️

- **200**: `Family[]` (pseudonym, location, photos with consent, anonymized narrative)
- **500**: `{ error: ... }`

### `GET /api/admin/families/[id]` 🛡️

- **200**: `Family`
- **404**: `{ error: "Family not found" }`
- **500**: `{ error: ... }`

### `GET /api/admin/plans` 🛡️ & `GET /api/admin/plans/[id]` 🛡️

Anonymized support plans.

- **200**: `SupportPlan[]` / `SupportPlan`
- **404**: `{ error: "Plan not found" }`
- **500**: `{ error: ... }`

### `GET /api/admin/schedule` 🛡️

Returns **all** events including private ones. Only intended for admin
service-to-service calls; the public site uses `/api/schedule` instead.

## Admin (authenticated)

All admin routes require a valid `admin_session` cookie. Routes that
previously returned data without auth (`team`, `activity_records`) now call
`validateSession()` and return `401` when unauthenticated.

### `GET /api/admin/team` 🔐

- **200**: `TeamMember[]` (PII: email, phone)
- **401**: `{ error: "Unauthorized" }`

### `POST /api/admin/team` 🔐

- **Body**: `Partial<TeamMember>`
- **201**: `TeamMember` (with `id`, `createdAt`, `updatedAt`)
- **400**: `{ error: "Request body is required" }`
- **401**: `{ error: "Unauthorized" }`

### `PUT /api/admin/team/[id]` 🔐 & `DELETE /api/admin/team/[id]` 🔐

- **200**: `TeamMember` / `{ success: true }`
- **400/401/500** as above

### `GET /api/admin/activities` 🔐

Same contract as `team`. Records can contain session summaries and follow-ups.

### `POST /api/admin/activities` 🔐, `PUT /api/admin/activities/[id]` 🔐, `DELETE /api/admin/activities/[id]` 🔐

Same as the team variants.

### Admin CRUD for `families`, `plans`, `schedule`

All `POST/PUT/DELETE` are 🔐 and gated by `validateSession()`. Inputs are not
re-validated beyond a falsy-body check — see `security-report.md` "Missing
input validation".

## AI Assistant

### `POST /api/ai-assistant` 🔓

- **Body**: `{ "message": string, "conversationHistory"?: ChatMessage[] }`
- **200**: `{ "response": string }`
- **400**: missing message — `{ error: "Message is required" }`
- **429**: rate-limited by Anthropic — `{ error: "The AI assistant is busy..." }`
- **502**: upstream 401 / generic — `{ error: "The AI assistant key is invalid..." }` / generic message
- **503**: `ANTHROPIC_API_KEY` not set — `{ error: "The AI assistant is not set up yet..." }`
- **500**: `{ error: "Failed to generate response..." }`
- `maxDuration = 60s` so reasoning models fit inside Vercel Hobby timeouts.

## Health

### `GET /api/health`

Readiness probe. Returns `200 ready` when both env and Supabase are healthy,
otherwise `503 degraded`.

- **Response**: `{ status, uptimeMs, checks: { env: { ok, detail? }, supabase: { ok, detail? } } }`
- **200**: both checks pass
- **503**: any check fails

### `GET /api/health?mode=live`

Liveness probe. Process-only — returns `200 { status: "live", uptimeMs }`.

## Pagination, Filtering, Sorting

None yet. Every list endpoint returns the full collection. Add cursor or
offset pagination before this hits more than ~100 rows per table.

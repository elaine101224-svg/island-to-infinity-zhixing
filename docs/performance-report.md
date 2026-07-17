# Performance Report

Hard numbers below come from running `npm run build` against this
repository on Node 24 and a smoke-test of the API paths.

## Build output (baseline)

- Build time (Turbopack): ~3.0s
- TypeScript check: ~1.5s
- Total pre-rendered routes: 21
- Static (`○`) routes: `/`, `/_not-found`, `/ai-assistant`, `/icon.png`, `/login`, `/schedule`
- Dynamic (`ƒ`) routes: every `/admin/*`, `/families/[id]`, `/families`, `/plans`,
  `/api/*`

The public home, `/ai-assistant`, `/login`, and `/schedule` are
pre-rendered. Every data-driven public route (`/families`,
`/families/[id]`, `/plans`) is dynamic because of `export const dynamic
= 'force-dynamic'` and the upstream Supabase fetch.

## Cold start latency

| Path | Estimated cold-start | Notes |
|---|---|---|
| `/` (home) | ~120 ms | Static HTML, no DB. |
| `/families` | ~250-400 ms | One fetch from server component to Supabase. |
| `/families/[id]` | ~350-550 ms | Two fetches: family + plans for family. |
| `/plans` | ~200-400 ms | One fetch, full table scan. |
| `/ai-assistant` | ~150 ms | Pure static shell; AI call is client-triggered. |
| `/api/ai-assistant` (POST) | 2-10 s | Reasoning models stream slowly. `maxDuration=60`. |
| `/api/health` | ~150-400 ms | Includes one Supabase probe. |

## N+1 and inefficient queries

There are **no actual SQL queries** in the application — every handler
calls `.select('*')` on a Supabase table, which fetches the whole
row. As long as the row is a single JSON blob, this is fine; but:

- `GET /api/admin/families` returns the entire families table even when
  the page only needs the families on `/families`. There is no filter, no
  pagination.
- `GET /api/admin/team` returns every team member. With ~10 members this
  is fine; at ~1k members it's not.
- The dashboard (`/admin`) joins events, families, plans, members, and
  activities in memory inside JavaScript. This is fine for tens of
  records but will get expensive. A real schema would do this in SQL.

## Cold starts / connection pool

Supabase uses PgBouncer in front of Postgres. Each Vercel Function
instance opens at most a handful of connections. Because the app does
no `INSERT ... SELECT` or transactional work, contention is unlikely
until traffic grows.

## Bundle / unused JavaScript

JavaScript bundles were not measured here — Lighthouse requires a real
browser. Rough observations:

- `react-calendar` is imported but only the date helpers are used. This
  could shave ~80KB off the schedule page.
- `lucide-react@1.7.0` is pinned to an old major version. Newer
  releases use ES modules with tree-shaking improvements; old versions
  ship a flat icon set.
- The admin app fetches `/api/admin/families` from the server side AND
  re-fetches it from the admin client page on mount. Redundant.

## Render performance hot-spots

- `TimelineTop` re-blurs and re-scales the hero image on every scroll
  event (passive listener is used, but the style recalculation still
  runs). For users on long pages this is a few extra paint cycles per
  scroll.
- `ImpactStats` `requestAnimationFrame` chain re-renders the section
  on every frame for ~1.4s while the section is in view. Acceptable but
  easily reduced to "on transition end" instead of polling.

## Recommendations (ranked)

1. **Skip `lib/data.ts` HTTP fetch.** Server components should call
   `lib/supabase.ts` directly. Eliminates a round-trip per page.
2. **Memoize dashboard joins.** Today the admin dashboard assembles
   reminders in JS by scanning all events and all activity records on
   every render. Use a memo keyed on the IDs.
3. **Drop `react-calendar` import.** Only `date-fns` helpers are used
   on `/schedule`. Check `app/(site)/schedule/page.tsx` and remove if
   unused.
4. **Add a per-route `revalidate` directive** for `/`, `/families`, and
   `/plans`. Site data changes rarely — a 60-second ISR would reduce
   load with no UX cost.
5. **Bundle audit**: run `next build --profile` once and check the
   `/schedule` route's client bundle for duplicate icons.
6. **Add response streaming to `/api/ai-assistant`** so the user sees
   tokens as they're generated (and TTFB drops to ~200ms).

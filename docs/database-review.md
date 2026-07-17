# Database Review

This app stores everything in Supabase (Postgres) via a thin key-value style
schema. There is no `prisma`, no `drizzle`, no migrations directory. The
"schema" is implicit in the application code and the seed JSON in
`data/*.json`.

## Schema (as inferred from `lib/supabase.ts` usage)

```
public.families           (id text PK, data jsonb)
public.plans              (id text PK, data jsonb)
public.schedule           (id text PK, data jsonb)
public.team_members       (id text PK, data jsonb)
public.activity_records   (id text PK, data jsonb)
```

Each row stores its full domain object inside a JSONB column called `data`.
The app reads and writes the whole blob — `row.data ?? row` is used to
accommodate both schemas. There's no `created_at`, `updated_at`, or
`soft_delete` column at the table level; the timestamp fields live inside
the JSONB blob.

## What's missing

| Concern | Status | Impact |
|---|---|---|
| Primary keys | `id` is `text` and application-minted (`family-${Date.now()}`) | Two admins clicking "create" within the same millisecond would collide. Real risk. |
| Indexes | None | Every list endpoint full-scans. Fine below ~1k rows, expensive quickly after. |
| Constraints | None | Bad JSON reaches the table. |
| Foreign keys | None | Orphan rows possible (e.g. a plan referencing a family that was deleted). |
| Cascading deletes | None | Handled by application code (handlers don't check). |
| Soft deletes | None | Lost data on admin "Delete". |
| RLS policies | Off (service-role bypasses them) | One credentials leak = full read/write access. |
| Migrations | None in repo | Schema changes require coordinating with whatever the team did by hand. |

## Concrete risks

### D1. Lost updates from `update(...).eq('id', id)`

The admin PUT handlers do `update({ data: updatedFamily }).eq('id', id)`
without a version check. Two simultaneous edits clobber each other.

**Recommended**: store a `version` integer alongside the JSON blob;
reject updates where `version` doesn't match.

### D2. `row.data ?? row` masking silent breakage

Writes only persist `data`. Reads fall back to `row` when `data` is
missing. If someone migrates a row by hand without `data`, the public
endpoint will serve a partial row that doesn't satisfy the TypeScript
type. The app's types and the database drift.

**Recommended**: pick one shape (`row.data` only) and migrate any
orphaned rows.

### D3. Orphan references in plans / activities

`plans.familyIds[]` and `activities.familyIds[]` are string lists, not
foreign keys. Deleting a family does not clean up plans or activity
records that referenced it. Reads then fall back to "Unknown" in the UI.

**Recommended**: enforce validity at write time (resolve ids at the
handler boundary; reject writes that reference missing ids).

### D4. JSON photos are stored inline

The admin family form converts images to base64 and writes them into the
JSONB column. PostgreSQL handles this up to roughly 1GB per row, but
each base64 photo inflates by ~33% and gets re-fetched on every read.

**Recommended**: move binary to Supabase Storage; keep only the URL in
the row.

### D5. Inconsistent timestamp shape

`data.createdAt` and `data.updatedAt` are ISO strings written by
`new Date().toISOString()`, but only on **create** for some tables —
`update` overwrites `updatedAt` only. Items created by the migration
script (`scripts/migrate-to-supabase.mjs`) carry the original seed
timestamps; items created via the API carry ISO `Z` strings; some are
in `YYYY-MM-DD` format from the JSON seed. This kills any future
ORDER BY on `createdAt`.

**Recommended**: normalise to `timestamptz` server-side on every write.

## Migration plan (proposed order)

1. Add `created_at timestamptz default now()` and `updated_at
   timestamptz default now()` columns; backfill from JSON where present.
2. Add a `version integer default 1` column and enforce optimistic
   concurrency on every PUT.
3. Add `families.id uuid` (or keep text but add a `slug text unique` for
   stable URLs).
4. Replace JSON photos with URL references and a separate `photos`
   bucket in Storage.
5. Add partial indexes for the dashboard queries (`event_date`,
   `family_id`, `recorded_event_id`).
6. Turn on RLS for anon-key reads; keep service-role key for the
   admin/write path.

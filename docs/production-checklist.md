# Production Checklist

A pre-launch gate. Each item is a concrete action with an owner or
"trigger" so you can route them. Status values: `pending`, `done`,
`n/a`.

## 0. Code baseline

- [ ] `npm run lint` → 0 errors, 0 warnings (in-progress; the
      `set-state-in-effect` rules now pass after the Reveal /
      ImpactStats rewrites).
- [ ] `npm test` → all tests green. (32/32 baseline verified this PR.)
- [ ] `npm run build` → success.

## 1. Secrets & configuration

- [ ] `ADMIN_PASSWORD` is a 32+ character random string. Different
      from any dev password. Rotated quarterly.
- [ ] `ANTHROPIC_API_KEY` provisioned and stored as a server-only env
      on Vercel.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` provisioned (server-only) and
      **bypasses RLS** for the admin app's writes.
- [ ] Remove the hard-coded fallback URLs/keys in `lib/supabase.ts`.
      Make absence of the env vars a hard error.
- [ ] Stripe-style secret rotation drill documented: rotate
      `ANTHROPIC_API_KEY` → redeploy → check `/api/health`.

## 2. Data

- [ ] Seed `data/*.json` uploaded to Supabase.
- [ ] RLS enabled on every table; the service role key used for writes,
      anon key for the public schedule only.
- [ ] Backup script for Supabase (daily snapshot to object storage).
- [ ] Document the implicit JSON-schema contract — a JSON Schema file
      per table, validated in CI on every schema change.

## 3. Auth

- [ ] Cookie flags verified in a real browser: `HttpOnly`, `Secure`
      (prod), `SameSite=Strict`, `Path=/`.
- [ ] Admin password compare uses `safeEqual` (verified in `lib/auth.ts`
      after the constant-time fix).
- [ ] Login rate limit tuned: 8/min feels right for a single-operator
      admin; revisit when more operators are added.
- [ ] Force password rotation when `ADMIN_PASSWORD` changes (the HMAC
      scheme invalidates existing sessions automatically — confirmed by
      tests).

## 4. Observability

- [ ] `/api/health` and `/api/health?mode=live` wired to the uptime
      monitor (Vercel Observability or Better Stack).
- [ ] JSON logger (`lib/logger.ts`) ships to the log aggregator with a
      `request_id` field.
- [ ] PII fields (`email`, `phone`) redacted at log time in any error
      paths that mention them.
- [ ] Alerts: 5xx > 1% in 5 min → page; failed login burst > 20/min →
      page.

## 5. Performance

- [ ] Lighthouse mobile score ≥ 95 for `/`, `/families`, `/plans`, `/schedule`.
- [ ] Largest Contentful Paint on mobile ≤ 2.5s for the same four
      routes.
- [ ] `/api/ai-assistant` p95 latency captured; verify < 8s on the
      production model.
- [ ] Hit `/api/health` from `curl` in CI to ensure it stays ≤ 200ms
      without Supabase.

## 6. Security hardening

- [ ] Enable Vercel Bot Protection for `/admin/*` and `/login`.
- [ ] Add input validation (zod or hand-written guards) on every admin
      write endpoint.
- [ ] Move family photos from inline base64 in JSON to Supabase Storage.
- [ ] CSRF token on admin POST/PUT/DELETE forms.
- [ ] Bump `lucide-react` and audit any icon renames.

## 7. Deployment & rollback

- [ ] Production deploy via Vercel (no manual pushes from laptops).
- [ ] Promote a previous successful build via Vercel's "Roll back to
      this deploy" button, exercised once in staging.
- [ ] Vercel "Preview deployments" enabled for every PR, with admin
      auth disabled or scoped to test credentials.

## 8. Incident response

- [ ] On-call playbook: "AI Assistant down", "Supabase degraded",
      "Login locked out". Each step is one sentence.
- [ ] Cookie-reset procedure documented: clearing `admin_session` from
      the browser restores access when the limiter misfires.
- [ ] Disaster recovery runbook covers Supabase restore from snapshot
      into a fresh project, plus the data migration scripts in
      `scripts/`.

## 9. Documentation

- [ ] All `docs/*.md` files reviewed by a second person before launch.
- [ ] Public `/privacy` page explains the data handling approach.
- [ ] Volunteer onboarding doc explains which admin routes handle
      which type of record.

## 10. Post-launch monitoring (first 14 days)

- [ ] Daily review of `/api/health` checks.
- [ ] Weekly review of admin login attempts (should be one operator).
- [ ] Manual smoke-test of all public pages after any Vercel infra
      incident notice.

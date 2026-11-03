# Sewing acceptance harness

These scripts use an isolated PGlite PostgreSQL instance and in-memory private files. They do not load deployment environment files. Never point the test app at production.

From repository root, start the gateway:

    node tests/e2e/sewing/gateway.mjs

Start the app on port 3934 with explicit test-only values:

    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54435 SUPABASE_SERVICE_ROLE_KEY=local-isolated-test-key ADMIN_PASSWORD=isolated-admin-acceptance npm run dev -- --port 3934

Run (sequentially):

    mkdir -p test-results
    node tests/e2e/sewing/mobile.mjs
    node tests/e2e/sewing/faults.mjs
    node tests/e2e/sewing/workflow.mjs

Browser tests require Playwright with a Chromium browser. If Playwright is installed outside this repository, set PLAYWRIGHT_MODULE to its module entry path. No production user, real password or actual payment data is used. All test account credentials are synthetic. Reports and screenshots go in ignored test-results/. Keep source unchanged during browser runs to avoid Next.js Fast Refresh resetting form state.

The workflow tests use the same application routes, domain validation and SQL functions as deployment. The storage gateway emulates upload/download only; production storage privacy and grants are audited separately. The browser viewport is 390×844 with touch enabled, which does not certify real WeChat embedded browsers.

Current UI acceptance:

    node tests/e2e/sewing/request-expectations.mjs
    node tests/e2e/sewing/mobile.mjs
    node tests/e2e/sewing/table-timeline.mjs
    node tests/e2e/sewing/permissions.mjs
    node tests/e2e/sewing/faults.mjs
    node tests/e2e/sewing/workflow.mjs

`mobile.mjs` verifies the simple request review and accept/decline interface. `workflow.mjs` verifies retained server-side production, confirmation and payment rules; these advanced panels are not rendered on the simplified merchant page. All request fields remain expanded. At 1200×900, the default desktop request form is checked to fit the viewport; mobile may scroll vertically.

For regression of expanded content in admin/member pages, run `node tests/e2e/expanded-content.mjs`. It uses the isolated admin password above and fictional browser response fixtures for admin, coordinator and member roles. It does not save editorial or member data.

If dev hot reload interferes with multi-route tests, stop the dev server and build/start with the same explicit isolated environment values. The gateway also serves fictional editorial content for isolated builds. Never use a production environment file for these tests.

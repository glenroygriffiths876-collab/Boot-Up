# Boot-Up secure backend — preparation only

This folder contains a Cloudflare Worker and D1 schema. **It is not deployed or connected to checkout yet.** The current GitHub Pages ordering and WhatsApp workflow remain unchanged. No Cloudflare services, domains, billing or secrets have been created.

## What it does after activation
- Registers a server-generated order ID before WhatsApp opens.
- Validates customer fields, checks a Turnstile token, rate-limits requests, and flags repeated bank reference values.
- Stores private order records in D1, not in GitHub.
- Provides authenticated admin endpoints for Denise to review and update statuses.
- Never claims a transfer is paid automatically. Only Denise can verify actual funds in her bank.
- Receipt files are **not** collected by this Worker. Customers continue sending them to the café through WhatsApp; no R2 bucket or paid service is needed.

## Required setup before launch
1. Confirm Cloudflare Free plan and that no paid service or automatic upgrade is enabled.
2. Create a D1 database in the user's Cloudflare account; add its binding as `DB` in wrangler.toml.
3. Apply `schema.sql` to D1.
4. Configure Worker secrets `ALLOWED_ORIGINS` (comma-separated exact origins, e.g. current GitHub Pages URL), `ADMIN_PASSWORD` (strong unique password), `SESSION_SECRET` (long random value), and `TURNSTILE_SECRET`. Set up a free Turnstile site key for the exact storefront host.
5. Deploy the Worker and verify its /health endpoint.
6. Build and test the mobile admin interface and frontend order-registration integration against the real Worker URL. Do not replace WhatsApp checkout until registration, error recovery and mobile tests pass.

**Security constraints:** Never commit passwords, D1 records or receipts. The Worker API must be deployed only with exact origin allowlisting and secrets. Browser origins are not authentication; admin endpoints additionally require signed, expiring sessions. Turnstile, validation and reference matching are risk controls, not bank verification. The server currently treats cart prices as customer-submitted values; authoritative server-side catalog pricing must be added before relying on totals for fulfillment.

**Free-only policy:** No paid products or R2 storage are provisioned. Cloudflare Free tier has quotas; verify account settings and current limits before deploying. GitHub Pages does not run Workers or D1.

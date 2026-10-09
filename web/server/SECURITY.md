# Printoka server security

What the server enforces, and what has to be set when it goes live. Full plan: "Printoka Security Plan" (9 Oct 2026).

## Built in

- **Checkout re-pricing** (`reprice.js`): every cart line is priced again on the server with the same pricing code the
  storefront runs. Lines carry their configurator choices (`pricing`, or `pkg` for boxes); a line whose price differs by
  more than RM 0.05, or that has no choices attached, is refused.
- **Payments** (`payments.js`): card, FPX and e-wallet orders stay *pending payment* until Stripe or iPay88 confirms them
  by a signed server-to-server callback (`/api/payments/stripe/webhook`, `/api/payments/ipay88/backend`). Confirmation is
  idempotent and must match the order total. Wallet payments are debited on the server. Simulated test payments work only
  outside production.
- **Sessions**: 32-byte random tokens, stored as SHA-256 hashes, sent only in the `x-token` header (never the URL).
  Idle / absolute limits: admin and production 30 min / 8 h, outlet 60 min / 12 h, printers and hubs 2 h / 12 h,
  customers 14 / 30 days. Password change, password reset, role change and disabling an account end the sessions.
- **Sign-in**: 6 failed attempts per account or 30 per IP in 15 minutes → locked for 15 minutes. New passwords need 10+
  characters and are checked against common passwords. Staff accounts still on the starter password `printoka` cannot
  sign in when `NODE_ENV=production`.
- **Two-step sign-in** (authenticator app, TOTP): `/api/auth/2fa/setup`, `/enable`, `/disable`. Required for every
  non-customer account in production (or with `PRINTOKA_REQUIRE_2FA=1`); such an account can only reach the set-up
  screen until it is turned on. Codes cannot be reused.
- **Orders**: `GET /api/orders` needs a staff or outlet sign-in (outlets see their own). `GET /api/orders/:id`: owner,
  outlet, production and admin see the order; an awarded printer sees the spec only; a hub sees shipping only; anyone
  else gets progress only (no names, addresses or prices).
- **Outlet customer search**: limited to the outlet's own customers, plus a walk-in found by exact email or phone.
- **Files**: uploads are checked by their real type (first bytes), SVGs with scripts are refused, and every stored file
  is served with `nosniff`, a sandbox CSP and (for SVG, ZIP and design files) as a download.
- **Headers**: Content-Security-Policy (inline scripts by hash only), HSTS on HTTPS, `X-Frame-Options: DENY`,
  `nosniff`, Referrer-Policy, Permissions-Policy. API responses are `no-store`.
- **Limits**: JSON bodies 1 MB for anonymous requests, 90 MB for signed-in uploads. Server errors return a generic
  message; the detail goes to the server log.

## Environment for production

| Variable | Purpose |
|---|---|
| `NODE_ENV=production` | turns off test payments, requires two-step sign-in for staff, blocks starter passwords |
| `PUBLIC_ORIGIN` | e.g. `https://printoka.com`, used for payment return and callback URLs |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Checkout and webhook signing secret |
| `IPAY88_MERCHANT_CODE`, `IPAY88_MERCHANT_KEY` | iPay88 hosted page and backend post |
| `PRINTOKA_DATA` | path of the data store (keep it outside the web folder and outside OneDrive) |
| `PRINTOKA_TEST_PAYMENTS` / `PRINTOKA_REQUIRE_2FA` | `1` / `0` to override the defaults for a staging copy |

Keep these in the host's secret manager, never in the repository.

## Still to do before go-live (hosting, not code)

- Managed database (PostgreSQL) and a private file bucket in place of `data.json` and `private-files/`.
- Cloudflare (WAF, bot protection) in front, HTTPS only, separate staff and vendor subdomains.
- Central logs and alerts; daily encrypted backups with a monthly restore test.
- Confirm the iPay88 signature formula and payment ids against the merchant's current iPay88 integration guide.
- Independent penetration test before the domain switches.

## Testing

Run the security checks against a **copy** of the data, never the live store:
`PRINTOKA_DATA=<copy>/data.json PORT=4612 node web/server/server.js`, then run the regression script against port 4612.

# Printoka — Website UI & Dashboards

A from-scratch rebuild of the Printoka online-printing marketplace (Malaysia / Singapore / Brunei) on a **custom, dependency-free stack** — replacing the original WordPress/WooCommerce site while replicating its features. This repository holds the **customer storefront, the role dashboards, and the admin backoffice**.

## Stack

- **Frontend:** a single React app (`web/app.js`) using React 18 UMD from a CDN — **no build step, no framework**. `web/runtime.js` provides the shell (header, footer, routing helpers); `web/index.html` loads everything.
- **Backend:** a **dependency-free Node HTTP server** (`web/server/`) serving the static app and a JSON API on one origin, with file-backed persistence (`data.json`, created on first run from a seed).
- **Pricing engine:** `web/pricing/engine.js` (a browser global built from the pricing-calculator repo) prices 90+ products with Printoka membership tiers.
- **Content:** blog, SEO landing pages, FAQ and template-downloads migrated to JSON under `web/content/`.

## Run it

```bash
node web/server/server.js
# then open http://localhost:4611
```

No `npm install` required. `web/server/data.json` is created on first boot; `POST /api/seed` resets the demo data.

## What's inside

- **Storefront** — home, 90+ product configurators with live pricing, category & search, cart → checkout → order confirmation, live order tracking, Learning Hub (blog), Membership, Support + FAQ, Template downloads, Corporate / Partners / Terms pages, and a customer account dashboard (orders, invoices, wallet/transactions, sales missions, quotations, artwork gallery, addresses, account settings).
- **Role dashboards** (unified top-nav design): **Outlet**, **Prepress**, **Scheduler**, **Logistics**, **Vendor/Hub** — the order/quote operations pipeline with a live state machine, RBAC, notifications and an audit log.
- **Admin backoffice** — mirrors the WordPress admin: Orders, Customers, Products, Coupons, Artworks, Custom Quote, Custom Invoice, Printing Job, Users & roles, Posts, Pages, Media, Downloads, FAQs, SEO/sitemap, Pricing, Membership, TeraWallet credit, Payments, Tax, Couriers, Outlets, Follow-up/Scheduled emails, Mailing lists, Notifications, Settings (Printoka/Theme/Store), and the audit log.
- **Two order flows:** web orders route straight to Prepress once paid; walk-in orders are filed by an outlet, priced by the Scheduler back to the customer's account, then converted to an order — each step notified in-app and by an automated follow-up email (logged to an outbox).

## Demo accounts (seed)

Staff accounts all use the password `printoka` (local demo only):

| Role | Email |
|---|---|
| Admin | `admin@printoka.com` |
| Outlet staff | `outlet@printoka.com` |
| Prepress | `prepress@printoka.com` |
| Scheduler | `scheduler@printoka.com` |
| Logistics | `logistics@printoka.com` |
| Vendor | `vendor@printoka.com` |

Customers self-register; a seeded demo customer is `samantha@printoka.my` / `printoka`.

## Layout

```
web/
  index.html            app shell (loads the scripts below)
  app.js                the whole React app (screens, admin, dashboards)
  runtime.js            shell: header, footer, storefront chrome, routing
  catalogue.js          product display-name / category overrides
  pricing/engine.js     pricing engine (built) + build.sh
  server/               dependency-free Node HTTP server + JSON store
  content/              blog, SEO, FAQ, downloads JSON (+ migration scripts)
  assets/               product images & UI icons
docs/                   build plan + WordPress feature-parity matrix
design/                 admin-backoffice design reference
```

> Note: payment gateways, WhatsApp/email delivery and external analytics are represented as integration slots — the flows work end to end in the app, but no live third-party keys are wired in this repository.

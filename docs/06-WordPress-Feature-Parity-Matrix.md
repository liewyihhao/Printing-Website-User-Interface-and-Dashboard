# Part 6 — WordPress → New Project Feature Parity Matrix

**Honest status as of 2026-09-10.** This maps every feature in the **live WordPress/WooCommerce backup** (`Downloads/printoka.com/httpdocs/wp-content` — plugins + `themes/printoka` templates) to what is actually built in this project (`web/`). It is deliberately blunt so nothing is assumed done.

**Legend:** ✅ built & functional (verified) · 🟡 prototype only (screen renders, not wired to real logic) · ❌ not built · ⚪ N/A on a custom stack (WP infra replaced by the framework/host)

**Admin backoffice (2026-09-11):** the admin now mirrors the WordPress admin menu — grouped **Store / Content / Settings** with every WP item (Orders, Customers, Products, Coupons, Artworks, Custom Quote, Custom Invoice, Printing Job, Users & roles, Posts/Blog, Pages, Media, Downloads, FAQs, SEO·Rank Math, Pricing, Membership, TeraWallet·Credit, Payments, Tax, Couriers, Outlets, Follow-up, Marketing, WhatsApp, Notifications, Settings, API settings, Audit log). Data-backed & live: **Orders, Customers, Users & roles, Printing Job (outsource), Posts, TeraWallet credit, SEO/sitemap, Audit log, Products & catalogue**; the rest are scaffolded sections with the correct purpose. No super-admin; Director folded into admin.

**One-line verdict:** the project is a **complete visual prototype of all 26 screens + several real subsystems** (the pricing engine, the operations state-machine backend, and the catalogue admin). It is **not** yet WordPress feature-parity — payments, orders/checkout, wallet, address book, the quote-accept/PDF flow, the 9-status outsource/PO/Hub flow, real auth, multi-language routing, SEO/sitemap, and **the blog/SEO content migration** are still to build.

---

## A. Custom Printoka business-logic plugins

| WP plugin | Feature | Status | Where in project / gap |
|---|---|---|---|
| `printoka-api` | Impression-run pricing engine, 9+ product types, materials/variants | ✅ | `crawler/output/calculator_engine.cjs` → `web/pricing/engine.js`; 93 products priced, member tiers. Verified 89 priced / 4 quote-only / 0 broken. |
| `printoka-api` | Courier **region-based** shipping + multi-currency + SST/GST | 🟡 | Configurator shows a flat RM12 estimate + `fx()` currency display; real per-region courier calc + tax engine **not** built. |
| `printoka-add-roles` | outlet / prepress / production roles | ✅ | Rebuilt as RBAC in `web/server/domain.js` (11 roles incl. hub/printer/director). |
| `printoka-3rd-party-supplier` | Outsource vendor + **Hub**, printing-job lifecycle, **PO** on award, multi-printer quote requests | ✅ (2026-09-11) | **Vendor quotation flow built & verified**: Scheduler requests quotes from multiple vendors → vendors submit price + lead time → Scheduler compares (best highlighted) and **awards a PO** → winning vendor gets a **shipping label** (destination outlet + barcode) to print. Endpoints: `/api/jobs/:id/request-quotes|quote|award`, `/api/vendor/requests`, `/api/vendors`. (PO/label are on-screen, not yet PDF; per-step emails not built.) |
| `printoka-offline-invoice` | Quote Accept/Reject; Accept pays; invoice; **manual Custom Invoice** | ✅ (2026-09-11) | **Custom-quote lifecycle** (request → staff prices & issues → customer **Accept & pay**/**request changes**) + **printable Invoice + Order Slip** (Print/Save-PDF). **Custom Invoice** post-type built: admin/outlet **manually prepare an invoice** to a customer (number, date, status Unpaid/Paid/Cancelled, user, price, description, order id) → list with inline status + **View PDF**; customers see their own under Invoices & slips. Endpoints `/api/custom-invoices[/:id]`. Verified E2E (UI + API). |
| `printoka-quote-remarks` | Auto quote numbers, status, metrics, **manual quote + staff remarks** | ✅ (2026-09-11) | Real Quote entity, auto numbers (QT-####/Q-######), status machine + history, scoped views. **Manual custom quote** (admin/outlet prepare directly): product, qty, price, weight, lead time, free-text **quote-data body**, staff-only **remarks**, Staff/Outlet columns, **View PDF** (matches the WP quotation PDF). Endpoints `/api/quotes` (manual branch), `/api/quotes/:id/remark`. |
| `printoka-announcement` | Announcement bar: per-country/lang, schedulable, dismiss-state | 🟡 | Bar renders (static text); not admin-configurable, not per-country, no dismissal persistence. |
| `printoka-cleanup`, `lx-general` | WP-admin cleanup / shared framework | ⚪ | WP-internal; nothing to port. |

## B. Commerce & account (WooCommerce + extensions)

| WP plugin | Feature | Status | Where / gap |
|---|---|---|---|
| `woocommerce` | Cart, **checkout, real orders**, **management order view** | ✅ (2026-09-11) | **Real commerce loop:** configure → Add to cart → checkout → `POST /api/orders` → Order + linked Jobs at `intake` → confirmation → **jobs flow through the ops pipeline** → customer **tracks live status**. **Management order-detail view** (admin/outlet/production): click an order to open a modal with **artworks per line, full order details/spec, billing + shipping address, customer order history (total orders/revenue/AOV), price breakdown, payment proof (Stripe/iPay88 ref or bank-in slip), and Invoice + Order-slip PDFs** — matching the WP order screen. Orders enriched with `billing`/`shipTo`/`payment.reference|proof|gateway`/`item.artworks`; `orderView` computes customer history. Verified E2E. |
| `woocommerce-order-status-manager` | Custom order statuses | ✅ (reimplemented) | The ops state machine (`domain.js`) is the status engine. **Two order types wired (2026-09-11):** **web orders** route **straight to Prepress** once paid (no outlet step); **walk-in orders** are outlet-only — outlet signs the customer up + files a **quote request to the Scheduler**, who prices it back to the customer's account, and on conversion the order enters Prepress. Full **in-app notification chain** across every hop (see row below). |
| **NEW · order routing + notifications** | Two order types + role-to-role notifications | ✅ (2026-09-11) | **Web:** placed & paid → Prepress (Prepress notified). **Walk-in:** outlet `createWalkinQuote` (auto-creates the customer account + temp password) → Scheduler notified → Scheduler prices (`priceQuote`) → **customer + originating outlet notified** "quote sent" → customer views (`viewQuote`) → status `reviewed`, **outlet notified** → customer converts (`acceptQuote`) → order into Prepress, **outlet + Prepress notified**; or outlet records a decision (`recordQuoteDecision`: proceed/not_proceed/amend) → amendments go **back to the Scheduler**. **Follow-up-after-1-day** flag on the outlet's quote board for reviewed-but-undecided quotes. Notifications store (`notify`/`notificationsFor`, recipient = customer\|outlet\|role) with a bell panel on every customer + staff dashboard. Endpoints: `/api/notifications[/:id/read]`, `/api/quotes` (walk-in branch), `/api/quotes/:id/{view,decision}`. Verified E2E (UI + API): outlet files QT → scheduler prices → customer views & converts → order in Prepress, notifications correct at each hop. |
| `woocommerce-gateway-stripe` | Stripe payments | 🟡 (2026-09-10) | Checkout has a **payment gateway abstraction** (`payment.method` → order/job `paymentValidated` gate) with test-mode (validates immediately) + bank-transfer (pending → admin `POST /api/orders/:id/pay`). **Real Stripe keys/redirect not wired** — plugs into the `card_test` slot. |
| `woocommerce-gateway-ipay88-sha512` | iPay88 payments | 🟡 | Same abstraction (`ipay88` method slot); real iPay88 signing/redirect not wired. |
| `woo-wallet` (TeraWallet) | **Credit-balance ledger** (refunds, cashback, partial pay) | ✅ (2026-09-10) | Per-customer `creditBalance` + reason-coded `creditLedger` (REFUND/REFERRAL/ADJUSTMENT/ORDER_OFFSET, actor, running balance). `GET/POST /api/account/credit`; **applied at checkout as a server-capped offset** (verified: 100 credit on a 228 order → total 128, balance 190→90, ledger entry). Dashboard shows live balance + ledger. |
| `fr-address-book-for-woocommerce` | Address book + per-country validation | ✅ (2026-09-10) | Saved addresses (CRUD + default) on the account: `GET/POST/DELETE /api/account/addresses`, set-default. Dashboard address-book UI; **checkout picks a saved address**. Per-country field validation not yet enforced. |
| `woocommerce-follow-up-emails` | Follow-up / abandoned-cart emails | ❌ | Not built. |

## C. Accounts / auth / internationalization

| WP plugin | Feature | Status | Where / gap |
|---|---|---|---|
| — | **Email/password auth + sessions** | ✅ (2026-09-10) | **Real accounts:** register/login/logout/session via `POST /api/auth/*`, passwords hashed with node `crypto.scrypt` + salt, session tokens, `GET /api/auth/me`. Wired: `s_auth` forms, checkout prefill, **orders linked to the account**, dashboard order history (scoped to user), membership tier from the account drives pricing. Verified E2E (register→order→history→logout→login; wrong-pass 401). |
| `nextend-facebook-connect` | Facebook social login | 🟡 | Buttons present but disabled — OAuth keys plug into the social slots; email/password is fully functional. |
| — | Google login / OTP | 🟡 | Same — social/OTP slots stubbed; core auth works. |
| `polylang` + `polylang-slug` | **EN / ZH / MS**, translated URL slugs, hreflang | 🟡 | Language toggle swaps a handful of `t()` strings; no per-locale routing, translated content, or hreflang. |

## D. SEO / marketing / analytics

| WP plugin | Feature | Status | Gap |
|---|---|---|---|
| `seo-by-rank-math` | Meta tags, **XML sitemap**, schema (Product/Offer/FAQ) | 🟡 (2026-09-10) | **`/sitemap.xml` live (507 URLs)** + **479 programmatic city/service landing pages** (`web/content/seo-data.json`) render at their real migrated URLs (`/…-printing-<city>/`, `/au/…`). Still missing: per-page `<title>`/meta and JSON-LD schema (needs SSR/metadata — the SPA renders client-side). |
| `facebook-for-woocommerce`, `pixelyoursite`, `woocommerce-google-analytics-integration` | Marketing pixels / analytics | ❌ | Not built. |

## E. Content / support / tooling

| WP plugin | Feature | Status | Gap |
|---|---|---|---|
| `wpforms` | Contact Us form | 🟡 | Contact / Custom-Quote screen renders; no submit/routing. |
| `easy-table-of-contents` | Guide-page TOC | 🟡 | Learning Hub is demo. |
| `login-as-user` | Admin impersonate customer | ❌ | Not built. |
| `acf-fields-in-custom-table`, `w3-total-cache`, `ewww-image-optimizer`, `regenerate-thumbnails`, `safe-svg`, `wordfence`, `wp-mail-smtp`, `duplicate-page`, `post-types-order` | Perf / security / email / admin infra | ⚪ | Replaced by the custom stack + host; nothing to port. |

## F. Theme templates (public pages)

| Template | Page | Status | Gap |
|---|---|---|---|
| `template-home` | Homepage | ✅ | Functional (catalogue tiles, Browse-all). |
| `single-pri_product` / `single-products` | Product + configurator | ✅ | Real pricing. |
| `template-search` | Search | 🟡 | Demo results. |
| `template-about` | About | 🟡 | Static design. |
| `template-customquote` | Custom quote request | 🟡 | Screen only, no submit. |
| `template-upload` | **Standalone artwork upload** | 🟡 | Artwork checker screen; no real upload/malware-scan/preflight. |
| `template-guides` | Artwork guides content | 🟡 | Learning Hub demo; **guide content not migrated**. |
| `single-post` (blog) | **Blog / SEO articles** | ✅ (2026-09-10) | **All 24 real articles migrated** from the live site → `web/content/blog.json`; Learning Hub grid + article view live; real URLs `/blog/<slug>/` resolve. Re-run `node web/content/migrate-blog.mjs` to refresh. |
| `single-download` | Downloadable design templates | 🟡 | Product Templates tab lists sizes; actual files not migrated. |
| `template-corporate` | **B2B corporate-account page** | ❌ | Not built. |
| `template-partners` | Partners / affiliate page | ❌ | Not built. |
| `template-support` | Support page | ❌ | Not built (contact only). |
| `template-download-pdf` | Quote / invoice PDF retrieval | ❌ | No PDF generation anywhere. |
| `template-terms` / `template-plain` | Terms / legal pages | ❌ | Footer links only, no pages. |

---

## What IS real today (so it's not undersold)

1. **Pricing calculator** — the whole `printoka-api` cost model, wired and verified across 93 products.
2. **Operations backend** — a real job/quote **state machine** with hard gates (payment, artwork==order), RBAC, append-only audit log, priority rule; the Prepress→Scheduler→Logistics chain syncs one order across departments (verified), with a live Prepress file-check review popup.
3. **Catalogue admin** — display-name overrides + categories, persisted and audit-logged; Browse-all + category page.
4. **All 26 screens render** with zero dead buttons.

## The honest gap list, ranked by launch-criticality

1. **Real orders + checkout + payment** (Stripe/iPay88) — the storefront can't actually take money yet.
2. **Blog + SEO content migration + sitemap/meta/schema** — explicitly requested, entirely absent; also the audit's §9 rank-continuity risk.
3. **Real auth** (email/OTP + Facebook/Google) replacing the demo login.
4. **Quote lifecycle** (numbers, accept/reject, PDF) — `printoka-offline-invoice` + `printoka-quote-remarks`.
5. **Outsource/PO/Hub 9-status flow** — `printoka-3rd-party-supplier`.
6. **Credit-balance ledger** (TeraWallet) and **address book**.
7. **Multi-language URL routing** (Polylang replacement).
8. **Missing public pages**: corporate, partners, support, terms, download-pdf.
9. **Data migration** of real customers/orders/quotes/wallet balances (audit §9).

These map onto Phases 1–3 of the masterplan; this matrix is the concrete checklist to burn down.

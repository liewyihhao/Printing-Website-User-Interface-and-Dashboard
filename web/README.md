# Printoka — custom-stack web (design implementation)

Faithful implementation of the Claude Design **Printoka Platform** prototype, rebuilt
to run on a custom stack from local files — **no WordPress, no WooCommerce, no
dependency on Claude Design servers.**

This single app contains **all 24 platform screens** (the design ships them as
separate `.dc.html` files; here they're one navigable app):

Home · Category · Product & configurator · Artwork checker · Cart · Checkout ·
Order confirmation · Search · About · Sign in · Learning Hub · Membership ·
Custom quote · Customer dashboard · Order tracking · Invoices · Outlet dashboard ·
Prepress queue · Production queue · Logistics queue · Production Director ·
Inquiry CRM · **Admin backoffice** · Vendor / Hub portal.

## Run

```bash
python -m http.server 4611 --directory web
```

Then open http://localhost:4611 (or use the `printoka-web` preview in `.claude/launch.json`).

Navigate between screens with the **Pages** chip row under the header, or via the
in-page `data-go` links (mega menu, dashboards, footer). The Product configurator
has live, physics-based pricing that recalculates on every option change.

## How it's wired

| File | Role |
|---|---|
| `index.html` | Entry — loads React 18 (UMD, cdnjs), Montserrat, global CSS, mounts `PKComponent`. |
| `app.js` | The design's React source verbatim (`class Component`, all 24 `s_*` screens, helpers, demo pricing data). Two edits only: navigation switches screens in-app instead of redirecting to per-page files; `renderVals()` also exposes `activeRoute`. |
| `runtime.js` | `DCLogic` base class — replaces the Claude Design `{{ }}`/`sc-if`/`sc-for` templating runtime with plain React. Paints the shared shell (header, announcement, Pages row, spec annotation, footer, chat) from `renderVals()`. |
| `assets/` | Icons, product photos and flags extracted from the design bundle. |

The full decoded design (`Printoka Admin-Backoffice.dc.html` + extracted assets)
lives in `../design/` for reference.

## Brand tokens (from the design)

- Primary red `#E52220` (hover `#c71917`) · Amber `#FF9A2E`
- Ink `#212121` · Muted `#616161` · Hairline `#eaeaea`
- Type: **Montserrat** (300–700)

## Pricing engine (wired)

The **Product configurator is live** against the real calculator (93 products):

- `pricing/build.sh` generates `pricing/engine.js` (a `window.PricingEngine` global)
  from the calculator repo's `../crawler/output/calculator_engine.cjs`. The calculator
  repo stays the source of truth; `engine.js` is **generated and gitignored** (21 MB).
  Re-run `bash web/pricing/build.sh` whenever the calculator repo updates.
- `app.js` calls it via `pkProduct()` / `pkFields()` / `pkV()` / `pkQuote()`:
  real product picker, engine-driven option fields with conditional validity
  (fixpoint default resolution for dependent options), real prices, member-tier
  discount (design's 5-tier model applied to the engine's base `printoka_cash`),
  physics-based weight, engine notes, and a "Price on request" path for
  quote-only (`engine: "contact"`) products.

## Next steps

- **Outlet & Production dashboards → functional:** see
  `../docs/05-Outlet-Production-Dashboards-Build-Plan.md` (phased plan grounded in
  the two operations guidebooks). Needs the Phase-0 data/state/RBAC layer.
- Package into the Next.js/Node custom stack as the platform grows.
- Import remaining design screens (Home, Platform) if they differ from this file.

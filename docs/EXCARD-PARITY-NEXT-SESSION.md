# Excard → Printoka configurator parity — session handoff

**Goal:** bring Printoka's product configurator (`web/app.js`) to exact parity with Excard's live v4 order form, product by product. The user drives this by pasting an **Excard option screenshot** for a product; replicate it exactly (fields, options, conditional show/hide, sub-widgets, remarks) and verify prices to the cent.

## How this works (read first)
- **Engine = price only, not structure.** `crawler/output/calculator_engine.cjs` (→ `web/pricing/engine.js`) is trusted for price curves but NOT for option structure/validity/sub-widgets. The **live Excard form is the source of truth** for what options exist and how they behave.
- **Never edit the engine.** Replicate via the display-only `CFG_OVERRIDES` layer at the top of `web/app.js`, keyed by engine product name. Capabilities: `hide`, `hideWhen[key](cfg)`, `label`, `optLabel[field][val]`, `optionsOverride[field]` (array OR `(cfg,options)=>array`), `placeholder` (+`'quantity'`), `optGate[field](cfg,qty)` (validity), `remark`, `processDays`, `bestSellerQty`, `optImages[field]='assets/path/'`, `addFields:[{key,label,type,min,max,section,options,after,widget,showWhen}]` (showWhen supports `{field,value|values|notValues}` and `{all:[...]}`), `priceSub[field][val]='subVal'`, `priceAddon[field](cfg,qty)=RM`.
- **Custom widgets** live as methods dispatched from `renderField` via `def.widget`: `foilColours` (`foilColourPicker`), image picker (`optImages`), size simulator (`sizeSim`/`foldDiagram`). Add new widget types the same way.
- **Fast, reliable price capture (USE THIS):** on a logged-in `v4.excard.com.my/ordering/<slug>` page (Claude in Chrome), set `window.formEngine.fieldValues.*` then `await window.formEngine.calculatePrice()` (returns a promise, updates the DOM). Read the **CASH row (0% member)** from the price ladder. Do NOT drive DOM change events (≈3–5s each, throws validation modals). Do NOT extract/replay the API basic-auth key (the tools block it — drive the page's own calculatePrice).
- **Ordering URL map:** `crawler/excard_ordering_urls.json` (83 slugs). Flyer = `lo-loose-sheet` (offset) / `do-loose-sheet` (digital).
- **Verify workflow:** local dev server `node web/server/server.js` → Browser pane at `localhost:4611`; after each change `node --check web/app.js`, test in the pane, then push to the export repo (see below). Reads on `formEngine` need the Excard tab logged in.

## Pass criteria (per product)
1. **Structure** — every field present, in Excard's order, grouped in Excard's sections.
2. **Options** — each dropdown's option list matches exactly (labels included).
3. **Conditional validity** — show/hide + gated options match (e.g. field only available under certain upstream choices).
4. **Sub-widgets** — image pickers, swatch pickers, size/fold simulators, custom-size inputs match.
5. **Price to the cent vs Excard CASH** — sweep base at **MOQ / a mid qty / max qty** AND **each priced add-on** (don't trust the engine's `addonDeltas` list — it missed Silkscreen on Business Card). Match = pass.
6. **Weight + process days** follow Excard.

## Where things are pushed
Working tree: `C:/Users/User/OneDrive/Desktop/Printoka.com/web/app.js`.
Public repo (mirror + push): copy `web/app.js` (and any new assets) into `C:/Users/User/AppData/Local/Temp/printoka-ui-repo/web/…`, commit, `git push origin main` → https://github.com/liewyihhao/Printing-Website-User-Interface-and-Dashboard . (The repo excludes `server/data.json`, `node_modules`, `.next`, etc.)

## STATUS

### Business Card — DONE (reference product), except pricing for folds
- Sections General / Optional Finishing; row-by-row **custom Printoka dropdowns** (helper note inside the opened panel); Please-Select placeholders + price gated until chosen.
- Options relabeled to Excard ("(2 side coated)", "N Designs", etc.).
- **Silkscreen Spot UV**: validity gate (Matte-lam + Gloss 250/310 + qty≥300) AND pricing (`bcSilkDelta` curve captured live) — verified No/Front/Both = Excard cash.
- **Custom size** ("Other"): priced as standard 54×89 (`priceSub`), dimension-independent (verified 34 pairs); H/W inputs with Excard ranges.
- **Hot Stamping**: Excard's 9 options + **foil swatch pickers** (Front/Back × Colour 1/2, 6 colours) + Hot Stamping Block (None/Same Block) via `foilColours` widget.
- **Round Corner Position**: image picker (Excard RC0601–RC0615 JPGs in `web/assets/options/businesscard-roundcorner/`).
- **Thin/Fat Fold**: preset open sizes + Other custom (Thin H52-54/W110-178, Fat H70-89/W60-108); **Creasing** (Standard/Customised, min 10mm) with a live **crease/fold simulator** (`foldDiagram`).
- **Weight** physics-based (=Excard 1.62kg ref); **process days** = 1.
- Prices verified: base RM56.60 & +hole-punch RM71.60 @1000 = Excard cash.

### Business Card — INCOMPLETE (do next)
1. **Thin/Fat Fold pricing** — currently "Price on request" (engine quotes folds on request; Excard prices them). Capture Excard's fold prices via `formEngine.calculatePrice()` (cardType=thin_fold/fat_fold, the preset sizes + creasing) and wire a `priceSub`/`priceAddon` or a per-fold price map. Verify base + creasing at MOQ/mid/max.
2. **Verify Embossing price** vs Excard (only hole-punch was explicitly swept). Embossing is in the engine's addonDeltas — confirm the delta matches Excard cash at a few quantities; it also "adds 1 production day" per the remark.
3. **Order spec/cart line** doesn't yet include the new fields (foil colours `hs_front_1/2`, `hs_back_1/2`, `hs_block`, fold sizes, creasing, crease_add). Fold them into `addToCart`'s spec string and the order payload so a placed order carries them.

### Rollout — 92 products remaining, best-sellers first
Order: Flyer, Stickers/Labels, Booklets, Banners, Name Card variants, then the rest.
- **Flyer** (`Flyer (= Loose Sheet Litho)`, Excard `lo-loose-sheet`): override STARTED in CFG_OVERRIDES (labels, hide hs_size/hs_colour, placeholders, size optLabels; base price A4/GlossArtPaper128/4C/1000 = RM168.55 = Excard cash noted). NOT finished — complete the full structure/options/validity/add-on price sweep/images, then verify and push.
- Each subsequent product: capture live Excard (formEngine or DOM), diff vs engine, write the CFG_OVERRIDES entry + download any option images, run the price sweep, test in the pane, push.

## Continuation prompt (paste into a new session)
> Continue the Excard→Printoka configurator parity work on the Printoka.com project. Read the memory notes `excard-option-comparison-workflow`, `configurator-excard-parity`, and `docs/EXCARD-PARITY-NEXT-SESSION.md` for the method, the CFG_OVERRIDES override layer, the fast `formEngine.calculatePrice()` price-capture method, and current status. Business Card is the finished reference; its only gaps are (1) Thin/Fat Fold pricing, (2) verifying the Embossing price delta, and (3) flowing the new fields (foil colours, fold sizes, creasing) into the order/cart spec. Then resume the best-sellers-first rollout starting by finishing the Flyer (`lo-loose-sheet`) override. I will paste Excard option screenshots for each product — replicate each exactly in the configurator, verify prices to the cent against Excard's CASH row (sweep MOQ/mid/max + every add-on), test in the localhost:4611 preview, and push web/app.js to the mirror repo. Start the local dev server with `node web/server/server.js`, and use my logged-in Excard tab (Claude in Chrome) for live captures.

# Codex brief: every configurator option image and every packaging box image

Copy everything below the line into Codex.

---

You are making the product option images for the Printoka website (repo `liewyihhao/Printing-Website-User-Interface-and-Dashboard`, branch `main`). Printoka sells printing online in Malaysia. Every customer question in the product configurator is shown as a row of option cards: an image on top, the option label underneath. Today most cards either have no image (a grey tile with the label repeated) or show the wrong picture (an old generic photo reused for options that look different). Your job is to make one correct image for every option, plus images for the packaging box builder.

**Size of the job:**
- Configurator: 1,285 images covering 2,294 options across 93 products.
  - 674 have no image.
  - 342 replace a wrong old photo.
  - 269 are batch-1 images to check.
  - Plus one shared "Not Required" image, mapped to 119 options.
- Packaging: 65 box styles, each with a 3D render and a die-line (130 files), plus 22 builder option images.

## What to read first (in the repo)

1. `docs/image-requests/configurator-images.json`: the full list of configurator images to make. One `item` = one image. Each item has:
   - `imageId`, `suggestedFile`, `question`, `option`, `products`;
   - `status`: `missing` (no image today), `replace-old-photo` (shows an old generic photo that does not show this option), or `review-batch-1` (has an image from your previous batch: check it, and redo it only if it is wrong);
   - `mappings`: every exact `productId` + `fieldKey` + `option` the image serves. These strings are the binding keys; keep them byte-for-byte.
   - `currentImage`: what the card shows now (useful as a "what not to do" reference for `replace-old-photo`).
2. `docs/image-requests/packaging-images.json`: every box style in the packaging builder (`styles`) and every builder option (`builderOptions`).
3. `web/assets/configuration/integration-manifest.json`: your previous batch (145 images) as integrated, including its supplier warning and unresolved items. The output format you used last time (`outputs/configuration-images/manifest.json` + `CLAUDE-HANDOFF.md`) is the format to use again.
4. `web/product-images.js` (the `CFG` table) and `web/app.js` (`CFG_OVERRIDES`, `pkBuilder`, `pkbDieline`) only to understand how images are shown. Do not edit any repo file.

## Part A: configurator option images

Make the images in `configurator-images.json`, in this order: all `missing`, then all `replace-old-photo`, then review every `review-batch-1` item and redo only the wrong ones (say which and why).

Every image must show **exactly that option**, so a customer can tell the options apart by the picture alone:
- **Front vs Both vs Back**: lamination, spot UV, printing, hot stamping and embossing must visibly show the treated side(s): a front view plus a back view, or a turned corner.
- **Colour counts**: 1C vs 2C foil, 4C vs 1C print, and K/M spot colours must show the right number and colours of inks or foils.
- **Positions and sides**: hole punching side (with the mm edge named in the option), perforation side and line count, creasing lines and side, round corner positions (RC0601 to RC0615: which corners are rounded), patch and VDP positions on garments, sticker position, and roll direction (3/6/9/12 o'clock) must each be drawn as their own diagram.
- **Models**: model codes (envelopes OE/EV/IS/OP, folders FPF/FCD/FKF/FDF, paper bags PBG, pouches, money packets MP 10x, greeting cards c3ub to c16uc, wobblers W01P to W03L, badges BBD, hand fans PFS/PFM/PFL, hangers H01 to H03, POP displays, wind flags, desk calendars, garments) must match the real shape, proportions, window, gusset, handle or fold of that model. Look each one up on the supplier's public product page (see Rules) and draw that exact model.
- **Sizes**: show the product at its true proportions (width : height from the option text), consistent across a product's size list so bigger sizes read as bigger.
- **Papers and materials**: show the real surface (gloss sheen, matte, linen texture, kraft, canvas weave, non-woven, tarpaulin, NCR colours). Weights of the same stock (e.g. Gloss Art Paper 80/100/128/150gsm) may share one image. List every mapping it serves.
- **Not Required**: make one shared `Not Required.png` (item `cfg-none`): a calm, neutral "no finishing" visual, not a red cross or warning. It maps to every none-style option listed in that item.

If you cannot tell what an option looks like, do not guess. Put it in `unresolvedIssues` with what you checked.

## Part B: packaging box builder

For every style in `packaging-images.json` → `styles` (65 styles, codes like A001, B038, C001A, E049, K016X, L082, M013):
1. **Assembled 3D render** → `web/assets/packaging/<CODE>.png`: the closed box at a three-quarter angle, showing the tuck or lock type, window (when `window: true`), hanging hole (hanging styles), handle (gable), lid or tray, and dividers or inserts as named.
2. **Flat die-line** → `web/assets/packaging/<CODE>-dieline.svg`: the real flat layout of that style. Cut lines solid `#1BC5B4` 1.4px, crease lines dashed `#9aa4ad` 1px, with glue flap, tuck flaps, dust flaps, lock bottom and window cut-out where the style has them. Use a plain `viewBox`, no fills except white panels, and no text.
   - Styles with `aliasOf` can reuse the alias's images (say so in the manifest).
   - `existingReference` files are old photos in the repo that you may look at for shape only.

Then the builder option images in `builderOptions` (tuck Friction vs Slit, closure Concealed clasp vs Lock, left/right slot 1/2/3, dust flap 1/2/3, the two papers, five coatings, five extra finishings) → the `file` path given for each.

## Visual rules (same as your previous batch)

- PNG, 500 x 500 px, true transparent background (real alpha, no checkerboard, no white box), subject centred with about 8% margin, soft contact shadow only.
- One consistent look across the whole set: same camera angle per product type, same soft studio lighting, realistic print materials, no clutter, no hands, no people (garments on an invisible mannequin or flat lay).
- Printed surfaces may carry the original Printoka logo (`work/design-review/logo.png`, the full-colour raster, unchanged: never recoloured, redrawn or knocked out) or neutral artwork in the Printoka palette `#E52220 #F26722 #FDB813 #1BC5B4 #2F7FD1`.
- No words baked into images (the card already shows the label), except where the option *is* text (e.g. a font) or a dimension diagram needs small mm figures.
- Diagrams (positions, sides, sizes, roll direction, corners) use flat line art in the same style across the set: grey `#9aa4ad` outlines, the affected part highlighted in `#E52220`.

## Rules

- **Reference only, never copy.** Use the supplier's public pages (`v4.excard.com.my/ordering/<product>`, `www.excard.com.my/spec/...`, and their public spec PDFs) only to learn what each option physically is. Do not reuse, trace or crop their photos. No supplier names, logos, watermarks or URLs inside any image, file name or customer-visible text.
- **Supplier site is read-only.** Do not sign in, add to cart or Speedy List, check out, submit forms or call their pricing API. Just look at the public pages.
- Do not edit repo code, pricing or option lists. You only produce images and a manifest. Claude integrates them.
- Keep every `productId` / `fieldKey` / `option` mapping string exactly as given.

## Deliver

In your outputs folder (e.g. `outputs/configuration-images-batch-2/`):
- `assets/` with the PNGs/SVGs, named per `suggestedFile` (configurator) and per the `file` paths (packaging).
- `manifest.json` with the same schema as batch 1: one asset entry per file with `assetId` (use `imageId`), `name`, `file`, `repoTarget`, `mappings`, `status: created-pending-user-review`, `referenceUrls`, `description`, `sha256`, `width`, `height`, `transparentPixels`, `qa`. Packaging entries use `styleCode` + `kind` instead of `mappings`. Include `unresolvedIssues` and `optionBindings`.
- `CLAUDE-HANDOFF.md` listing source → `repoTarget` for every file.
- A review page and one contact sheet per product family, so the owner can approve or reject each image.
- Deliver in batches by product family (Loose Sheet family, Business Card, Booklets, Bill-Book/NCR, Stickers, Envelopes and Money Packets, Bags, Calendars, Display (banner, bunting, POP, wind flag, foamboard), Apparel, Packaging). Each batch must have its own manifest so it can be integrated and reviewed before the next.

## Still open from batch 1 (check while you are on those products)

- Digital Booklet (37) inner papers Gloss Art Card 230/250, Linen 240, Metal Ice 250, Simili 140 and Super White 240 have images that customers can't reach yet. Confirm on the supplier page under which cover/binding/size these papers are offered.
- Booklet cover "UV Varnish (Both)": confirm whether it is still offered (the supplier currently shows UV Front only on covers).
- Envelope A6: our option says 162mm x 114mm, but model OP6344NW's official size differed. Confirm the real size.

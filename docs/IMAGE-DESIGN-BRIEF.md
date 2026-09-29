# Printoka — Image Design Brief

A brief for designing every image the storefront needs. Each item says **where it lives in the code**, **the exact file path/name**, **what to draw**, and **the pixel spec**. Hand this to the design step.

---

## 1. How images work in this codebase (read first)

- Static files live under `web/assets/`. In the page they are referenced by relative path, e.g. `assets/products/business-card.jpg`, resolved through `window.__asset(path)`.
- **Product images** are all rendered by one helper: `art(kind, w)` in `web/app.js` (around line 1627). It maps a product/category `kind` to a filename:
  - `BY_NAME` (≈line 1628): exact product name → filename, e.g. `'Business Card': 'business-card.jpg'`.
  - `BY_KIND` (≈line 1644): category fallback → generic filename, e.g. `card`, `sticker`, `flyer`, `book`, `banner`, `box`, `cal`, `mug`.
  - Final fallback: `cards.jpg`.
- Display style for every product image: `aspectRatio: 4 / 3`, `objectFit: contain`, `background: #fff` (line ~1651). So art can be any aspect but reads best framed 4:3, and a transparent-background cutout sits cleanly on white.
- **To give a product its own image:** drop the file in `web/assets/products/<file>` and add a line to the `BY_NAME` map: `'<exact product name>': '<file>'`. Product names are the engine names (see the list in §5).

---

## 2. Brand & style guide

- **Primary red:** `#E52220`. Ink text `#212121`. Backgrounds off-white `#FAFAFA` / pale red wash `#fdf2f2`. Amber accent `#F5A623`-ish.
- **Product-photo style:** clean studio product shot or crisp vector-style render, subject centred, **transparent background** (PNG) so it floats on the white card. Consistent lighting and a soft ground shadow. No text baked into the image, no borders. One product per image.
- **Format:** PNG (transparent) for product cutouts; JPG only for full-bleed photographic scenes. Export at **2× the display size** for retina.
- Keep the set visually consistent — same angle language, same shadow, same scale rhythm — so a grid of them looks like one system.

---

## 3. Per-page image slots

### Home (`s_home`, `web/app.js` ~line 2044)
| Slot | Code | File(s) | Draw | Spec (2×) |
|---|---|---|---|---|
| Hero collage (4 tiles) | ~2060–2063, `art('card')`, `art('sticker')`, `art('box')`, `art('banner')` | `assets/products/business-card.jpg`, `car-sticker-single.png`, `gift-boxes.jpg`, `hanging-banners.jpg` | A hero-quality product shot each: a business card, a die-cut sticker, a printed carton/box, a roll-up banner | 4:3, ~800×600, transparent |
| Category grid covers (8) | `homeSteps`→ Shop-by-category ~2083, `art(cover)` | uses each category's first product image | One clean cover per category (Business Essentials, Flyers & Leaflets, Labels & Stickers, Books & Stationery, Cards & Invitations, Large Format, Packaging & Boxes, Apparel & Gifts) | 4:3, ~800×600, transparent |
| Best-sellers (8) | ~2095, `art(p[0])` | per product (see §5) | The best-seller product shots | 4:3, ~800×600, transparent |
| Learning Hub cards (3) | ~2114, **gradient placeholder** (`linear-gradient(120deg,#FAFAFA,#fdf2f2)`, no image) | **none yet** → e.g. `assets/learn/artwork-guides.png`, `paper-finishes.png`, `business-tips.png` | Simple editorial illustrations: (1) bleed/trim/safe-area diagram, (2) paper-weight/stock swatches, (3) a retail-launch/checklist scene | 2.33:1, ~840×360, JPG or PNG |

### Product page (`s_product` / configurator, ~line 3000)
| Slot | Code | File | Draw | Spec (2×) |
|---|---|---|---|---|
| Main product hero | ~3023, `art(prod.name)` | per product (§5) | The large product shot for the configured product | 4:3, ~1000×750, transparent |
| Round-corner option picker | `optImages.round_corner_position` → `assets/options/businesscard-roundcorner/RC0601…RC0615.jpg` | **exist (15 files)** | Already designed; only redraw if refreshing the set | ~1:1, ~300×300 |

### Category page (`s_category`, ~line 2843)
| Slot | Code | File | Draw | Spec (2×) |
|---|---|---|---|---|
| Product grid cards | ~2857, `art(p.engName)` | per product (§5) | Same product shots as elsewhere | 4:3, ~800×600, transparent |

### Learning Hub (`s_learn`, ~line 3385) & Article (`s_article`, ~line 3411)
| Slot | Code | File | Draw | Spec (2×) |
|---|---|---|---|---|
| Blog/topic card image | ~3399, **dashed placeholder box**, no image | **none yet** → `assets/blog/<slug>.png` (wire a `p.image` field on each post) | A topic cover per article (bleed guide, paper guide, etc.) matching the article subject | 2.33:1, ~840×360 |
| Article hero | `s_article` has **no hero image** | optional `assets/blog/<slug>-hero.png` | One wide hero per article | ~2:1, ~1200×600 |

### Packaging (`s_packaging`, ~line 2400+)
- Box visuals are **code-drawn SVG** via `dieline(kind)` (~line 2386) — **no image design needed**. Only the CTA/box-style icons use the icon set (§4).

### Social / SEO (site-wide)
| Slot | Code | File | Draw | Spec |
|---|---|---|---|---|
| Open Graph / Twitter share image | `applySEO` default `og:image` → currently `assets/products/business-card.jpg` | **replace with** `assets/social/og-default.png` | A branded 1200×630 share card: Printoka logo/red, tagline "Your exact print price, in seconds", a few product shots | **1200×630**, JPG/PNG |
| Favicon / app icon | `index.html` `<link rel=icon>` → `assets/icons/logomark.svg` | **exists** | Only redraw if rebranding | SVG + optional 512×512 PNG |

---

## 4. Icon set (`web/assets/icons/`) — mostly done
SVG UI icons already exist: `logomark`, `search`, `cart`, `user`, `menu`, `phone`, `dropdown`, `check-circle`, `upload-artwork`, `arrow-right`, `star-solid`, `whatsapp`, plus country flags. Redraw only if refreshing the icon style; they are functional and on-brand.

---

## 5. The main gap: 80 of 93 products share a generic image

Only these **13 products** have a dedicated `BY_NAME` image today: Business Card, Kad Kahwin, Greeting Card, Creative Cut Card, PVC Card, ID Card, Tent Card, Voucher, Bill Book, and a few more. **The other 80 render a generic category fallback** (a business-card, sticker, box, banner, etc. photo that is not actually that product), so product grids and product pages show the wrong picture.

**These 80 products each need a dedicated product image.** For each, add `'<name>': '<slug>.png'` to `BY_NAME` (app.js ~1628) and place the file at `assets/products/<slug>.png` (4:3, ~800×600, transparent, on-brand per §2):

Notepad — Litho · Envelope — Litho · Folder — Litho · L-Shape Plastic Folder · Wall Calendar — Litho · Arch File · Desk Calendar (Hard/Soft Stand) · Wire-O Wall Calendar · Bunting (Litho / Gear X / Round Base / Tripod) · Roll-Up Stand (Litho / Economy) · Wobbler · Canvas Tote Bag · Papan Kopi / Sachet Board · Pillow · Button Badge · Hand Fan · Hanger · Magnet · Hard Cover Menu · Standing Pouch (Litho / Kraft / with Spout) · Money Packet (Litho / Premium / Hot Stamping / Envelope) · Non-Woven Bag (plain / Laminated / RPET) · Stamp Chop · Mask Keeper · Sublimation Shirt · Cooler Bag · DTF Tote Bag With Zip · Heat Transfer Tote Bag · Toast Bag · 3-Side Seal Packaging · Vacuum Bag Packaging · Foamboard (Digital / with Magnet) · Foldable POP Display · POP Display · Wind Flag · Exclusive Leather Wire-O Notebook · Hard Cover Perfect Bind Notebook · X-ccessories · DTF Shirt · Silkscreen Shirt · Lanyard · Premium Desk Calendar · UV DTF Sticker (Digital) · Food Tray — Litho · Kraft Paper Bag · Kotak Cenderahati · Corporate Shirt · Jacket · Muslimah Sublimation · Sweatshirt & Hoodies · Cap — DTF · Roll Form Sticker · Static Cling Window Sticker · Car Sticker (Static Cling) · Kad Terima Kasih · Wire-O Notebook · Computer Form (NCR) · Bookmark · Letterhead — Litho · Bill-Book (NCR) · Label Sticker (Letterpress) · Loose Sheet (Litho / Digital) · Booklet — Digital · Brochure · Flyer · Customprint.

(Full machine-readable list is derivable from `PricingEngine.DATA.products[].name` cross-referenced against the `BY_NAME` keys in `art()`.)

---

## 6. Priority order (suggested)
1. **Learning Hub / blog card images** and the **Open Graph share image** — the only true placeholders customers see as blank/gradient or generic.
2. **Home hero collage (4)** and **8 category covers** — highest-traffic above-the-fold.
3. **Best-seller + top-20 product photos** — most-viewed products.
4. **Remaining product photos** — fill the 80-product gap over time.

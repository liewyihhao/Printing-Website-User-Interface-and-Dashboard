# OpenArt image prompts — Printoka product photos

Generated 2026-09-30 from an audit of every product image on the storefront.

## What the audit found

- **"Print Your … Online Now!" banners.** `web/assets/products/*.jpg` are orange promo banners with the sentence printed into the image. They were used by the home hero, the product fallback and search. **Fixed:** every one of those places now uses the clean original cut-outs, so none of these banners show anywhere any more.
- **"Greeting & Invitation Cards" placeholder.** `cards.jpg` (a Greeting & Invitation banner) stood in for 38 products with no photo. **Fixed:** those products now show a neutral logo tile until their new photo is ready (section A).
- **Wrong product photos.** **Fixed:** Gift Boxes showed a pouch (now the original die-cut box photo) and Die-Cut Creative Cards showed folded cards (now the original die-cut card photo). Custom Mugs, ID Cards and Tent Cards showed other products (button badge, key-card holder, folded business card); they now show the neutral tile and are in section A.
- **Shared photos.** 9 products still borrow another product's photo (section B). They are acceptable but not exact.

## House style (matches the good images: Standard Business Card, Button Badge, Hardcover Booklet, Presentation Folder)

- Pure white background, square, product at a three-quarter angle, soft contact shadow.
- Product in clean white with one curved five-stripe swoosh in a corner (red #E52220 → orange #F26722 → amber #FDB813 → teal #1BC5B4 → blue #2F7FD1).
- **No text in the image.** Image models garble text and logos. Generate without them, then add the Printoka "P" logomark (`web/assets/icons/logomark.svg`) small in the empty white area, as in the existing photos.

**Negative prompt (use for every image):**

```
text, words, letters, numbers, typography, headline, banner, logo, brand name, watermark, signature, QR code, busy background, coloured background, orange background, gradient background, scene, table, props, hands, people, faces, dramatic shadows, reflections, blur, low resolution, cropped product, distorted perspective, duplicate objects
```

**Settings:** a photorealistic model, 1:1, 2048 × 2048, export PNG. Keep the same seed across a batch for a consistent look.

**When done:** save each file with the name shown and tell me. I'll wire them in: one line each in `web/product-images.js`.

## A. Products with no photo of their own (41)

### 1. 3-Side Seal Packaging

**Save as:** `web/assets/products/3-side-seal-packaging.png`

**Prompt:**

```
Product photo of a flat three-side-seal sachet pouch in glossy laminated film, heat-sealed on three edges with a small tear notch, standing upright and turned slightly to show its thin sealed edge, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 2. Arch Files

**Save as:** `web/assets/products/arch-files.png`

**Prompt:**

```
Product photo of an A4 lever arch file with a laminated printed cover and a wide printed spine with a round finger hole, standing upright so both the front cover and the spine are visible, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 3. Bookmarks

**Save as:** `web/assets/products/bookmarks.png`

**Prompt:**

```
Product photo of three printed paper bookmarks (50 × 150 mm) with rounded corners, fanned out slightly overlapping, each with a small punched hole at the top, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 4. Cooler Bag

**Save as:** `web/assets/products/cooler-bag.png`

**Prompt:**

```
Product photo of an insulated cooler lunch bag with a zip-around top, a padded carry handle and a printed front panel, fabric texture visible, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 5. Corporate Shirts

**Save as:** `web/assets/products/corporate-shirts.png`

**Prompt:**

```
Product photo of a white short-sleeve collared polo shirt on an invisible (ghost) mannequin, with the swoosh printed as a small band on the left chest, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 6. Custom Caps

**Save as:** `web/assets/products/custom-caps.png`

**Prompt:**

```
Product photo of a white six-panel baseball cap with a curved brim, the swoosh printed on the front panel, turned so the front and one side are visible, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 7. Custom Jackets

**Save as:** `web/assets/products/custom-jackets.png`

**Prompt:**

```
Product photo of a light grey zip-up windbreaker jacket on an invisible (ghost) mannequin, with the swoosh printed on the left chest and down one sleeve, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 8. DTF T-Shirts

**Save as:** `web/assets/products/dtf-t-shirts.png`

**Prompt:**

```
Product photo of a white crew-neck cotton t-shirt on an invisible (ghost) mannequin, with a vivid full-colour direct-to-film chest print of the swoosh, slight film sheen on the print, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 9. DTF Tote Bag With Zip

**Save as:** `web/assets/products/dtf-tote-bag-with-zip.png`

**Prompt:**

```
Product photo of a natural off-white canvas tote bag with a zip closure along the top and two long handles, a full-colour print of the swoosh on the front, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 10. Foamboards

**Save as:** `web/assets/products/foamboards.png`

**Prompt:**

```
Product photo of an A2 portrait foam board sign standing at an angle, its 5 mm white foam core visible along the edge, the printed face showing the swoosh, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 11. Foldable POP Displays

**Save as:** `web/assets/products/foldable-pop-displays.png`

**Prompt:**

```
Product photo of a foldable corrugated cardboard floor display stand with three shelves and a tall printed header panel, printed white with the swoosh on the side panels, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 12. Food Trays

**Save as:** `web/assets/products/food-trays.png`

**Prompt:**

```
Product photo of an open white paperboard food tray (boat tray) with angled sides, empty, the swoosh printed on the outer side walls, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 13. Hanger (door hanger)

**Save as:** `web/assets/products/hanger.png`

**Prompt:**

```
Product photo of two printed door hanger cards (88 × 220 mm) with a round hole and a slit at the top, one lying over the other so the front and back are both visible, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 14. Hard-Stand Desk Calendars

**Save as:** `web/assets/products/hard-stand-desk-calendars.png`

**Prompt:**

```
Product photo of a desk calendar on a rigid triangular hardboard easel stand, wire-o bound along the top, the page showing a large white image area with the swoosh and an abstract grid of small blank squares below, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 15. Kraft Standing Pouches

**Save as:** `web/assets/products/kraft-standing-pouches.png`

**Prompt:**

```
Product photo of a brown kraft paper stand-up pouch with a zip-lock top and a flat bottom gusset, a white printed label panel on the front carrying the swoosh, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 16. L-Shape Folders

**Save as:** `web/assets/products/l-shape-folders.png`

**Prompt:**

```
Product photo of a frosted translucent plastic A4 L-shape document folder with a printed swoosh along the open corner, holding a blank white sheet inside, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 17. Magnet

**Save as:** `web/assets/products/magnet.png`

**Prompt:**

```
Product photo of two printed fridge magnets — one rectangular business-card size and one die-cut rounded shape — lying flat and slightly overlapping, thin black magnetic backing visible at the edges, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 18. Magnetic Foamboards

**Save as:** `web/assets/products/magnetic-foamboards.png`

**Prompt:**

```
Product photo of an A3 foam board panel standing at an angle with a thin black magnetic sheet laminated to the back, visible along the edge, the printed face showing the swoosh, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 19. Mask Keeper

**Save as:** `web/assets/products/mask-keeper.png`

**Prompt:**

```
Product photo of a folded printed paper face-mask keeper (card folder) standing half-open with a light blue disposable face mask tucked inside, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 20. Muslimah Sublimation Wear

**Save as:** `web/assets/products/muslimah-sublimation-wear.png`

**Prompt:**

```
Product photo of a long-sleeve loose-fit modest sports tunic top on an invisible (ghost) mannequin, with an all-over sublimated flowing swoosh pattern on white polyester, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 21. Papan Kopi / Sachet Board

**Save as:** `web/assets/products/papan-kopi-sachet-board.png`

**Prompt:**

```
Product photo of a printed cardboard sachet display board (537 × 334 mm) standing upright, with a row of die-cut slots from which strips of plain silver coffee sachets hang down, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 22. Pillow

**Save as:** `web/assets/products/pillow.png`

**Prompt:**

```
Product photo of a square 40 × 40 cm cushion with a printed cover, soft plump shape, the swoosh printed across one corner, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 23. POP Displays

**Save as:** `web/assets/products/pop-displays.png`

**Prompt:**

```
Product photo of a printed cardboard counter-top point-of-sale display stand with a tray base and a tall back header panel, the swoosh on the header, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 24. Premium Desk Calendars

**Save as:** `web/assets/products/premium-desk-calendars.png`

**Prompt:**

```
Product photo of a premium desk calendar with a linen-wrapped hard base, thick matte pages, wire-o bound on top, page showing the swoosh and an abstract grid of small blank squares, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 25. Silkscreen T-Shirts

**Save as:** `web/assets/products/silkscreen-t-shirts.png`

**Prompt:**

```
Product photo of a white crew-neck cotton t-shirt on an invisible (ghost) mannequin with a simple two-colour screen-printed swoosh (solid red and teal, flat ink) on the chest, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 26. Spouted Standing Pouches

**Save as:** `web/assets/products/spouted-standing-pouches.png`

**Prompt:**

```
Product photo of a glossy white stand-up pouch with a screw-cap spout at the top corner and a flat bottom gusset, the swoosh printed across the lower front, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 27. Stamp Chops

**Save as:** `web/assets/products/stamp-chops.png`

**Prompt:**

```
Product photo of a black self-inking rubber stamp (company chop) standing upright, next to a small white paper square showing a crisp red stamped impression of a plain circle, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 28. Standing Pouches

**Save as:** `web/assets/products/standing-pouches.png`

**Prompt:**

```
Product photo of a glossy white stand-up zip-lock pouch with a flat bottom gusset, the swoosh printed across the lower front, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 29. Sublimation T-Shirts

**Save as:** `web/assets/products/sublimation-t-shirts.png`

**Prompt:**

```
Product photo of a white polyester t-shirt on an invisible (ghost) mannequin with an all-over full-colour sublimated swoosh wave pattern running edge to edge, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 30. Sweatshirts & Hoodies

**Save as:** `web/assets/products/sweatshirts-hoodies.png`

**Prompt:**

```
Product photo of a white pullover hoodie with a kangaroo pocket and drawstrings on an invisible (ghost) mannequin, the swoosh printed on the chest, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 31. Toast Bags

**Save as:** `web/assets/products/toast-bags.png`

**Prompt:**

```
Product photo of a clear plastic bread bag with a printed front panel, holding a loaf of sliced white toast bread, the open end folded under, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 32. Vacuum Bags

**Save as:** `web/assets/products/vacuum-bags.png`

**Prompt:**

```
Product photo of a clear embossed vacuum sealer bag lying flat at a slight angle, with a white printed label panel carrying the swoosh, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 33. Wall Calendars

**Save as:** `web/assets/products/wall-calendars.png`

**Prompt:**

```
Product photo of a saddle-stitched wall calendar hanging flat with a punched hanging hole, the top page a large white image area with the swoosh and the lower page an abstract grid of small blank squares, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 34. Wind Flags

**Save as:** `web/assets/products/wind-flags.png`

**Prompt:**

```
Product photo of a tall feather-shaped wind flag on a flexible pole with a cross base, printed fabric showing a white field with the swoosh, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 35. Wire-O Notebooks

**Save as:** `web/assets/products/wire-o-notebooks.png`

**Prompt:**

```
Product photo of an A5 notebook with silver wire-o binding along the left edge and a printed soft cover, lying at an angle, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 36. Wire-O Wall Calendars

**Save as:** `web/assets/products/wire-o-wall-calendars.png`

**Prompt:**

```
Product photo of a wall calendar bound with silver wire-o along the top edge with a metal hanger hook, the page showing the swoosh above an abstract grid of small blank squares, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 37. Wobblers

**Save as:** `web/assets/products/wobblers.png`

**Prompt:**

```
Product photo of two printed shelf wobblers — small round printed cards on clear flexible plastic strips — shown standing on their clip ends, one tilted as if wobbling, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 38. Custom Mugs

**Save as:** `web/assets/products/custom-mugs.png`

**Prompt:**

```
Product photo of a white glossy ceramic 11 oz mug with a wrap-around printed swoosh, handle on the right, turned slightly, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 39. ID Cards

**Save as:** `web/assets/products/id-cards.png`

**Prompt:**

```
Product photo of a portrait PVC ID card (54 × 86 mm) with a slot punch at the top and an empty light grey photo box, a second card behind it showing the back, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 40. Tent Cards

**Save as:** `web/assets/products/tent-cards.png`

**Prompt:**

```
Product photo of an A-frame folded tent card (table talker) standing on its folded edge, both printed faces showing the swoosh, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 41. X-ccessories

**Save as:** `web/assets/products/x-ccessories.png`

**Prompt:**

```
Product photo of [CONFIRM WHAT THIS PRODUCT IS BEFORE GENERATING — describe the object here], shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

## B. Products borrowing another product's photo (9)

### 42. Hard Cover Menus

**Save as:** `web/assets/products/hard-cover-menus.png`

**Prompt:**

```
Product photo of an A4 hardcover restaurant menu book standing slightly open, thick rigid printed cover with rounded spine, the swoosh on the cover — currently shows the Hardcover Booklet photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 43. Hardcover Notebooks

**Save as:** `web/assets/products/hardcover-notebooks.png`

**Prompt:**

```
Product photo of an A5 hardcover notebook with rounded corners, a black elastic closure band and a ribbon bookmark, the swoosh on the cover — currently shows the Hardcover Booklet photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 44. Static Cling Window Stickers

**Save as:** `web/assets/products/static-cling-window-stickers.png`

**Prompt:**

```
Product photo of a clear static-cling window decal half peeled off its glossy backing sheet, the printed swoosh decal slightly curled — currently shows the Car Window Sticker photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 45. Buntings

**Save as:** `web/assets/products/buntings.png`

**Prompt:**

```
Product photo of a tall vertical fabric pole bunting with a printed banner (white with the swoosh) on a telescopic pole with a weighted base — currently shares the Stand Banner photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 46. Bunting — Gear X Stand

**Save as:** `web/assets/products/bunting-gear-x-stand.png`

**Prompt:**

```
Product photo of an X-frame banner stand with four tensioned rods holding a portrait printed banner (white with the swoosh), shown slightly from the side so the X-frame is visible — currently shares the Stand Banner photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 47. Bunting — Round Base Stand

**Save as:** `web/assets/products/bunting-round-base-stand.png`

**Prompt:**

```
Product photo of a vertical bunting on a telescopic pole with a heavy round chrome base and a top cross-arm, printed banner white with the swoosh — currently shares the Stand Banner photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 48. Bunting — Tripod Stand

**Save as:** `web/assets/products/bunting-tripod-stand.png`

**Prompt:**

```
Product photo of a vertical bunting banner hanging from a black tripod stand with three legs and a top cross-bar, printed banner white with the swoosh — currently shares the Stand Banner photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 49. Economy Roll-Up Stands

**Save as:** `web/assets/products/economy-roll-up-stands.png`

**Prompt:**

```
Product photo of a lightweight economy roll-up banner stand with a slim silver aluminium base and single support pole, the printed banner white with the swoosh — currently shares the Roll-Up Banner photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

### 50. Hot Stamping Labels

**Save as:** `web/assets/products/hot-stamping-labels.png`

**Prompt:**

```
Product photo of a sheet of round white labels with the swoosh stamped in shiny metallic gold foil, two labels peeled up — currently shows the plain Round Corner Sticker photo, shown at a three-quarter angle from slightly above, centred with generous margin, on a pure white seamless background (#FFFFFF) with a soft natural contact shadow directly underneath. The printed design is minimal and on-brand: mostly clean white, with one curved multi-colour swoosh band sweeping across one corner in five parallel stripes — red #E52220, orange #F26722, amber #FDB813, teal #1BC5B4 and blue #2F7FD1 — and a small empty white area where a logo will be added later. Photorealistic 3D product mockup, soft diffuse high-key studio lighting, crisp edges, true-to-life material texture, commercial e-commerce packshot, square 1:1, 2048×2048.
```

/* Printoka storefront catalogue — display-name overrides + category assignment.
   Display-only: the pricing engine still resolves by the underlying product id.
   Editable in Admin → Products & catalogue (persisted via /api/catalogue). */
window.PrintokaCatalogueDefaults = {
 "categories": [
  {
   "id": "business-essentials",
   "label": "Business Essentials"
  },
  {
   "id": "flyers-leaflets",
   "label": "Flyers & Leaflets"
  },
  {
   "id": "labels-stickers",
   "label": "Labels & Stickers"
  },
  {
   "id": "books-stationery",
   "label": "Books & Stationery"
  },
  {
   "id": "cards-invitations",
   "label": "Cards & Invitations"
  },
  {
   "id": "large-format",
   "label": "Large Format"
  },
  {
   "id": "packaging-boxes",
   "label": "Packaging & Boxes"
  },
  {
   "id": "apparel-gifts",
   "label": "Apparel & Gifts"
  }
 ],
 "overrides": {
  "1": {
   "displayName": "Business Cards",
   "slug": "business-cards",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "104": {
   "displayName": "Notepads",
   "slug": "notepads",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "106": {
   "displayName": "Envelopes",
   "slug": "envelopes",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "107": {
   "displayName": "Presentation Folders",
   "slug": "presentation-folders",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "108": {
   "displayName": "L-Shape Folders",
   "slug": "l-shape-folders",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "118": {
   "displayName": "Wall Calendars",
   "slug": "wall-calendars",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "119": {
   "displayName": "Arch Files",
   "slug": "arch-files",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "120": {
   "displayName": "Hard-Stand Desk Calendars",
   "slug": "hard-stand-desk-calendars",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "121": {
   "displayName": "Soft-Stand Desk Calendars",
   "slug": "soft-stand-desk-calendars",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "122": {
   "displayName": "Wire-O Wall Calendars",
   "slug": "wire-o-wall-calendars",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "123": {
   "displayName": "PVC Banners",
   "slug": "pvc-banners",
   "categoryId": "large-format",
   "hidden": false
  },
  "124": {
   "displayName": "Buntings",
   "slug": "buntings",
   "categoryId": "large-format",
   "hidden": false
  },
  "125": {
   "displayName": "Roll-Up Stands",
   "slug": "roll-up-stands",
   "categoryId": "large-format",
   "hidden": false
  },
  "126": {
   "displayName": "Wobblers",
   "slug": "wobblers",
   "categoryId": "large-format",
   "hidden": false
  },
  "127": {
   "displayName": "Paper Bags",
   "slug": "paper-bags",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "128": {
   "displayName": "Canvas Tote Bags",
   "slug": "canvas-tote-bags",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "129": {
   "displayName": "Custom Mugs",
   "slug": "custom-mugs",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "130": {
   "displayName": "Papan Kopi / Sachet Board",
   "slug": "papan-kopi-sachet-board",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "131": {
   "displayName": "Pillow",
   "slug": "pillow",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "132": {
   "displayName": "Button Badges",
   "slug": "button-badges",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "133": {
   "displayName": "Hand Fans",
   "slug": "hand-fans",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "134": {
   "displayName": "Hanger",
   "slug": "hanger",
   "categoryId": "large-format",
   "hidden": false
  },
  "135": {
   "displayName": "Magnet",
   "slug": "magnet",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "136": {
   "displayName": "Hard Cover Menus",
   "slug": "hard-cover-menus",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "137": {
   "displayName": "Standing Pouches",
   "slug": "standing-pouches",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "138": {
   "displayName": "Money Packets",
   "slug": "money-packets",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "139": {
   "displayName": "Non-Woven Bags",
   "slug": "non-woven-bags",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "140": {
   "displayName": "Tent Cards",
   "slug": "tent-cards",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "141": {
   "displayName": "Stamp Chops",
   "slug": "stamp-chops",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "142": {
   "displayName": "Mask Keeper",
   "slug": "mask-keeper",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "143": {
   "displayName": "Sublimation T-Shirts",
   "slug": "sublimation-t-shirts",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "144": {
   "displayName": "Cooler Bag",
   "slug": "cooler-bag",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "145": {
   "displayName": "DTF Tote Bag With Zip",
   "slug": "dtf-tote-bag-with-zip",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "146": {
   "displayName": "Heat Transfer Tote Bag",
   "slug": "heat-transfer-tote-bag",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "147": {
   "displayName": "Laminated Non-Woven Bags",
   "slug": "laminated-non-woven-bags",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "148": {
   "displayName": "RPET Non-Woven Bags",
   "slug": "rpet-non-woven-bags",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "149": {
   "displayName": "Toast Bags",
   "slug": "toast-bags",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "150": {
   "displayName": "3-Side Seal Packaging",
   "slug": "3-side-seal-packaging",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "151": {
   "displayName": "Kraft Standing Pouches",
   "slug": "kraft-standing-pouches",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "152": {
   "displayName": "Spouted Standing Pouches",
   "slug": "spouted-standing-pouches",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "153": {
   "displayName": "Vacuum Bags",
   "slug": "vacuum-bags",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "154": {
   "displayName": "Foamboards",
   "slug": "foamboards",
   "categoryId": "large-format",
   "hidden": false
  },
  "155": {
   "displayName": "Magnetic Foamboards",
   "slug": "magnetic-foamboards",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "156": {
   "displayName": "Foldable POP Displays",
   "slug": "foldable-pop-displays",
   "categoryId": "large-format",
   "hidden": false
  },
  "157": {
   "displayName": "POP Displays",
   "slug": "pop-displays",
   "categoryId": "large-format",
   "hidden": false
  },
  "158": {
   "displayName": "Wind Flags",
   "slug": "wind-flags",
   "categoryId": "large-format",
   "hidden": false
  },
  "159": {
   "displayName": "Economy Roll-Up Stands",
   "slug": "economy-roll-up-stands",
   "categoryId": "large-format",
   "hidden": false
  },
  "160": {
   "displayName": "Bunting — Gear X Stand",
   "slug": "bunting-gear-x-stand",
   "categoryId": "large-format",
   "hidden": false
  },
  "161": {
   "displayName": "Bunting — Round Base Stand",
   "slug": "bunting-round-base-stand",
   "categoryId": "large-format",
   "hidden": false
  },
  "162": {
   "displayName": "Bunting — Tripod Stand",
   "slug": "bunting-tripod-stand",
   "categoryId": "large-format",
   "hidden": false
  },
  "163": {
   "displayName": "Leather Wire-O Notebooks",
   "slug": "leather-wire-o-notebooks",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "164": {
   "displayName": "Hardcover Notebooks",
   "slug": "hardcover-notebooks",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "165": {
   "displayName": "Die-Cut Creative Cards",
   "slug": "die-cut-creative-cards",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "166": {
   "displayName": "Greeting Cards",
   "slug": "greeting-cards",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "167": {
   "displayName": "Premium Money Packet",
   "slug": "premium-money-packet",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "168": {
   "displayName": "Hot Stamping Money Packet",
   "slug": "hot-stamping-money-packet",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "169": {
   "displayName": "Envelope Money Packet",
   "slug": "envelope-money-packet",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "170": {
   "displayName": "ID Cards",
   "slug": "id-cards",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "171": {
   "displayName": "X-ccessories",
   "slug": "x-ccessories",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "172": {
   "displayName": "DTF T-Shirts",
   "slug": "dtf-t-shirts",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "173": {
   "displayName": "Silkscreen T-Shirts",
   "slug": "silkscreen-t-shirts",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "174": {
   "displayName": "Lanyards",
   "slug": "lanyards",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "175": {
   "displayName": "Premium Desk Calendars",
   "slug": "premium-desk-calendars",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "176": {
   "displayName": "UV DTF Stickers",
   "slug": "uv-dtf-stickers",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "177": {
   "displayName": "Food Trays",
   "slug": "food-trays",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "178": {
   "displayName": "Kraft Paper Bags",
   "slug": "kraft-paper-bags",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "179": {
   "displayName": "Gift Boxes",
   "slug": "gift-boxes",
   "categoryId": "packaging-boxes",
   "hidden": false
  },
  "180": {
   "displayName": "Corporate Shirts",
   "slug": "corporate-shirts",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "181": {
   "displayName": "Custom Jackets",
   "slug": "custom-jackets",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "182": {
   "displayName": "Muslimah Sublimation Wear",
   "slug": "muslimah-sublimation-wear",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "183": {
   "displayName": "Sweatshirts & Hoodies",
   "slug": "sweatshirts-hoodies",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "185": {
   "displayName": "Custom Caps",
   "slug": "custom-caps",
   "categoryId": "apparel-gifts",
   "hidden": false
  },
  "184": {
   "displayName": "Roll Form Stickers",
   "slug": "roll-form-stickers",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "116": {
   "displayName": "Static Cling Window Stickers",
   "slug": "static-cling-window-stickers",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "117": {
   "displayName": "Car Window Stickers",
   "slug": "car-window-stickers",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "115": {
   "displayName": "Thank You Cards",
   "slug": "thank-you-cards",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "114": {
   "displayName": "Wedding Invitation Cards",
   "slug": "wedding-invitation-cards",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "113": {
   "displayName": "PVC Cards",
   "slug": "pvc-cards",
   "categoryId": "cards-invitations",
   "hidden": false
  },
  "112": {
   "displayName": "Wire-O Notebooks",
   "slug": "wire-o-notebooks",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "111": {
   "displayName": "Computer Forms (NCR)",
   "slug": "computer-forms-ncr",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "110": {
   "displayName": "Vouchers & Tickets",
   "slug": "vouchers-tickets",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "109": {
   "displayName": "Bookmarks",
   "slug": "bookmarks",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "105": {
   "displayName": "Letterheads",
   "slug": "letterheads",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "24": {
   "displayName": "NCR Bill Books",
   "slug": "ncr-bill-books",
   "categoryId": "business-essentials",
   "hidden": false
  },
  "60": {
   "displayName": "Digital Stickers & Labels",
   "slug": "digital-stickers-labels",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "61": {
   "displayName": "Hot Stamping Labels",
   "slug": "hot-stamping-labels",
   "categoryId": "labels-stickers",
   "hidden": false
  },
  "21": {
   "displayName": "Offset Loose Sheets",
   "slug": "offset-loose-sheets",
   "categoryId": "flyers-leaflets",
   "hidden": false
  },
  "50": {
   "displayName": "Digital Loose Sheets",
   "slug": "digital-loose-sheets",
   "categoryId": "flyers-leaflets",
   "hidden": false
  },
  "19": {
   "displayName": "Offset Printing Booklets",
   "slug": "offset-printing-booklets",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "37": {
   "displayName": "Digital Printing Booklets",
   "slug": "digital-printing-booklets",
   "categoryId": "books-stationery",
   "hidden": false
  },
  "101": {
   "displayName": "Brochures",
   "slug": "brochures",
   "categoryId": "flyers-leaflets",
   "hidden": false
  },
  "102": {
   "displayName": "Flyers & Leaflets",
   "slug": "flyers-leaflets",
   "categoryId": "flyers-leaflets",
   "hidden": false
  },
  "103": {
   "displayName": "Custom Printing",
   "slug": "custom-printing",
   "categoryId": "flyers-leaflets",
   "hidden": false
  }
 }
};
